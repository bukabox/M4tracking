// src/components/ProductListManager.tsx

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Package, Edit2, Trash2, Plus, X, CheckCircle, XCircle } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../lib/api";

export default function ProductListManager({ onClose }: { onClose?: ()=>void }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // newItem state yang diperbarui (store_page dan total_revenue dihapus)
  const [newItem, setNewItem] = useState({
    product_id: "",
    id: "",
    name: "",
    category: "Sticker",
    stream: "LINE",
    enabled: true,
    url_id: "",            // LINE store id used for thumbnail
  });

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const data = await apiGet<any[]>("/api/product_list");
      // Ensure data is always an array
      setList(Array.isArray(data) ? data : []);
    } catch(e) { 
      console.warn("fetchList error:", e); 
      // Check if it's auth error
      if (e instanceof Error && (e.message.includes("401") || e.message.includes("403"))) {
        alert("You are not authorized. Please login again.");
      }
      setList([]); // Set empty array on error
    }
    setLoading(false);
  }

  // Fungsi ini tidak lagi dibutuhkan, namun kita biarkan jika ada fungsi lain yang memanggilnya.
  function extractUrlIdFromUrl(url: string) {
    if (!url) return "";
    try {
      const m = url.match(/\/(\d+)(?:$|\/|\?)/);
      if (m) return m[1];
    } catch (e) { /* ignore */ }
    return "";
  }

  async function saveNew() {
    if (!newItem.product_id) return alert("product_id required");

    // build payload that matches backend expectation
    const nameVal = (newItem.name && String(newItem.name).trim()) || String(newItem.product_id).trim();
    const payload: any = {
      product_id: String(newItem.product_id).trim(),
      id: String(newItem.product_id).trim(),
      // Gunakan nameVal untuk Name dan Label (sesuai perubahan sebelumnya)
      name: nameVal,    
      label: nameVal,   
      category: (newItem.category && String(newItem.category).trim()) || "Sticker",
      stream: (newItem.stream && String(newItem.stream).trim().toUpperCase()) || "LINE",
      enabled: !!newItem.enabled
    };

    // include url_id if provided (string)
    if (newItem.url_id && String(newItem.url_id).trim()) {
      payload.url_id = String(newItem.url_id).trim();
    }

    try {
      await apiPost("/api/product_list", payload);
      
      // Success - refetch list
      await fetchList();
      
      // reset form
      setEditing(null);
      setNewItem({
        product_id: "",
        id: "",
        name: "",
        category: "Sticker",
        stream: "LINE",
        enabled: true,
        url_id: "",
      });
      setShowModal(false);
    } catch (err) {
      console.warn("failed to save product:", err);
      
      // Check if auth error
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("403"))) {
        alert("You are not authorized. Please login again.");
      } else {
        alert("Failed to save product. Please check console for details.");
      }
    }
  }

  async function removeOne(pid: string) {
    if (!confirm("Delete product "+pid+" ?")) return;
    
    try {
      await apiDelete(`/api/product_list/${encodeURIComponent(pid)}`);
      
      // Success - refetch list
      await fetchList();
    } catch (e) {
      console.warn("removeOne error:", e);
      
      // Check if auth error
      if (e instanceof Error && (e.message.includes("401") || e.message.includes("403"))) {
        alert("You are not authorized. Please login again.");
      } else {
        alert("Delete failed. Please check console for details.");
      }
    }
  }

  function startEdit(p: any) {
    setEditing(String(p.product_id || p.id || ""));
    // State newItem di-update tanpa store_page dan total_revenue
    setNewItem({
      product_id: String(p.product_id || p.id || ""),
      id: String(p.id || p.product_id || ""),
      name: p.name || p.label || "",
      category: p.category || "Sticker",
      stream: (p.stream || "LINE").toUpperCase(),
      enabled: typeof p.enabled === "boolean" ? p.enabled : true,
      url_id: p.url_id || p.store_id || p.line_store_id || "", 
    });
    setShowModal(true); // open modal for editing
  }

  function cancelEdit() {
    setEditing(null);
    // State newItem di-reset tanpa store_page dan total_revenue
    setNewItem({
      product_id: "",
      id: "",
      name: "",
      category: "Sticker",
      stream: "LINE",
      enabled: true,
      url_id: "",
    });
    setShowModal(false); // close modal
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 bg-white border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Product List Manager</h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage products for CSV import matching. Use <span className="font-medium">product_id</span> as grouping key and <span className="font-medium">URL ID</span> for thumbnails.
              </p>
            </div>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => {
              setEditing(null);
              setNewItem({
                product_id: "",
                id: "",
                name: "",
                category: "Sticker",
                stream: "LINE",
                enabled: true,
                url_id: "",
              });
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        </div>
      </Card>

      {/* Product List Table */}
      <Card className="p-6 bg-white border-gray-200">
        <div className="mb-4">
          <h4 className="text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Registered Products ({list.length})
          </h4>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No products registered yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-600">Product ID</th>
                    <th className="text-left py-3 px-2 text-gray-600">Name</th>
                    <th className="text-left py-3 px-2 text-gray-600">Category</th>
                    <th className="text-left py-3 px-2 text-gray-600">Stream</th>
                    <th className="text-left py-3 px-2 text-gray-600">URL ID</th>
                    <th className="text-center py-3 px-2 text-gray-600">Enabled</th>
                    <th className="text-right py-3 px-2 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((p: any) => (
                    <tr key={p.product_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {p.product_id}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-900">{p.name || p.label || "-"}</td>
                      <td className="py-3 px-2 text-gray-600">{p.category || "-"}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {p.stream || "LINE"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-mono text-xs text-gray-600">
                          {p.url_id || p.store_id || p.line_store_id || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {(p.enabled ?? true) ? (
                          <CheckCircle className="w-4 h-4 text-green-600 inline-block" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 inline-block" />
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEdit(p)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => removeOne(p.product_id)}
                            className="px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const n = i + 1;
                      return (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`px-3 py-1 rounded ${n === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal Dialog for Add/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Update product information below." : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Product ID */}
            <div className="space-y-1.5">
              <Label htmlFor="modal-product-id">Product ID *</Label>
              <Input 
                id="modal-product-id"
                value={newItem.product_id} 
                onChange={(e) => setNewItem({...newItem, product_id: e.target.value})}
                placeholder="e.g. 12345678"
                disabled={!!editing}
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="modal-product-name">Product Name</Label>
              <Input 
                id="modal-product-name"
                value={newItem.name} 
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                placeholder="e.g. Cute Cat Stickers"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="modal-product-category">Category</Label>
              <Input 
                id="modal-product-category"
                value={newItem.category} 
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                placeholder="e.g. Sticker"
              />
            </div>

            {/* Stream */}
            <div className="space-y-1.5">
              <Label htmlFor="modal-product-stream">Stream *</Label>
              <select
                id="modal-product-stream"
                className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50"
                value={newItem.stream}
                onChange={(e) => setNewItem({...newItem, stream: e.target.value})}
              >
                <option value="LINE">LINE</option>
                <option value="ETSY">ETSY</option>
                <option value="STIPOP">STIPOP</option>
                <option value="MOJITOK">MOJITOK</option>
                <option value="UNCATEGORIZED">UNCATEGORIZED</option>
              </select>
            </div>

            {/* URL ID */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="modal-product-url-id">URL ID (Store ID)</Label>
              <Input
                id="modal-product-url-id"
                value={newItem.url_id}
                onChange={(e) => setNewItem({...newItem, url_id: e.target.value})}
                placeholder="e.g. 30892705"
              />
              <p className="text-xs text-gray-500">LINE store ID for thumbnail display</p>
            </div>

            {/* Enabled Checkbox */}
            <div className="space-y-1.5 flex items-end md:col-span-2">
              <div className="flex items-center gap-2 h-9">
                <input
                  id="modal-prod-enabled"
                  type="checkbox"
                  checked={newItem.enabled}
                  onChange={(e) => setNewItem({...newItem, enabled: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="modal-prod-enabled" className="cursor-pointer">
                  Enabled
                </Label>
              </div>
            </div>
          </div>

          {/* Modal Footer - Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {editing && (
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button 
              onClick={saveNew}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}