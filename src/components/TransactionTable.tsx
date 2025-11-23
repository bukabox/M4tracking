import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';

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
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-6">
        <h3 className="text-gray-900 mb-1">Recent Transactions</h3>
        <p className="text-gray-500 text-sm">Your latest income and allocation entries</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No transactions yet. Click "New Transaction" to add one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                      }
                    >
                      {transaction.type === 'income' ? 'Income' : 'Allocation'}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.label}</TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-orange-600'}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDelete(transaction.id)}
                      className="hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
