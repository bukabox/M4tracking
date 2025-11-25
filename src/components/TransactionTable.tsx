import { Card } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  Home, 
  ShoppingBag, 
  Car, 
  Utensils,
  FileText,
  Tag,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  Hash,
  Clock,
  Trash2
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'allocation';
  date: string;
  label: string;
  amount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionTable({ transactions, onDelete }: TransactionTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryIcon = (label: string, type: string) => {
    const lowerLabel = label.toLowerCase();
    
    if (type === 'income') {
      return <TrendingUp className="w-5 h-5" />;
    }
    
    if (lowerLabel.includes('rent') || lowerLabel.includes('house') || lowerLabel.includes('housing')) {
      return <Home className="w-5 h-5" />;
    }
    if (lowerLabel.includes('food') || lowerLabel.includes('groceries') || lowerLabel.includes('restaurant')) {
      return <Utensils className="w-5 h-5" />;
    }
    if (lowerLabel.includes('transport') || lowerLabel.includes('car') || lowerLabel.includes('gas')) {
      return <Car className="w-5 h-5" />;
    }
    if (lowerLabel.includes('shopping') || lowerLabel.includes('clothes')) {
      return <ShoppingBag className="w-5 h-5" />;
    }
    
    return <Tag className="w-5 h-5" />;
  };

  const getCategoryName = (label: string, type: string) => {
    const lowerLabel = label.toLowerCase();
    
    if (type === 'income') {
      if (lowerLabel.includes('salary')) return 'Salary';
      if (lowerLabel.includes('investment')) return 'Investment';
      if (lowerLabel.includes('freelance')) return 'Freelance';
      return 'Income';
    }
    
    if (lowerLabel.includes('rent') || lowerLabel.includes('house') || lowerLabel.includes('housing')) {
      return 'Housing';
    }
    if (lowerLabel.includes('food') || lowerLabel.includes('groceries')) {
      return 'Food & Dining';
    }
    if (lowerLabel.includes('transport') || lowerLabel.includes('car')) {
      return 'Transportation';
    }
    if (lowerLabel.includes('shopping')) {
      return 'Shopping';
    }
    
    return 'General';
  };

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-6">
        <h3 className="text-gray-900 mb-1">Recent Transactions</h3>
        <p className="text-gray-500 text-sm">Your latest financial activity</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No transactions yet. Click "New Transaction" to add one.
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {transactions.map((transaction) => {
            const category = getCategoryName(transaction.label, transaction.type);
            const icon = getCategoryIcon(transaction.label, transaction.type);
            
            return (
              <AccordionItem 
                key={transaction.id} 
                value={transaction.id}
                className="border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors"
              >
                <AccordionTrigger className="hover:no-underline py-0">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {icon}
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900">{transaction.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{category}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(transaction.id);
                        }}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900">Transaction Receipt</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Transaction ID</span>
                          </div>
                          <p className="text-gray-900 ml-6">TXN-{transaction.id}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Date & Time</span>
                          </div>
                          <p className="text-gray-900 ml-6">{formatDateTime(transaction.date)}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Merchant</span>
                          </div>
                          <p className="text-gray-900 ml-6">Payment Gateway</p>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Payment Method</span>
                          </div>
                          <p className="text-gray-900 ml-6">Bank Transfer</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Status</span>
                          </div>
                          <div className="ml-6">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Completed
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Category</span>
                          </div>
                          <p className="text-gray-900 ml-6">{category}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount Section */}
                    <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(transaction.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900">Total Amount</span>
                        <span className={`${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-gray-500 text-sm mb-1">Description</p>
                      <p className="text-gray-900">
                        {transaction.type === 'income' 
                          ? `Incoming payment for ${transaction.label.toLowerCase()}`
                          : `Payment for ${transaction.label.toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </Card>
  );
}