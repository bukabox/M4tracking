// src/components/ProductListManager.tsx

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Package, Edit2, Trash2, Plus, X, CheckCircle, XCircle, Upload } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import Papa from "papaparse";
import { toast } from "sonner@2.0.3";

export default function ProductListManager({ onClose }: { onClose?: ()=>void }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Master user state
  const [me, setMe] = useState<{email?:string, is_master?:boolean} | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // newItem state yang diperbarui (store_page dan total_revenue dihapus) - MASTER ONLY
  const [newItem, setNewItem] = useState({
    product_id: "",
    id: "",
    name: "",
    category: "Sticker",
    stream: "LINE",
    enabled: true,
    url_id: "",            // LINE store id used for thumbnail
  });

  // Fields for non-master add product form
  const [nmProductId, setNmProductId] = useState("");
  const [nmName, setNmName] = useState("");
  const [nmLabel, setNmLabel] = useState("");
  const [nmCategory, setNmCategory] = useState("");
  const [nmStream, setNmStream] = useState("");
  const [nmPrice, setNmPrice] = useState<number | "">("");
  const [isDesktop, setIsDesktop] = useState<boolean>(
      typeof window !== 'undefined' && window.innerWidth >= 768
    );
  
    // Track screen size for responsive behavior
    React.useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth >= 768);
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

  useEffect(() => { 
    fetchList(); 
    // Fetch current user info to check if master
    let mounted = true;
    (async () => {
      try {
        const m = await apiGet<{email?:string, is_master?:boolean}>("/api/me");
        if (mounted) setMe(m || null);
      } catch(e) {
        console.warn("api/me failed", e);
        if (mounted) setMe(null);
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  // Helper: submit simple product (for non-master)
  const handleAddProductSimple = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload = {
      product_id: String(nmProductId).trim(),
      id: String(nmProductId).trim(),
      name: String(nmName).trim(),
      label: String(nmLabel || nmName).trim(),
      category: String(nmCategory || "General").trim(),
      stream: String(nmStream || "").trim(),
      price: nmPrice === "" ? undefined : Number(nmPrice),
      enabled: true,
    };

    if (!payload.product_id || !payload.name) {
      alert("Product ID dan Name wajib diisi.");
      return;
    }

    try {
      await apiPost("/api/product_list", [payload]); // POST array to keep compatibility
      toast.success("Product added");
      
      // reset fields
      setNmProductId("");
      setNmName("");
      setNmLabel("");
      setNmCategory("");
      setNmStream("");
      setNmPrice("");
      
      // close modal
      setShowModal(false);
      
      // refresh product list
      await fetchList();
    } catch (err:any) {
      console.error("add product failed", err);
      alert("Gagal menambah product: " + (err?.message || String(err)));
      toast.error("Failed to add product");
    }
  };

  // Handler CSV import for non-master: expects CSV headers:
  // product_id,name,label,category,stream,price (case-insensitive)
  const handleNonMasterCsv = async (file: File | null) => {
    if (!file) return;
    try {
      const parsed: any = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (r) => resolve(r),
          error: (err) => reject(err),
        });
      });
      const rows = parsed.data || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        alert("CSV kosong atau tidak ditemukan baris valid.");
        return;
      }

      const mapped = rows.map((r: any, i: number) => {
        // normalize keys
        const obj: any = {};
        for (const k of Object.keys(r)) {
          const kn = k.trim().toLowerCase();
          obj[kn] = (r as any)[k];
        }
        const product_id = String(obj["product_id"] || obj["id"] || obj["productid"] || "").trim();
        const name = String(obj["name"] || obj["label"] || "").trim();
        const label = String(obj["label"] || obj["name"] || name).trim();
        const category = String(obj["category"] || "General").trim();
        const stream = String(obj["stream"] || obj["client"] || "").trim();
        const priceRaw = obj["price"] || obj["amount"] || "";
        const price = priceRaw === "" ? undefined : Number(String(priceRaw).replace(/,/g, ""));
        return {
          product_id,
          id: product_id,
          name,
          label,
          category,
          stream,
          price,
          enabled: true,
        };
      }).filter((p:any)=>p.product_id && p.name);

      if (!mapped.length) {
        alert("Tidak ada baris produk valid (butuh product_id dan name).");
        return;
      }

      // send in batch
      await apiPost("/api/product_list", mapped);
      toast.success(`Imported ${mapped.length} products`);
      await fetchList();
    } catch (err:any) {
      console.error("CSV import failed", err);
      alert("Import CSV gagal: " + (err?.message || String(err)));
      toast.error("Failed to import CSV");
    }
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mt-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 bg-white border-gray-200">
        <div className={`items-start justify-between mb-4 ${isDesktop ? 'flex' : 'flex flex-col gap-4'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-900">Product List Manager</h3>
              <p className="text-sm text-gray-500 mt-1">
                {me?.is_master 
                  ? "Manage products for CSV import matching. Use product_id as grouping key and URL ID for thumbnails."
                  : "Manage your products. Use product_id as unique identifier."
                }
              </p>
            </div>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => {
              setEditing(null);
              if (me?.is_master) {
                setNewItem({
                  product_id: "",
                  id: "",
                  name: "",
                  category: "Sticker",
                  stream: "LINE",
                  enabled: true,
                  url_id: "",
                });
              } else {
                setNmProductId("");
                setNmName("");
                setNmLabel("");
                setNmCategory("");
                setNmStream("");
                setNmPrice("");
              }
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

          {/* Conditional Form: Master vs General */}
          {me?.is_master ? (
            // MASTER FORM (From ProductListManager-Master.tsx - 2 column grid with URL ID)
            <>
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

                {/* URL ID - Master Only - Full width on second row */}
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

                {/* Enabled Checkbox - Full width on third row */}
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

              {/* Modal Footer - Master */}
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
            </>
          ) : (
            // GENERAL USER FORM (Current form - 2 column grid with Price, no URL ID)
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {/* Product ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="nm-product-id">Product ID *</Label>
                  <Input 
                    id="nm-product-id"
                    value={nmProductId} 
                    onChange={(e) => setNmProductId(e.target.value)}
                    placeholder="e.g. P12345"
                    required
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="nm-name">Name *</Label>
                  <Input 
                    id="nm-name"
                    value={nmName} 
                    onChange={(e) => setNmName(e.target.value)}
                    placeholder="e.g. Cute Stickers"
                    required
                  />
                </div>

                {/* Label */}
                <div className="space-y-1.5">
                  <Label htmlFor="nm-label">Label</Label>
                  <Input 
                    id="nm-label"
                    value={nmLabel} 
                    onChange={(e) => setNmLabel(e.target.value)}
                    placeholder="Optional display label"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="nm-category">Category</Label>
                  <Input 
                    id="nm-category"
                    value={nmCategory} 
                    onChange={(e) => setNmCategory(e.target.value)}
                    placeholder="e.g. Sticker, General"
                  />
                </div>

                {/* Stream / Client */}
                <div className="space-y-1.5">
                  <Label htmlFor="nm-stream">Stream / Client</Label>
                  <Input 
                    id="nm-stream"
                    value={nmStream} 
                    onChange={(e) => setNmStream(e.target.value)}
                    placeholder="e.g. PT. Sinar Abadi"
                  />
                </div>

                {/* Price - General User Only */}
                <div className="space-y-1.5">
                  <Label htmlFor="nm-price">Price (optional)</Label>
                  <Input 
                    id="nm-price"
                    type="number"
                    value={nmPrice} 
                    onChange={(e) => setNmPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>

              {/* Modal Footer - General User */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddProductSimple}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}