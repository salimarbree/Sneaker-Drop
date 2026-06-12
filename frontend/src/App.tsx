import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { api } from "./api";
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./context/AuthContext";
import DropCard from "./components/DropCard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import type { Drop, StockUpdateEvent, PurchaseEvent } from "./types";

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-red-400"
        }`}
      />
      <span className="text-gray-400 font-medium">
        {connected ? "Live" : "Disconnected"}
      </span>
    </div>
  );
}

function Pagination({ 
  page, 
  totalPages, 
  onPageChange 
}: { 
  page: number; 
  totalPages: number; 
  onPageChange: (p: number) => void 
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
              p === page
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

function HomePage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();
  const { user } = useAuth();

  const fetchDrops = useCallback(async (page = 1) => {
    try {
      const res = await api.getDrops(page, 6);
      setDrops(res.data);
      setPagination({
        page: res.pagination.page,
        totalPages: res.pagination.totalPages,
        total: res.pagination.total,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrops(1);
  }, [fetchDrops]);

  useEffect(() => {
    const unsubStock = on<StockUpdateEvent>("stock:updated", (data) => {
      setDrops((prev) =>
        prev.map((d) =>
          d.id === data.dropId ? { ...d, availableStock: data.availableStock } : d
        )
      );
    });

    const unsubPurchase = on<PurchaseEvent>("purchase:new", (data) => {
      setDrops((prev) =>
        prev.map((d) => {
          if (d.id !== data.dropId) return d;
          const newPurchases = [
            { user: { username: data.username }, createdAt: data.createdAt },
            ...(d.purchases || []),
          ].slice(0, 3);
          return { ...d, purchases: newPurchases };
        })
      );
    });

    const unsubDrop = on<Drop>("drop:created", () => {
      fetchDrops(pagination.page);
    });

    const pollTimer = setInterval(() => fetchDrops(pagination.page), 5000);

    return () => {
      unsubStock();
      unsubPurchase();
      unsubDrop();
      clearInterval(pollTimer);
    };
  }, [on, fetchDrops, pagination.page]);

  const handleStockUpdate = (_dropId: string, _stock: number) => {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-gray-900" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-400 font-medium">Loading drops...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero section */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Latest Drops
          </h2>
          <p className="text-gray-500 mt-2 max-w-lg">
            High-demand sneaker releases with real-time inventory tracking. 
            Reserve yours before they are gone.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Total Drops</span>
            <span className="font-bold text-gray-900 tabular-nums">{pagination.total}</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Status</span>
            <ConnectionBadge connected={window.__socket?.connected ?? false} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {drops.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-5xl mb-4 opacity-30">📦</div>
          <h3 className="text-lg font-semibold text-gray-400 mb-1">
            No drops available
          </h3>
          <p className="text-sm text-gray-300">
            Check back later for new releases
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                userId={user?.id}
                onStockUpdate={handleStockUpdate}
              />
            ))}
          </div>

          <Pagination 
            page={pagination.page} 
            totalPages={pagination.totalPages} 
            onPageChange={fetchDrops} 
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-900" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-lg select-none group-hover:scale-105 transition-transform">
                👟
              </div>
              <div>
                <h1 className="text-base font-black text-gray-900 leading-tight uppercase tracking-tight">
                  Sneaker Drop
                </h1>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-tight">
                  Real-time inventory
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4 mr-2">
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-wider transition-colors"
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-wider transition-colors"
                    >
                      Profile
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-gray-900 leading-none mb-0.5">@{user.username}</p>
                      <button 
                        onClick={logout}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-tight cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {user.username[0].toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-50 mt-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 grayscale opacity-50">
             <div className="w-6 h-6 bg-gray-900 rounded-lg flex items-center justify-center text-xs">👟</div>
             <span className="text-sm font-black uppercase tracking-tighter">Sneaker Drop</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            &copy; 2026 Sneaker Drop System &middot; Built for high-velocity inventory management
          </p>
        </div>
      </footer>
    </div>
  );
}
