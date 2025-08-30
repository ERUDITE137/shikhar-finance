import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import LoadingSpinner from '../components/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { transactionsAPI } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, Plus, Upload, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Target, Activity } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600'
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-elegant-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-secondary-600">{title}</p>
            <p className="text-3xl font-bold text-secondary-900">{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-success-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-danger-600" />
                )}
                <span className={`text-sm font-medium ${
                  trend === 'up' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch recent transactions (recent 5 for display)
      const transactionsResponse = await transactionsAPI.getAll({ limit: 5, page: 1 });
      setRecentTransactions(transactionsResponse.data.data?.transactions || []);
      
      // Fetch all transactions for all-time summary (no date filters)
      const allTransactionsResponse = await transactionsAPI.getAll({
        limit: 1000 // Get all transactions for summary
      });
      
      // Fetch analytics data for all time (no date filters)
      const analyticsResponse = await transactionsAPI.getAnalytics();
      
      console.log('Dashboard API responses:', {
        transactions: transactionsResponse.data,
        allTransactions: allTransactionsResponse.data,
        analytics: analyticsResponse.data
      });
      
      setData({
        summary: allTransactionsResponse.data.data?.summary || { totalIncome: 0, totalExpense: 0, balance: 0, incomeCount: 0, expenseCount: 0 },
        analytics: analyticsResponse.data.data || {}
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setData({
        summary: { totalIncome: 0, totalExpense: 0, balance: 0, incomeCount: 0, expenseCount: 0 },
        analytics: {}
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
          <Button onClick={fetchDashboardData} className="ml-4" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { summary, analytics } = data || {};

  // Prepare pie chart data
  const pieChartData = analytics?.expensesByCategory?.map((item, index) => ({
    name: item.name,
    value: item.total,
    color: item.color || COLORS[index % COLORS.length]
  })) || [];

  // Prepare bar chart data for monthly trends
  const monthlyData = analytics?.monthlyTrends?.reduce((acc, item) => {
    const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    const monthName = new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find(d => d.month === monthKey);
    
    if (existing) {
      existing[item._id.type] = item.total;
    } else {
      const newEntry = {
        month: monthKey,
        monthName: monthName,
        income: 0,
        expense: 0
      };
      newEntry[item._id.type] = item.total;
      acc.push(newEntry);
    }
    
    return acc;
  }, [])?.sort((a, b) => a.month.localeCompare(b.month)) || [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-secondary-900">Hey {user?.name || 'there'}! 👋</h1>
          <p className="text-lg text-secondary-600">Here's what's happening with your finances today.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/transactions')} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
          <Button 
            onClick={() => navigate('/upload')} 
            variant="outline" 
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Receipt
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={`₹${summary?.balance?.toFixed(2) || '0.00'}`}
          icon={Wallet}
          trend={summary?.balance >= 0 ? 'up' : 'down'}
          trendValue={`${summary?.balance >= 0 ? '+' : ''}${summary?.balance?.toFixed(2) || '0.00'}`}
          color="primary"
        />
        
        <StatCard
          title="Total Income"
          value={`₹${summary?.totalIncome?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          trend="up"
          trendValue={`${summary?.incomeCount || 0} transactions`}
          color="success"
        />
        
        <StatCard
          title="Total Expenses"
          value={`₹${summary?.totalExpense?.toFixed(2) || '0.00'}`}
          icon={TrendingDown}
          trend="down"
          trendValue={`${summary?.expenseCount || 0} transactions`}
          color="danger"
        />
        
        <StatCard
          title="Savings Rate"
          value={`${summary?.totalIncome > 0 ? ((summary?.totalIncome - summary?.totalExpense) / summary?.totalIncome * 100).toFixed(1) : 0}`}
          icon={Target}
          trend={summary?.totalIncome > summary?.totalExpense ? 'up' : 'down'}
          trendValue="This month"
          color="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expenses by Category Chart */}
        <Card className="lg:col-span-2 border-0 shadow-elegant-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-secondary-900">Spending Overview</CardTitle>
                <p className="text-sm text-secondary-600 mt-1">Your expense breakdown by category</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200">
                <Activity className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Monthly Trends</CardTitle>
            <p className="text-sm text-muted-foreground">Income vs expenses over time</p>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value?.toFixed(2) || '0.00'}`, '']} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Full Width */}
      <Card className="border-0 shadow-elegant-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-secondary-900">Recent Activity</CardTitle>
                <p className="text-sm text-secondary-600 mt-1">Your latest transactions</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/transactions')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length > 0 ? (
              <div className="space-y-0">
                {recentTransactions.map((transaction, index) => (
                  <div key={transaction._id} className={`flex items-center justify-between p-6 ${
                    index !== recentTransactions.length - 1 ? 'border-b border-secondary-100' : ''
                  } hover:bg-secondary-50 transition-colors`}>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-lg"
                        style={{ backgroundColor: transaction.category?.color || '#3b82f6' }}
                      >
                        {transaction.category?.icon || '📁'}
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-900">{transaction.description}</p>
                        <p className="text-sm text-secondary-500 font-medium">
                          {transaction.category?.name} • {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </p>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-success-100 text-success-700' 
                          : 'bg-danger-100 text-danger-700'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-secondary-400" />
                </div>
                <p className="text-secondary-600 mb-4 font-medium">
                  No transactions yet. Start tracking your finances!
                </p>
                <Button 
                  onClick={() => navigate('/transactions')}
                >
                  Add Your First Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default Dashboard;