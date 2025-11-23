import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Transaction {
  id: string;
  type: 'income' | 'allocation';
  date: string;
  label: string;
  amount: number;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
}

export function TransactionDialog({ open, onOpenChange, onSubmit }: TransactionDialogProps) {
  const [activeTab, setActiveTab] = useState<'income' | 'allocation'>('income');
  const [formData, setFormData] = useState({
    date: '',
    label: '',
    amount: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.label || !formData.amount) {
      return;
    }

    onSubmit({
      type: activeTab,
      date: formData.date,
      label: formData.label,
      amount: parseFloat(formData.amount),
    });

    // Reset form
    setFormData({ date: '', label: '', amount: '' });
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or allocation transaction
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'income' | 'allocation')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income-date">Date</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-label">Label</Label>
                <Input
                  id="income-label"
                  type="text"
                  placeholder="e.g., Salary, Freelance, Investment"
                  value={formData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600">
                  Add Income
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="allocation">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allocation-date">Date</Label>
                <Input
                  id="allocation-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocation-label">Label</Label>
                <Input
                  id="allocation-label"
                  type="text"
                  placeholder="e.g., Rent, Groceries, Utilities"
                  value={formData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocation-amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="allocation-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Add Allocation
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
