import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';
import { transactionsAPI, categoriesAPI } from '../services/api';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  X 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  // SheetTrigger,
} from '../components/ui/sheet';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      description: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'other',
      location: '',
      notes: ''
    }
  });

  const watchedType = watch('type');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await transactionsAPI.getAll(params);
      setTransactions(response.data.data?.transactions || []);
      setTotal(response.data.data?.pagination?.totalTransactions || 0);
      setSummary(response.data.data?.summary || {});
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (transaction = null) => {
    setEditTransaction(transaction);
    if (transaction) {
      setValue('amount', transaction.amount);
      setValue('description', transaction.description);
      setValue('type', transaction.type);
      setValue('category', transaction.category._id);
      setValue('date', new Date(transaction.date).toISOString().split('T')[0]);
      setValue('paymentMethod', transaction.paymentMethod || 'other');
      setValue('location', transaction.location || '');
      setValue('notes', transaction.notes || '');
    } else {
      reset();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditTransaction(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const transactionData = {
        ...data,
        amount: parseFloat(data.amount)
      };

      if (editTransaction) {
        await transactionsAPI.update(editTransaction._id, transactionData);
      } else {
        await transactionsAPI.create(transactionData);
      }

      handleCloseDialog();
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.delete(id);
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError('Failed to delete transaction');
      }
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      startDate: '',
      endDate: ''
    });
    setPage(0);
  };

  const filteredCategories = categories.filter(cat => 
    cat.type === watchedType || cat.type === 'both'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{summary.totalIncome?.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">Total Income</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                ₹{summary.totalExpense?.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{summary.balance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">Net Balance</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: transaction.category?.color || '#1976d2' }}
                    >
                      {transaction.category?.icon || '📁'}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{transaction.category?.name}</span>
                        <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                        {transaction.location && <span>📍 {transaction.location}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, total)} of {total} transactions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(page + 1) * rowsPerPage >= total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No transactions found. Add your first transaction!
              </p>
              <Button onClick={() => handleOpenDialog()}>
                Add Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Transaction Sheet */}
      <Sheet open={openDialog} onOpenChange={setOpenDialog}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {editTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </SheetTitle>
            <SheetDescription>
              {editTransaction ? 'Update transaction details' : 'Enter details for your new transaction'}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Controller
                  name="amount"
                  control={control}
                  rules={{ required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={`mt-1 ${errors.amount ? 'border-red-500' : ''}`}
                    />
                  )}
                />
                {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="type"
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="description"
                    placeholder="Transaction description"
                    className={`mt-1 ${errors.description ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="category"
                      className={`mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select category</option>
                      {filteredCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="date"
                      type="date"
                      className="mt-1"
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="location"
                    placeholder="Transaction location"
                    className="mt-1"
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="notes"
                    rows={3}
                    placeholder="Additional notes"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editTransaction ? 'Update' : 'Add'} Transaction
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Transactions;