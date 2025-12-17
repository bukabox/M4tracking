import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { X, Plus, Trash2, Edit2, DollarSign, TrendingDown } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import { toast } from "sonner";

export interface CapitalItem {
  id: string;
  name: string;
  amount: number;
  depreciable: boolean;
  periode?: number; // months
  residu?: number;
}

interface CapitalItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capitalItems: CapitalItem[];
  onCapitalItemsChange: (items: CapitalItem[]) => void;
}

export function CapitalItemsDialog({
  open,
  onOpenChange,
  capitalItems,
  onCapitalItemsChange,
}: CapitalItemsDialogProps) {
  const { formatCurrency } = useCurrency();
  
  const [items, setItems] = useState<CapitalItem[]>(capitalItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CapitalItem>({
    id: "",
    name: "",
    amount: 0,
    depreciable: false,
    periode: 12,
    residu: 0,
  });

  useEffect(() => {
    setItems(capitalItems);
  }, [capitalItems]);

  const totalCapital = items.reduce((sum, item) => sum + item.amount, 0);

  const handleAdd = () => {
    if (!formData.name || formData.amount <= 0) {
      toast.error("Name and amount are required");
      return;
    }

    const newItem: CapitalItem = {
      ...formData,
      id: `capital_${Date.now()}`,
    };

    const updated = [...items, newItem];
    setItems(updated);
    onCapitalItemsChange(updated);
    
    // Reset form
    setFormData({
      id: "",
      name: "",
      amount: 0,
      depreciable: false,
      periode: 12,
      residu: 0,
    });
    setShowAddForm(false);
    toast.success("Capital item added");
  };

  const handleEdit = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setShowAddForm(true);
    }
  };

  const handleUpdate = () => {
    if (!formData.name || formData.amount <= 0) {
      toast.error("Name and amount are required");
      return;
    }

    const updated = items.map(item => 
      item.id === editingId ? { ...formData, id: editingId } : item
    );
    
    setItems(updated);
    onCapitalItemsChange(updated);
    
    // Reset form
    setFormData({
      id: "",
      name: "",
      amount: 0,
      depreciable: false,
      periode: 12,
      residu: 0,
    });
    setEditingId(null);
    setShowAddForm(false);
    toast.success("Capital item updated");
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onCapitalItemsChange(updated);
    toast.success("Capital item deleted");
  };

  const handleCancel = () => {
    setFormData({
      id: "",
      name: "",
      amount: 0,
      depreciable: false,
      periode: 12,
      residu: 0,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Initial Capital</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total: <span className="font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(totalCapital)}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Items List */}
          <div className="space-y-3 mb-6">
            {items.length === 0 && !showAddForm && (
              <Card className="p-8 text-center border-dashed">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-4">No capital items yet</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </Card>
            )}

            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(item.amount)}
                    </p>
                    {item.depreciable && (
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          <span>Depreciable</span>
                        </div>
                        <span>• {item.periode} months</span>
                        <span>• Residual: {formatCurrency(item.residu || 0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="p-6 border-2 border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {editingId ? "Edit Capital Item" : "Add New Capital Item"}
              </h3>
              
              <div className="space-y-4">
                {/* Asset Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asset Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., M4 Equipment, Office Furniture"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <Input
                    type="text"
                    value={formData.amount ? formData.amount.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "");
                      setFormData({ ...formData, amount: Number(digits) || 0 });
                    }}
                    placeholder="0"
                  />
                </div>

                {/* Depreciable Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="depreciable"
                    checked={formData.depreciable}
                    onChange={(e) => setFormData({ ...formData, depreciable: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="depreciable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Depreciable Asset
                  </label>
                </div>

                {/* Depreciation Details (conditional) */}
                {formData.depreciable && (
                  <div className="pl-7 space-y-4 border-l-2 border-purple-200 dark:border-purple-800">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Depreciation Period (months)
                      </label>
                      <Input
                        type="number"
                        value={formData.periode || ""}
                        onChange={(e) => setFormData({ ...formData, periode: Number(e.target.value) })}
                        placeholder="12"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Residual Value
                      </label>
                      <Input
                        type="text"
                        value={formData.residu ? formData.residu.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, "");
                          setFormData({ ...formData, residu: Number(digits) || 0 });
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={editingId ? handleUpdate : handleAdd} className="flex-1">
                    {editingId ? "Update" : "Add"} Item
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Add Button (when not showing form) */}
          {!showAddForm && items.length > 0 && (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Capital Item
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
