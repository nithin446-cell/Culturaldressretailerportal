import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Package, ShoppingCart, DollarSign, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product, Order } from '../types';
import { getRetailerProducts, getOrders } from '../utils/api';

interface RetailerDashboardProps {
  sessionToken: string;
}

const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

export function RetailerDashboard({ sessionToken }: RetailerDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Calculate sales by category
  const salesByCategory = () => {
    const categoryStats: { [key: string]: { sales: number; revenue: number; count: number } } = {};
    
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
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
      count: stats.count,
    }));
  };

  // Calculate order status distribution
  const orderStatusData = () => {
    const statusCount: { [key: string]: number } = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  // Calculate revenue over time (last 7 days)
  const revenueOverTime = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyRevenue = last7Days.map(date => {
      const dayOrders = orders.filter(order => 
        order.createdAt.split('T')[0] === date && order.status !== 'cancelled'
      );
      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: dayOrders.length,
      };
    });

    return dailyRevenue;
  };

  const categoryData = salesByCategory();
  const statusData = orderStatusData();
  const revenueData = revenueOverTime();

  // Calculate total stats
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl mb-2">Dashboard</h2>
        <p className="text-gray-600">Overview of your store performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
            <ShoppingCart className="size-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
            <Package className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">{totalStock} items in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Order Value</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#f97316" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Over Time Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="Revenue (₹)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Revenue Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Units Sold</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((cat, index) => (
                        <tr key={cat.category} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              {cat.category}
                            </div>
                          </td>
                          <td className="text-right p-2">{cat.sales}</td>
                          <td className="text-right p-2">₹{cat.revenue.toLocaleString()}</td>
                          <td className="text-right p-2">
                            ₹{Math.round(cat.revenue / cat.sales).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
