export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  retailerId: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: CartItem[];
  totalAmount: number;
  shippingAddress: Address;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  barcode?: string;
  trackingNumber?: string;
  deliveryConfirmed?: boolean;
  deliveryConfirmedAt?: string;
  createdAt: string;
  updatedAt?: string;
  estimatedDelivery?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  userType: 'customer' | 'retailer';
  address?: Address;
}
