import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import type { Drop, StockUpdateEvent, PurchaseEvent, ReservationExpiredEvent } from "../types";

const STOCK_LOW = 3;
const RESERVATION_SECONDS = 60;

type Status = "idle" | "reserving" | "reserved" | "purchasing" | "purchased";

interface RecentBuyer {
  user: { username: string };
  createdAt: string;
}

interface Props {
  drop: Drop;
  userId: string | undefined;
  onStockUpdate: (dropId: string, stock: number) => void;
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function Medals({ rank }: { rank: number }) {
  const icons = ["🥇", "🥈", "🥉"];
  return <span>{icons[rank] || "🏆"}</span>;
}

export default function DropCard({ drop, userId, onStockUpdate }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [availableStock, setAvailableStock] = useState(drop.availableStock);
  const [recentBuyers, setRecentBuyers] = useState<RecentBuyer[]>(drop.purchases || []);
  const [animatingStock, setAnimatingStock] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAvailableStock(drop.availableStock);
    setRecentBuyers(drop.purchases || []);
  }, [drop]);

  useEffect(() => {
    const handleStockUpdate = (data: StockUpdateEvent) => {
      if (data.dropId !== drop.id) return;
      setAnimatingStock(true);
      setAvailableStock(data.availableStock);
      onStockUpdate(drop.id, data.availableStock);
      setTimeout(() => setAnimatingStock(false), 600);
    };

    const handlePurchase = (data: PurchaseEvent) => {
      if (data.dropId !== drop.id) return;
      setRecentBuyers((prev) => {
        const next = [
          { user: { username: data.username }, createdAt: data.createdAt },
          ...prev,
        ].slice(0, 3);
        return next;
      });
    };

    const handleReservationExpired = (data: ReservationExpiredEvent) => {
      if (data.dropId === drop.id && data.reservationId === reservationId) {
        setStatus("idle");
        setReservationId(null);
        setCountdown(null);
        toast("Reservation expired", { icon: "⏰" });
      }
    };

    const socket = window.__socket;
    if (!socket) return;

    socket.on("stock:updated", handleStockUpdate);
    socket.on("purchase:new", handlePurchase);
    socket.on("reservation:expired", handleReservationExpired);

    return () => {
      socket.off("stock:updated", handleStockUpdate);
      socket.off("purchase:new", handlePurchase);
      socket.off("reservation:expired", handleReservationExpired);
    };
  }, [drop.id, onStockUpdate, reservationId]);

  useEffect(() => {
    if (status === "reserved" && countdown != null) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev == null || prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setStatus("idle");
            setReservationId(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  const handleReserve = async () => {
    if (!userId) {
      toast.error("Select a user first");
      return;
    }
    setStatus("reserving");
    try {
      const data = await api.reserve(userId, drop.id);
      setReservationId(data.reservation.id);
      setStatus("reserved");
      setCountdown(RESERVATION_SECONDS);
      setAvailableStock(data.availableStock);
      toast.success("Item reserved! Complete purchase within 60s.");
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof Error ? err.message : "Failed to reserve", { duration: 4000 });
    }
  };

  const handlePurchase = async () => {
    if (!reservationId) return;
    setStatus("purchasing");
    try {
      const data = await api.purchase(userId!, drop.id, reservationId);
      setStatus("purchased");
      setCountdown(null);
      setAvailableStock(data.availableStock);
      if (countdownRef.current) clearInterval(countdownRef.current);
      toast.success("Purchase successful!");
    } catch (err) {
      setStatus("reserved");
      toast.error(err instanceof Error ? err.message : "Purchase failed", { duration: 4000 });
    }
  };

  const isLow = availableStock <= STOCK_LOW && availableStock > 0;
  const isOut = availableStock <= 0;
  const stockPercent = Math.min(100, (availableStock / drop.totalStock) * 100);
  const countdownPercent = countdown != null ? (countdown / RESERVATION_SECONDS) * 100 : 100;
  const countdownUrgent = countdown != null && countdown <= 10;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md group">
      {/* Header image area */}
      <div className="relative h-44 bg-gradient-to-br from-indigo-900 via-gray-900 to-slate-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="text-6xl transform group-hover:scale-110 transition-transform duration-300 select-none">
          👟
        </div>

        {/* Stock badge */}
        <div className="absolute top-3 right-3">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm backdrop-blur-sm ${
              isOut
                ? "bg-red-500/90 text-white"
                : isLow
                ? "bg-amber-400/90 text-black"
                : "bg-emerald-500/90 text-white"
            }`}
          >
            {isOut ? "SOLD OUT" : `${availableStock} left`}
          </div>
        </div>

        {/* Timer overlay when reserved */}
        {status === "reserved" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                countdownUrgent ? "bg-red-500" : "bg-purple-400"
              }`}
              style={{ width: `${countdownPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-base text-gray-900 leading-tight mb-0.5">
            {drop.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {drop.description}
          </p>
        </div>

        {/* Stock bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Available</span>
            <span
              className={`font-bold tabular-nums transition-colors duration-300 ${
                animatingStock ? "text-indigo-600 scale-110" : ""
              } ${
                isOut ? "text-red-500" : isLow ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {availableStock}/{drop.totalStock}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${stockPercent}%` }}
            />
          </div>
        </div>

        {/* Recent buyers */}
        {recentBuyers.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              Recent buyers
            </p>
            <div className="space-y-1.5">
              {recentBuyers.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Medals rank={i} />
                    <span className="font-medium text-gray-700 truncate">{p.user.username}</span>
                  </div>
                  <span className="text-gray-400 tabular-nums shrink-0 ml-2">
                    {formatTimeAgo(p.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {status === "purchased" ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Purchased
          </div>
        ) : status === "reserved" ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span
                className={`font-bold tabular-nums ${
                  countdownUrgent ? "text-red-500 animate-pulse" : "text-purple-600"
                }`}
              >
                {countdown}s
              </span>
              <span className="text-gray-400">remaining</span>
            </div>
            <button
              onClick={handlePurchase}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
            >
              Complete Purchase →
            </button>
          </div>
        ) : (
          <button
            onClick={handleReserve}
            disabled={isOut || status === "reserving" || !userId}
            className="w-full py-2.5 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {status === "reserving" ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Reserving...
              </>
            ) : isOut ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Sold Out
              </>
            ) : !userId ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Select a user
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Reserve
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
