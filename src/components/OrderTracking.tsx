import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Package, Truck, CheckCircle, XCircle, Barcode, Search, MapPin } from 'lucide-react';
import { getOrders, trackOrder, confirmDelivery } from '../utils/api';
import type { Order } from '../types';
import { toast } from 'sonner@2.0.3';
import { formatBarcodeDisplay } from '../utils/barcode';
import QRCode from 'react-qr-code';

interface OrderTrackingProps {
  accessToken: string;
  userId: string;
}

export function OrderTracking({ accessToken, userId }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders(accessToken);
      // Filter out cancelled orders with failed payments
      const validOrders = data.filter((order: Order) => 
        !(order.status === 'cancelled' && order.paymentStatus === 'failed')
      );
      setOrders(validOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchIdentifier.trim()) {
      toast.error('Please enter a barcode, tracking number, or order ID');
      return;
    }

    setIsSearching(true);
    try {
      const order = await trackOrder(searchIdentifier.trim().replace(/-/g, ''));
      setSearchedOrder(order);
      toast.success('Order found!');
    } catch (error: any) {
      console.error('Error tracking order:', error);
      toast.error(error.message || 'Order not found');
      setSearchedOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string, confirmed: boolean) => {
    try {
      const updatedOrder = await confirmDelivery(accessToken, orderId, confirmed);
      
      // Update in both lists
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      if (searchedOrder?.id === orderId) {
        setSearchedOrder(updatedOrder);
      }
      
      toast.success(confirmed ? 'Delivery confirmed! Thank you.' : 'Delivery issue reported.');
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error(error.message || 'Failed to confirm delivery');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Package className="size-5" />;
      case 'confirmed': return <CheckCircle className="size-5" />;
      case 'shipped': return <Truck className="size-5" />;
      case 'delivered': return <CheckCircle className="size-5" />;
      case 'cancelled': return <XCircle className="size-5" />;
      default: return <Package className="size-5" />;
    }
  };

  const renderOrderCard = (order: Order, isSearchResult = false) => {
    const estimatedDate = order.estimatedDelivery 
      ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Not available';

    return (
      <Card key={order.id} className={isSearchResult ? 'border-2 border-orange-500' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                Order #{order.id.split('_')[1]?.substring(0, 8) || order.id.substring(0, 8)}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barcode Section */}
          {order.barcode || order.trackingNumber ? (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Barcode className="size-5 text-orange-600" />
                  <span className="text-sm">Barcode</span>
                </div>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  {formatBarcodeDisplay(order.barcode)}
                </code>
              </div>
              
              {order.barcode && (
                <div className="flex items-center justify-center bg-white p-3 rounded border">
                  <QRCode value={order.barcode} size={120} />
                </div>
              )}
              
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                <code className="text-sm bg-white px-3 py-1 rounded border">
                  {order.trackingNumber || 'N/A'}
                </code>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
              <p className="text-yellow-800">
                ⚠️ Old order - no barcode. New orders will have tracking barcodes.
              </p>
            </div>
          )}

          {/* Order Items */}
          <div>
            <p className="text-sm mb-2">Items:</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between border-t pt-2">
            <span>Total</span>
            <span>₹{order.totalAmount.toLocaleString()}</span>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Payment:</span>
            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
              {(order.paymentStatus || 'pending').toUpperCase()}
            </Badge>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm">Order Status:</p>
            <div className="space-y-2">
              {['confirmed', 'shipped', 'delivered'].map((status, idx) => {
                const isCompleted = 
                  status === 'confirmed' && ['confirmed', 'shipped', 'delivered'].includes(order.status) ||
                  status === 'shipped' && ['shipped', 'delivered'].includes(order.status) ||
                  status === 'delivered' && order.status === 'delivered';
                
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="size-4" /> : getStatusIcon(status as Order['status'])}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${isCompleted ? 'font-medium' : 'text-gray-500'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Alert>
              <MapPin className="size-4" />
              <AlertDescription>
                Estimated Delivery: <strong>{estimatedDate}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Delivery Confirmation */}
          {order.status === 'delivered' && !order.deliveryConfirmed && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <p className="text-sm">Did you receive your order?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleConfirmDelivery(order.id, true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="size-4 mr-2" />
                  Yes, Received
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConfirmDelivery(order.id, false)}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="size-4 mr-2" />
                  No, Issue
                </Button>
              </div>
            </div>
          )}

          {order.deliveryConfirmed && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="size-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Delivery confirmed on {new Date(order.deliveryConfirmedAt!).toLocaleDateString('en-IN')}
              </AlertDescription>
            </Alert>
          )}

          {/* Shipping Address */}
          <div className="text-sm text-gray-600 pt-2 border-t">
            <p className="mb-1">Shipping to:</p>
            <p className="text-xs">
              {order.shippingAddress.street}, {order.shippingAddress.city}, 
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Track Your Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Barcode, Tracking Number, or Order ID"
              value={searchIdentifier}
              onChange={(e) => setSearchIdentifier(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Track'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You can track using barcode (VST-XXXXX-XXXX-XXXX), tracking number (VASTXXXXXXXXXX), or order ID
          </p>
        </CardContent>
      </Card>

      {/* Search Result */}
      {searchedOrder && (
        <div>
          <h3 className="text-lg mb-3">Search Result</h3>
          {renderOrderCard(searchedOrder, true)}
        </div>
      )}

      {/* All Orders */}
      <div>
        <h3 className="text-lg mb-3">Your Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="size-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => renderOrderCard(order))}
          </div>
        )}
      </div>
    </div>
  );
}
