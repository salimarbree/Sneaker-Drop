import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import type { Drop } from "../types";

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

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DropForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const fetchDrops = useCallback(async () => {
    try {
      const data = await api.getDrops();
      setDrops(data);
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
      fetchDrops();
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
      fetchDrops();
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

  const totalAvailable = drops.reduce((s, d) => s + d.availableStock, 0);
  const totalSold = drops.reduce((s, d) => s + (d.totalStock - d.availableStock), 0);
  const canPreview = form.imageUrl.trim() && !previewError;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Drops</h2>
              <p className="text-sm text-gray-400 mt-0.5">Manage drops and inventory</p>
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              + New Drop
            </button>
          </div>

          {showForm && (
            <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? "Edit Drop" : "Create Drop"}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="e.g. Air Jordan 1 Retro High"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Stock *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.totalStock}
                      onChange={(e) => setForm({ ...form, totalStock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setPreviewError(false); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {canPreview && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={form.imageUrl.trim()}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewError(true)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? "Saving..." : editingId ? "Update Drop" : "Create Drop"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Image</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No drops yet</td>
                  </tr>
                ) : (
                  drops.map((drop) => (
                    <tr key={drop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{drop.name}</div>
                        {drop.description && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">{drop.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold tabular-nums ${drop.availableStock === 0 ? "text-red-500" : drop.availableStock <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
                          {drop.availableStock}/{drop.totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {drop.imageUrl && drop.imageUrl !== "/placeholder-shoe.svg" ? (
                          <img src={drop.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm">👟</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(drop.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(drop)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(drop.id)}
                            disabled={deleting === drop.id}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
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
        </div>

        {/* Right sidebar */}
        <div className="w-56 shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Menu */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Menu</p>
              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <div
                    key={link.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      link.active
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                ))}
              </nav>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Overview</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Total drops</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{drops.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Available stock</p>
                  <p className="text-lg font-bold text-emerald-600 tabular-nums">{totalAvailable}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sold</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{totalSold}</p>
                </div>
              </div>
            </div>

            {/* Quick action */}
            <button
              onClick={openCreate}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              + New Drop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}