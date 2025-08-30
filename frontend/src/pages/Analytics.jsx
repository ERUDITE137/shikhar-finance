import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { transactionsAPI } from '../services/api';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('currentMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStartDate, customEndDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'currentMonth':
        // First day of current month at 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        // Last day of current month at 23:59:59
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        // First day of last month at 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        // Last day of last month at 23:59:59
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'currentYear':
        // First day of current year at 00:00:00
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        // Last day of current year at 23:59:59
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'last3Months':
        // First day of 3 months ago at 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0, 0);
        // Current date at 23:59:59
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'last6Months':
        // First day of 6 months ago at 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1, 0, 0, 0, 0);
        // Current date at 23:59:59
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate + 'T00:00:00') : null;
        endDate = customEndDate ? new Date(customEndDate + 'T23:59:59') : null;
        break;
      default:
        // First day of current month at 00:00:00
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        // Current date at 23:59:59
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      console.log('Analytics date range:', {
        dateRange,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        params
      });

      const response = await transactionsAPI.getAnalytics(params);
      setData(response.data.data || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
      setData({});
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const expensesPieData = data?.expensesByCategory?.map((item, index) => ({
    name: item.name,
    value: item.total,
    color: COLORS[index % COLORS.length],
    icon: item.icon
  })) || [];

  const incomePieData = data?.incomeByCategory?.map((item, index) => ({
    name: item.name,
    value: item.total,
    color: COLORS[index % COLORS.length],
    icon: item.icon
  })) || [];

  // Process monthly trends
  const monthlyTrends = data?.monthlyTrends?.reduce((acc, item) => {
    const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    const existing = acc.find(d => d.month === monthKey);
    
    if (existing) {
      existing[item._id.type] = item.total;
    } else {
      acc.push({
        month: monthKey,
        [item._id.type]: item.total,
        income: item._id.type === 'income' ? item.total : 0,
        expense: item._id.type === 'expense' ? item.total : 0
      });
    }
    
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)) || [];

  // Process daily spending
  const dailySpending = data?.dailySpending?.map(item => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    amount: item.total,
    count: item.count
  })).sort((a, b) => a.date.localeCompare(b.date)) || [];

  const totalExpenses = expensesPieData.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = incomePieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Visualize your financial data and trends</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="dateRange">Select Range</Label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="currentMonth">Current Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="last6Months">Last 6 Months</option>
                <option value="currentYear">Current Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(totalIncome - totalExpenses).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesPieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  {expensesPieData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.icon} {item.name}</span>
                      </div>
                      <span className="font-medium">
                        ₹{item.value.toFixed(2)} ({((item.value / totalExpenses) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Income by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {incomePieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  {incomePieData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.icon} {item.name}</span>
                      </div>
                      <span className="font-medium">
                        ₹{item.value.toFixed(2)} ({((item.value / totalIncome) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No income data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value?.toFixed(2) || '0.00'}`, '']} />
                <Legend />
                <Bar dataKey="income" fill="#4caf50" name="Income" />
                <Bar dataKey="expense" fill="#f44336" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No monthly trend data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f44336" 
                  strokeWidth={2}
                  dot={{ fill: '#f44336' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No daily spending data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;