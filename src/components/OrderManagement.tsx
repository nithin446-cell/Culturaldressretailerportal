import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Order } from '../types';
import { getOrders, updateOrderStatus } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface OrderManagementProps {
  sessionToken: string;
}

export function OrderManagement({ sessionToken }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders(undefined, sessionToken);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatus(sessionToken, orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      toast.success('Order status updated');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="size-16 text-gray-300 mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Orders ({orders.length})</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-2">
                    Order #{order.id.split('_')[1]}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Customer: {order.customerName} ({order.customerEmail})
                  </p>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(order.status)}
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="mb-1">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                    <p>₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="border-t pt-4">
                <p className="text-sm mb-1">Shipping Address</p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.street}, {order.shippingAddress.city}
                  <br />
                  {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </div>

              {/* Total */}
              <div className="flex justify-between border-t pt-4">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}