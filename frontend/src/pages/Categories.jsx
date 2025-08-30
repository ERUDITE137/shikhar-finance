import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';
import { categoriesAPI } from '../services/api';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit, Trash2, X, FolderOpen } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';

// Common icons for categories
const CATEGORY_ICONS = [
  '💰', '💳', '🏠', '🚗', '🍔', '🎭', '⚕️', '📚',
  '✈️', '👕', '💻', '📱', '⚽', '🎵', '🎁', '🛒',
  '☕', '🍕', '⛽', '🚇', '🏥', '💊', '🎬', '📺',
  '🎮', '🏋️', '💄', '✂️', '🔧', '🎨', '📖', '🎪'
];

const PRESET_CATEGORIES = {
  income: [
    { name: 'Salary', icon: '💰', color: '#4caf50' },
    { name: 'Freelance', icon: '💻', color: '#2196f3' },
    { name: 'Business', icon: '💼', color: '#ff9800' },
    { name: 'Investment', icon: '📈', color: '#9c27b0' },
    { name: 'Gift', icon: '🎁', color: '#e91e63' }
  ],
  expense: [
    { name: 'Food & Dining', icon: '🍔', color: '#f44336' },
    { name: 'Transportation', icon: '🚗', color: '#ff9800' },
    { name: 'Shopping', icon: '🛒', color: '#e91e63' },
    { name: 'Entertainment', icon: '🎭', color: '#9c27b0' },
    { name: 'Bills & Utilities', icon: '💡', color: '#607d8b' },
    { name: 'Healthcare', icon: '⚕️', color: '#4caf50' },
    { name: 'Education', icon: '📚', color: '#2196f3' },
    { name: 'Travel', icon: '✈️', color: '#00bcd4' }
  ]
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [error, setError] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      icon: '📁',
      color: '#1976d2',
      type: 'expense',
      description: ''
    }
  });



  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    setEditCategory(category);
    if (category) {
      setValue('name', category.name);
      setValue('icon', category.icon);
      setValue('color', category.color);
      setValue('type', category.type);
      setValue('description', category.description || '');
    } else {
      reset();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditCategory(null);
    setShowPresets(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editCategory) {
        await categoriesAPI.update(editCategory._id, data);
      } else {
        await categoriesAPI.create(data);
      }
      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await categoriesAPI.delete(id);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Failed to delete category');
      }
    }
  };

  const handlePresetSelect = (preset) => {
    setValue('name', preset.name);
    setValue('icon', preset.icon);
    setValue('color', preset.color);
    setShowPresets(false);
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income' || cat.type === 'both');
  const expenseCategories = categories.filter(cat => cat.type === 'expense' || cat.type === 'both');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your transactions with custom categories</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
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

      {loading ? (
        <LoadingSpinner message="Loading categories..." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <FolderOpen className="h-5 w-5" />
                Income Categories ({incomeCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCategories.length > 0 ? (
                <div className="space-y-3">
                  {incomeCategories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No income categories yet</p>
                  <Button onClick={() => handleOpenDialog()} variant="outline">
                    Add Your First Income Category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <FolderOpen className="h-5 w-5" />
                Expense Categories ({expenseCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseCategories.length > 0 ? (
                <div className="space-y-3">
                  {expenseCategories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No expense categories yet</p>
                  <Button onClick={() => handleOpenDialog()} variant="outline">
                    Add Your First Expense Category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Category Sheet */}
      <Sheet open={openDialog} onOpenChange={setOpenDialog}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {editCategory ? 'Edit Category' : 'Add New Category'}
            </SheetTitle>
            <SheetDescription>
              {editCategory ? 'Update category details' : 'Create a new category for organizing your transactions'}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Category name is required' }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="name"
                      placeholder="e.g., Food & Dining"
                      className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                    />
                  )}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
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
                      <option value="both">Both</option>
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => (
                    <div className="mt-1">
                      <Input
                        {...field}
                        id="icon"
                        placeholder="📁"
                        className="text-center text-xl"
                        maxLength={2}
                      />
                      <div className="grid grid-cols-8 gap-2 mt-2 max-h-32 overflow-y-auto">
                        {CATEGORY_ICONS.map((icon, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setValue('icon', icon)}
                            className="p-2 text-lg hover:bg-gray-100 rounded border"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="color">Color</Label>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="color"
                      type="color"
                      className="mt-1 h-10"
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="description"
                    rows={3}
                    placeholder="Category description..."
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                )}
              />
            </div>

            {!editCategory && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Quick Setup</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPresets(!showPresets)}
                  >
                    {showPresets ? 'Hide' : 'Show'} Presets
                  </Button>
                </div>
                
                {showPresets && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Income Categories:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_CATEGORIES.income.map((preset, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className="flex items-center gap-2 p-2 text-sm border rounded hover:bg-gray-50"
                          >
                            <span style={{ color: preset.color }}>{preset.icon}</span>
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Expense Categories:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_CATEGORIES.expense.map((preset, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className="flex items-center gap-2 p-2 text-sm border rounded hover:bg-gray-50"
                          >
                            <span style={{ color: preset.color }}>{preset.icon}</span>
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Categories;