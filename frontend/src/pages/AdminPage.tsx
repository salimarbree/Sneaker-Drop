import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, getImageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import type { Drop, PaginatedResponse } from "../types";

interface DropForm {
  name: string;
  description: string;
  totalStock: string;
  imageUrl: string;
}

const emptyForm: DropForm = { name: "", description: "", totalStock: "", imageUrl: "" };

const sidebarLinks = [
  { label: "Drops", icon: "📦", active: true },
  { label: "Users", icon: "👥", active: false },
  { label: "Analytics", icon: "📊", active: false },
];

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
    <div className="flex items-center justify-end gap-2 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        Prev
      </button>
      <span className="text-xs text-gray-500 font-medium">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DropForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDrops = useCallback(async (page = 1) => {
    try {
      const res = await api.getDrops(page, 10);
      setDrops(res.data);
      setPagination({
        page: res.pagination.page,
        totalPages: res.pagination.totalPages,
        total: res.pagination.total,
      });
    } catch {
      toast.error("Failed to load drops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    fetchDrops();
  }, [user, navigate, fetchDrops]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setPreviewError(false);
  }

  function openEdit(drop: Drop) {
    setForm({
      name: drop.name,
      description: drop.description || "",
      totalStock: String(drop.totalStock),
      imageUrl: drop.imageUrl || "",
    });
    setEditingId(drop.id);
    setShowForm(true);
    setPreviewError(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const stock = parseInt(form.totalStock, 10);
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (isNaN(stock) || stock < 1) { toast.error("Stock must be a positive number"); return; }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        totalStock: stock,
        imageUrl: form.imageUrl.trim() || undefined,
      };

      if (editingId) {
        await api.updateDrop(editingId, body);
        toast.success("Drop updated");
      } else {
        await api.createDrop(body);
        toast.success("Drop created");
      }
      setShowForm(false);
      fetchDrops(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save drop");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this drop? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.deleteDrop(id);
      toast.success("Drop deleted");
      fetchDrops(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete drop");
    } finally {
      setDeleting(null);
    }
  }

  if (!user || user.role !== "admin") return null;

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

  const canPreview = form.imageUrl.trim() && !previewError;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Drops</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Inventory Management</p>
            </div>
            <button
              onClick={openCreate}
              className="px-5 py-2.5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-sm active:scale-95"
            >
              + New Release
            </button>
          </div>

          {showForm && (
            <div className="mb-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-tight">
                {editingId ? "Edit Drop" : "Create New Release"}
              </h3>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 transition-all"
                      placeholder="e.g. Air Jordan 1 Retro High"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Stock *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.totalStock}
                      onChange={(e) => setForm({ ...form, totalStock: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 transition-all"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 transition-all resize-none"
                      placeholder="Add release details..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Image</label>
                    <div className="flex gap-3">
                      <input
                        value={form.imageUrl}
                        onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setPreviewError(false); }}
                        className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 transition-all"
                        placeholder="URL or use upload button"
                      />
                      <label className={`shrink-0 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all ${
                        uploading ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}>
                        {uploading ? "..." : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const url = await api.uploadImage(file);
                              setForm({ ...form, imageUrl: url });
                              setPreviewError(false);
                              toast.success("Image uploaded");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Upload failed");
                            } finally {
                              setUploading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {canPreview && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Preview</p>
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-50">
                      <img
                        src={getImageUrl(form.imageUrl.trim())}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewError(true)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
                  >
                    {saving ? "Processing..." : editingId ? "Update Release" : "Launch Release"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {drops.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-gray-300 font-medium">No active releases</td>
                    </tr>
                  ) : (
                    drops.map((drop) => (
                      <tr key={drop.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                {drop.imageUrl && drop.imageUrl !== "/placeholder-shoe.svg" ? (
                                    <img src={getImageUrl(drop.imageUrl)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">👟</div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-gray-900 truncate">{drop.name}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                    ID: {drop.id.slice(0, 8)}...
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-end">
                                <span className={`text-xs font-black tabular-nums ${drop.availableStock === 0 ? "text-red-500" : "text-gray-900"}`}>
                                    {drop.availableStock} / {drop.totalStock}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {Math.round((drop.availableStock / drop.totalStock) * 100)}%
                                </span>
                            </div>
                            <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        drop.availableStock === 0 ? "bg-red-400" : "bg-gray-900"
                                    }`}
                                    style={{ width: `${(drop.availableStock / drop.totalStock) * 100}%` }}
                                />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(drop)}
                              className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 rounded-lg hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(drop.id)}
                              disabled={deleting === drop.id}
                              className="px-4 py-2 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 rounded-lg hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                            >
                              {deleting === drop.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50">
                <Pagination 
                    page={pagination.page} 
                    totalPages={pagination.totalPages} 
                    onPageChange={fetchDrops} 
                />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Navigation</p>
              <nav className="space-y-2">
                {sidebarLinks.map((link) => (
                  <div
                    key={link.label}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                      link.active
                        ? "bg-gray-900 text-white shadow-md scale-[1.02]"
                        : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                ))}
              </nav>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Total Inventory</p>
                <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-black tabular-nums">{pagination.total}</span>
                    <span className="text-xs font-bold uppercase tracking-tighter opacity-80 mb-1.5">Active Items</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Status</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
