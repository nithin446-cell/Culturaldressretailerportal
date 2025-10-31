import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PhonePePayment } from './PhonePePayment';
import type { CartItem, Address } from '../types';
import { placeOrder, createPayment } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClose: () => void;
  accessToken: string;
  shippingAddress?: Address;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onClose, accessToken, shippingAddress }: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [address, setAddress] = useState<Address>(shippingAddress || {
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 100 : 0;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    console.log('Checkout initiated with address:', address);
    
    if (!address.street || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in all address fields');
      return;
    }

    setIsCheckingOut(true);
    try {
      console.log('Creating order with items:', items);
      
      // First, create the order
      const order = await placeOrder(accessToken, {
        items,
        totalAmount: total,
        shippingAddress: address,
      });
      
      console.log('Order created successfully:', order);
      setCurrentOrderId(order.id);

      // Then, create payment
      console.log('Creating payment for order:', order.id);
      const payment = await createPayment(accessToken, total, order.id);
      console.log('Payment created successfully:', payment);
      
      setPaymentData(payment);
      setShowPayment(true);
      
      toast.success('Order created! Please complete payment.');
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(error.message || 'Failed to proceed to payment');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Order placed successfully!');
    items.forEach(item => onRemoveItem(item.id));
    onClose();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Button onClick={onClose}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm mb-1 truncate">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">₹{item.price.toLocaleString()}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, Math.min(item.quantity + 1, item.stock))}
                  disabled={item.quantity >= item.stock}
                >
                  <Plus className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-auto"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Shipping Address */}
        <div className="border-t pt-4 space-y-4">
          <h3>Shipping Address</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="Enter street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4 space-y-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>₹{shipping}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span>Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={handleCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>

      {/* Payment Modal */}
      {showPayment && paymentData && (
        <PhonePePayment
          open={showPayment}
          onClose={() => setShowPayment(false)}
          amount={total}
          orderId={currentOrderId}
          upiLink={paymentData.upiLink}
          transactionId={paymentData.transactionId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}