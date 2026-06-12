import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { api } from "./api";
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./context/AuthContext";
import DropCard from "./components/DropCard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
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

function HomePage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, on } = useSocket();
  const { user } = useAuth();

  const fetchDrops = useCallback(async () => {
    try {
      const data = await api.getDrops();
      setDrops(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    api.getDrops()
      .then(setDrops)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

    const unsubDrop = on<Drop>("drop:created", (data) => {
      setDrops((prev) => [data, ...prev]);
    });

    const pollTimer = setInterval(fetchDrops, 3000);

    return () => {
      unsubStock();
      unsubPurchase();
      unsubDrop();
      clearInterval(pollTimer);
    };
  }, [on, fetchDrops]);

  const handleStockUpdate = (_dropId: string, _stock: number) => {};

  const totalAvailable = drops.reduce((s, d) => s + d.availableStock, 0);
  const totalSold = drops.reduce((s, d) => s + (d.totalStock - d.availableStock), 0);

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
    <>
      {/* Stats bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-400">Active drops</span>
            <span className="ml-2 font-bold text-gray-900 tabular-nums">{drops.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Available</span>
            <span className="ml-2 font-bold text-emerald-600 tabular-nums">{totalAvailable}</span>
          </div>
          <div>
            <span className="text-gray-400">Sold</span>
            <span className="ml-2 font-bold text-gray-900 tabular-nums">{totalSold}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {drops.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">📦</div>
            <h3 className="text-lg font-semibold text-gray-400 mb-1">
              No drops available
            </h3>
            <p className="text-sm text-gray-300">
              Create a drop via{" "}
              <code className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                POST /api/drops
              </code>
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                userId={user?.id}
                onStockUpdate={handleStockUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-sm select-none">
                👟
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  Sneaker Drop
                </h1>
                <p className="text-[11px] text-gray-400 leading-tight">
                  Real-time inventory
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    @{user.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm text-gray-900 font-semibold hover:underline"
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
      </Routes>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-gray-100 mt-8">
        <p className="text-xs text-gray-300 text-center">
          Sneaker Drop &middot; Real-Time Inventory System
        </p>
      </footer>
    </div>
  );
}
