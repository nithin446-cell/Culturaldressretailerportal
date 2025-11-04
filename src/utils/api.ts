import { projectId, publicAnonKey } from './supabase/info';
import type { Product, Order, Address } from '../types';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-08d26c19`;

// Helper to get authorization header
export function getAuthHeader(token?: string, sessionToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };
  
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  return headers;
}

// Retailer Auth API
export async function retailerLogin(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/retailer/login`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function changeRetailerPassword(sessionToken: string, currentPassword: string, newPassword: string) {
  const response = await fetch(`${BASE_URL}/retailer/change-password`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ sessionToken, currentPassword, newPassword }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to change password');
  }
  return data;
}

export async function verifySession(sessionToken: string) {
  const response = await fetch(`${BASE_URL}/verify-session`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ sessionToken }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Session verification failed');
  }
  return data.session;
}

// Customer Auth API
export async function signup(email: string, password: string, name: string, phone?: string) {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ email, password, name, phone, userType: 'customer' }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Sign up failed');
  }
  return data;
}

// Profile API
export async function getProfile(token: string) {
  const response = await fetch(`${BASE_URL}/profile`, {
    headers: getAuthHeader(token),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }
  return data.profile;
}

export async function updateAddress(token: string, address: Address) {
  const response = await fetch(`${BASE_URL}/profile/address`, {
    method: 'PUT',
    headers: getAuthHeader(token),
    body: JSON.stringify({ address }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update address');
  }
  return data.profile;
}

// Image Upload API
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BASE_URL}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload image');
  }
  return data.imageUrl;
}

// Products API
export async function addProduct(sessionToken: string, product: Omit<Product, 'id' | 'retailerId' | 'createdAt'>) {
  const response = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: getAuthHeader(publicAnonKey, sessionToken),
    body: JSON.stringify(product),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add product');
  }
  return data.product;
}

export async function getProducts() {
  const response = await fetch(`${BASE_URL}/products`, {
    headers: getAuthHeader(),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch products');
  }
  return data.products;
}

export async function getRetailerProducts(sessionToken: string) {
  const response = await fetch(`${BASE_URL}/products/retailer`, {
    headers: getAuthHeader(publicAnonKey, sessionToken),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch products');
  }
  return data.products;
}

export async function updateProduct(sessionToken: string, productId: string, updates: Partial<Product>) {
  const response = await fetch(`${BASE_URL}/products/${productId}`, {
    method: 'PUT',
    headers: getAuthHeader(publicAnonKey, sessionToken),
    body: JSON.stringify(updates),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update product');
  }
  return data.product;
}

export async function deleteProduct(sessionToken: string, productId: string) {
  const response = await fetch(`${BASE_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeader(publicAnonKey, sessionToken),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete product');
  }
  return data;
}

// Orders API
export async function placeOrder(token: string, orderData: Omit<Order, 'id' | 'customerId' | 'customerName' | 'customerEmail' | 'status' | 'createdAt'>) {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify(orderData),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to place order');
  }
  return data.order;
}

export async function getOrders(token?: string, sessionToken?: string) {
  const response = await fetch(`${BASE_URL}/orders`, {
    headers: getAuthHeader(token, sessionToken),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch orders');
  }
  return data.orders;
}

export async function updateOrderStatus(sessionToken: string, orderId: string, status: Order['status']) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeader(publicAnonKey, sessionToken),
    body: JSON.stringify({ status }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update order status');
  }
  return data.order;
}

// Payment API
export async function createPayment(token: string, amount: number, orderId: string) {
  const response = await fetch(`${BASE_URL}/create-payment`, {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify({ amount, orderId }),
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to create payment';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      errorMessage = `${response.statusText} (${response.status})`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
}

export async function verifyPayment(transactionId: string, status: 'success' | 'failed') {
  const response = await fetch(`${BASE_URL}/verify-payment`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ transactionId, status }),
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to verify payment';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      errorMessage = `${response.statusText} (${response.status})`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
}

// Track order by barcode, tracking number, or order ID
export async function trackOrder(identifier: string) {
  const response = await fetch(`${BASE_URL}/track/${identifier}`, {
    headers: getAuthHeader(),
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to track order';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      errorMessage = `${response.statusText} (${response.status})`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data.order;
}

// Confirm delivery (customer only)
export async function confirmDelivery(token: string, orderId: string, confirmed: boolean) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/confirm-delivery`, {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify({ confirmed }),
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to confirm delivery';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = `${response.statusText} (${response.status})`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data.order;
}

// Migrate orders to add barcodes (retailer only)
export async function migrateOrders(sessionToken: string) {
  const response = await fetch(`${BASE_URL}/migrate-orders`, {
    method: 'POST',
    headers: getAuthHeader(publicAnonKey, sessionToken),
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to migrate orders';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      errorMessage = `${response.statusText} (${response.status})`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
}

// Regenerate barcode for a specific order (retailer only)
export async function regenerateBarcode(sessionToken: string, orderId: string) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/regenerate-barcode`, {
    method: 'POST',
    headers: getAuthHeader(publicAnonKey, sessionToken),
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to regenerate barcode';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      errorMessage = `${response.statusText} (${response.status})`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data.order;
}
