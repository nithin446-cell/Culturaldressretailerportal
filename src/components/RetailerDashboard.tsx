import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, ShoppingCart, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product, Order } from '../types';
import { getRetailerProducts, getOrders } from '../utils/api';

interface RetailerDashboardProps {
  sessionToken: string;
}

type TimeFilter = 'daily' | 'weekly' | 'monthly';

const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

export function RetailerDashboard({ sessionToken }: RetailerDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsData, ordersData] = await Promise.all([
        getRetailerProducts(sessionToken),
        getOrders(undefined, sessionToken),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders based on time period
  const getFilteredOrders = () => {
    const now = new Date();
    const startDate = new Date();

    switch (timeFilter) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && order.status !== 'cancelled';
    });
  };

  const filteredOrders = getFilteredOrders();

  // Calculate sales by category
  const salesByCategory = () => {
    const categoryStats: { [key: string]: { sales: number; revenue: number; count: number } } = {};
    
    filteredOrders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        order.items.forEach(item => {
          if (!categoryStats[item.category]) {
            categoryStats[item.category] = { sales: 0, revenue: 0, count: 0 };
          }
          categoryStats[item.category].sales += item.quantity;
          categoryStats[item.category].revenue += item.price * item.quantity;
          categoryStats[item.category].count += 1;
        });
      }
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      sales: stats.sales,
      revenue: stats.revenue,
      orders: stats.count,
    }));
  };

  // Calculate revenue over time
  const revenueOverTime = () => {
    const revenueMap: { [key: string]: number } = {};
    
    filteredOrders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        const date = new Date(order.createdAt);
        let key: string;
        
        switch (timeFilter) {
          case 'daily':
            key = date.getHours() + ':00';
            break;
          case 'weekly':
            key = date.toLocaleDateString('en-IN', { weekday: 'short' });
            break;
          case 'monthly':
            key = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            break;
        }
        
        revenueMap[key] = (revenueMap[key] || 0) + order.totalAmount;
      }
    });

    return Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-15); // Show last 15 data points
  };

  // Calculate order status distribution
  const orderStatusDistribution = () => {
    const statusCount: { [key: string]: number } = {};
    
    filteredOrders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  // Calculate key metrics
  const totalRevenue = filteredOrders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  const totalOrders = filteredOrders.length;
  
  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid').length;
  
  const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  
  const uniqueCustomers = new Set(filteredOrders.map(o => o.customerId)).size;

  const categoryData = salesByCategory();
  const revenueData = revenueOverTime();
  const statusData = orderStatusDistribution();

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'daily': return 'Today';
      case 'weekly': return 'Last 7 Days';
      case 'monthly': return 'Last 30 Days';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Dashboard Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Overview of {getTimeFilterLabel()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-gray-500" />
          <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily (Today)</SelectItem>
              <SelectItem value="weekly">Weekly (7 Days)</SelectItem>
              <SelectItem value="monthly">Monthly (30 Days)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{getTimeFilterLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
            <ShoppingCart className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">{paidOrders} paid orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Avg Order Value</CardTitle>
            <TrendingUp className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₹{Math.round(averageOrderValue).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Per paid order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Customers</CardTitle>
            <Users className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{uniqueCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">Unique customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No orders for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#f97316" name="Units Sold" />
                <Bar yAxisId="right" dataKey="revenue" fill="#ec4899" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-400">
              No sales data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Inventory Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl">{products.filter(p => p.stock > 10).length}</p>
                    <p className="text-sm text-gray-600">In Stock</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl">{products.filter(p => p.stock > 0 && p.stock <= 10).length}</p>
                    <p className="text-sm text-gray-600">Low Stock</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl">{products.filter(p => p.stock === 0).length}</p>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Total Products: {products.length}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">No products added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
