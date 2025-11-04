import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Fixed retailer credentials
const RETAILER_EMAIL = 'rionithin446@gmail.com';
const RETAILER_PASSWORD_KEY = 'retailer:password:hash';

// Initialize retailer password on first run
async function initializeRetailerPassword() {
  const existingPassword = await kv.get(RETAILER_PASSWORD_KEY);
  if (!existingPassword) {
    // Set initial password
    await kv.set(RETAILER_PASSWORD_KEY, 'Rio_vr_446');
  }
}

// Call initialization
initializeRetailerPassword();

// Initialize Supabase Storage bucket for product images
async function initializeStorage() {
  const bucketName = 'make-08d26c19-products';
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: true });
  }
}

initializeStorage();

// Helper function to verify user
async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (!user || error) {
    return null;
  }
  return user;
}

// Retailer login endpoint
app.post('/make-server-08d26c19/retailer/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (email !== RETAILER_EMAIL) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const storedPassword = await kv.get(RETAILER_PASSWORD_KEY);
    if (password !== storedPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create or get retailer session
    const retailerId = 'retailer:fixed';
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await kv.set(`session:${sessionToken}`, {
      userId: retailerId,
      email: RETAILER_EMAIL,
      userType: 'retailer',
      createdAt: new Date().toISOString(),
    });

    return c.json({ 
      sessionToken,
      user: {
        id: retailerId,
        email: RETAILER_EMAIL,
        userType: 'retailer',
      }
    });
  } catch (error) {
    console.log(`Error during retailer login: ${error}`);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Change retailer password
app.post('/make-server-08d26c19/retailer/change-password', async (c) => {
  try {
    const { sessionToken, currentPassword, newPassword } = await c.req.json();
    
    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const storedPassword = await kv.get(RETAILER_PASSWORD_KEY);
    if (currentPassword !== storedPassword) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    await kv.set(RETAILER_PASSWORD_KEY, newPassword);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error changing retailer password: ${error}`);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// Verify session
app.post('/make-server-08d26c19/verify-session', async (c) => {
  try {
    const { sessionToken } = await c.req.json();
    const session = await kv.get(`session:${sessionToken}`);
    
    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    return c.json({ session });
  } catch (error) {
    console.log(`Error verifying session: ${error}`);
    return c.json({ error: 'Session verification failed' }, 500);
  }
});

// Customer signup endpoint
app.post('/make-server-08d26c19/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      user_metadata: { name, userType: 'customer' },
      email_confirm: true // Automatically confirm since email server isn't configured
    });

    if (error) {
      console.log(`Error during customer sign up for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user }, 201);
  } catch (error) {
    console.log(`Server error during sign up: ${error}`);
    return c.json({ error: 'Sign up failed' }, 500);
  }
});

// Get user profile
app.get('/make-server-08d26c19/profile', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let profile = await kv.get(`user_profile:${user.id}`);
    
    if (!profile) {
      // Create default profile from user metadata
      profile = {
        userId: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
        userType: user.user_metadata?.userType || 'customer',
        address: undefined,
      };
      // Store it for future use
      await kv.set(`user_profile:${user.id}`, profile);
    }
    
    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching user profile: ${error}`);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user address
app.put('/make-server-08d26c19/profile/address', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { address } = await c.req.json();
    const profile = await kv.get(`user_profile:${user.id}`) || { userId: user.id };
    profile.address = address;
    
    await kv.set(`user_profile:${user.id}`, profile);
    return c.json({ profile });
  } catch (error) {
    console.log(`Error updating address: ${error}`);
    return c.json({ error: 'Failed to update address' }, 500);
  }
});

// Upload product image
app.post('/make-server-08d26c19/upload-image', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileName = `${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from('make-08d26c19-products')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.log(`Error uploading image: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    const { data: publicUrlData } = supabase.storage
      .from('make-08d26c19-products')
      .getPublicUrl(fileName);

    return c.json({ imageUrl: publicUrlData.publicUrl });
  } catch (error) {
    console.log(`Error processing image upload: ${error}`);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Add product (retailer only)
app.post('/make-server-08d26c19/products', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    let isRetailer = false;

    // Check if retailer session
    if (sessionToken) {
      const session = await kv.get(`session:${sessionToken}`);
      if (session?.userType === 'retailer') {
        isRetailer = true;
      }
    }

    if (!isRetailer) {
      const user = await verifyUser(c.req.raw);
      if (!user || user.user_metadata?.userType !== 'retailer') {
        return c.json({ error: 'Only retailers can add products' }, 403);
      }
    }

    const product = await c.req.json();
    const productId = `product:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const productData = {
      id: productId,
      ...product,
      retailerId: 'retailer:fixed',
      createdAt: new Date().toISOString(),
    };

    await kv.set(productId, productData);
    return c.json({ product: productData }, 201);
  } catch (error) {
    console.log(`Error adding product: ${error}`);
    return c.json({ error: 'Failed to add product' }, 500);
  }
});

// Get all products
app.get('/make-server-08d26c19/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ products });
  } catch (error) {
    console.log(`Error fetching products: ${error}`);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get products by retailer
app.get('/make-server-08d26c19/products/retailer', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allProducts = await kv.getByPrefix('product:');
    return c.json({ products: allProducts });
  } catch (error) {
    console.log(`Error fetching retailer products: ${error}`);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Update product (retailer only)
app.put('/make-server-08d26c19/products/:id', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('id');
    const existingProduct = await kv.get(productId);

    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const updates = await c.req.json();
    const updatedProduct = { ...existingProduct, ...updates };
    
    await kv.set(productId, updatedProduct);
    return c.json({ product: updatedProduct });
  } catch (error) {
    console.log(`Error updating product: ${error}`);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Delete product (retailer only)
app.delete('/make-server-08d26c19/products/:id', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('id');
    const existingProduct = await kv.get(productId);

    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    await kv.del(productId);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting product: ${error}`);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Place order (customer only)
app.post('/make-server-08d26c19/orders', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderData = await c.req.json();
    const orderId = `order:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate barcode and tracking number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderPart = orderId.split('_')[1]?.substring(0, 4).toUpperCase() || random;
    const barcode = `VST${timestamp}${orderPart}${random}`;
    
    const trackingPrefix = 'VAST';
    const trackingTimestamp = Date.now().toString().slice(-8);
    const trackingRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const trackingNumber = `${trackingPrefix}${trackingTimestamp}${trackingRandom}`;
    
    // Calculate estimated delivery (5-7 days)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (Math.floor(Math.random() * 3) + 5));
    
    const order = {
      id: orderId,
      ...orderData,
      customerId: user.id,
      customerName: user.user_metadata?.name || 'Customer',
      customerEmail: user.email,
      customerPhone: user.phone,
      status: 'pending',
      paymentStatus: 'pending',
      barcode,
      trackingNumber,
      estimatedDelivery: estimatedDelivery.toISOString(),
      deliveryConfirmed: false,
      createdAt: new Date().toISOString(),
    };

    await kv.set(orderId, order);
    return c.json({ order }, 201);
  } catch (error) {
    console.log(`Error placing order: ${error}`);
    return c.json({ error: 'Failed to place order' }, 500);
  }
});

// Get customer orders
app.get('/make-server-08d26c19/orders', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    
    if (sessionToken) {
      // Retailer session
      const session = await kv.get(`session:${sessionToken}`);
      if (session?.userType === 'retailer') {
        const allOrders = await kv.getByPrefix('order:');
        allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return c.json({ orders: allOrders });
      }
    }

    // Customer session
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:');
    const orders = allOrders.filter(order => order.customerId === user.id);
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ orders });
  } catch (error) {
    console.log(`Error fetching orders: ${error}`);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Update order status (retailer only)
app.put('/make-server-08d26c19/orders/:id/status', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Only retailers can update order status' }, 403);
    }

    const orderId = c.req.param('id');
    const { status } = await c.req.json();
    
    const order = await kv.get(orderId);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    await kv.set(orderId, order);
    return c.json({ order });
  } catch (error) {
    console.log(`Error updating order status: ${error}`);
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

// Create PhonePe payment order
app.post('/make-server-08d26c19/create-payment', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount, orderId } = await c.req.json();
    
    // Generate UPI payment link (PhonePe format)
    const merchantVPA = 'vastralaya@phonepe'; // Replace with your actual PhonePe merchant VPA
    const merchantName = 'Vastralaya';
    const transactionId = `TXN${Date.now()}`;
    
    // UPI deep link format
    const upiLink = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}&tr=${transactionId}`;
    
    // Store payment record
    await kv.set(`payment:${transactionId}`, {
      transactionId,
      orderId,
      amount,
      customerId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return c.json({ 
      transactionId,
      upiLink,
      qrData: upiLink, // Can be used to generate QR code on frontend
    });
  } catch (error) {
    console.log(`Error creating payment: ${error}`);
    return c.json({ error: 'Failed to create payment' }, 500);
  }
});

// Verify payment (webhook or manual verification)
app.post('/make-server-08d26c19/verify-payment', async (c) => {
  try {
    const { transactionId, status } = await c.req.json();
    
    const payment = await kv.get(`payment:${transactionId}`);
    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    payment.status = status; // 'success' or 'failed'
    payment.verifiedAt = new Date().toISOString();
    
    await kv.set(`payment:${transactionId}`, payment);
    
    const order = await kv.get(payment.orderId);
    if (order) {
      if (status === 'success') {
        // Payment successful - confirm order
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.updatedAt = new Date().toISOString();
        await kv.set(payment.orderId, order);
      } else {
        // Payment failed - cancel order
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        order.updatedAt = new Date().toISOString();
        await kv.set(payment.orderId, order);
      }
    }

    return c.json({ payment, order });
  } catch (error) {
    console.log(`Error verifying payment: ${error}`);
    return c.json({ error: 'Failed to verify payment' }, 500);
  }
});

// Track order by barcode or tracking number
app.get('/make-server-08d26c19/track/:identifier', async (c) => {
  try {
    const identifier = c.req.param('identifier');
    const allOrders = await kv.getByPrefix('order:');
    
    // Search by barcode or tracking number
    const order = allOrders.find(o => 
      o.barcode === identifier || 
      o.trackingNumber === identifier ||
      o.id === identifier
    );
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    return c.json({ order });
  } catch (error) {
    console.log(`Error tracking order: ${error}`);
    return c.json({ error: 'Failed to track order' }, 500);
  }
});

// Migrate old orders to add barcodes (retailer only)
app.post('/make-server-08d26c19/migrate-orders', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Only retailers can migrate orders' }, 403);
    }

    const allOrders = await kv.getByPrefix('order:');
    let migratedCount = 0;

    for (const order of allOrders) {
      if (!order.barcode || !order.trackingNumber) {
        // Generate barcode
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderPart = order.id.split('_')[1]?.substring(0, 4).toUpperCase() || random;
        order.barcode = `VST${timestamp}${orderPart}${random}`;
        
        // Generate tracking number
        const trackingPrefix = 'VAST';
        const trackingTimestamp = Date.now().toString().slice(-8);
        const trackingRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        order.trackingNumber = `${trackingPrefix}${trackingTimestamp}${trackingRandom}`;
        
        // Set payment status if missing
        if (!order.paymentStatus) {
          order.paymentStatus = order.status === 'cancelled' ? 'failed' : 'paid';
        }
        
        // Set estimated delivery if missing
        if (!order.estimatedDelivery) {
          const estimatedDate = new Date(order.createdAt);
          estimatedDate.setDate(estimatedDate.getDate() + 7);
          order.estimatedDelivery = estimatedDate.toISOString();
        }
        
        await kv.set(order.id, order);
        migratedCount++;
      }
    }

    return c.json({ 
      message: `Successfully migrated ${migratedCount} orders`,
      migratedCount,
      totalOrders: allOrders.length,
    });
  } catch (error) {
    console.log(`Error migrating orders: ${error}`);
    return c.json({ error: 'Failed to migrate orders' }, 500);
  }
});

// Regenerate barcode for a specific order (retailer only)
app.post('/make-server-08d26c19/orders/:id/regenerate-barcode', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await kv.get(`session:${sessionToken}`);
    if (!session || session.userType !== 'retailer') {
      return c.json({ error: 'Only retailers can regenerate barcodes' }, 403);
    }

    const orderId = c.req.param('id');
    const order = await kv.get(orderId);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Generate new barcode
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderPart = orderId.split('_')[1]?.substring(0, 4).toUpperCase() || random;
    order.barcode = `VST${timestamp}${orderPart}${random}`;
    
    // Generate new tracking number
    const trackingPrefix = 'VAST';
    const trackingTimestamp = Date.now().toString().slice(-8);
    const trackingRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    order.trackingNumber = `${trackingPrefix}${trackingTimestamp}${trackingRandom}`;
    
    order.updatedAt = new Date().toISOString();
    order.barcodeRegeneratedAt = new Date().toISOString();
    
    await kv.set(orderId, order);
    
    return c.json({ 
      order,
      message: 'Barcode regenerated successfully',
    });
  } catch (error) {
    console.log(`Error regenerating barcode: ${error}`);
    return c.json({ error: 'Failed to regenerate barcode' }, 500);
  }
});

// Confirm delivery (customer only)
app.post('/make-server-08d26c19/orders/:id/confirm-delivery', async (c) => {
  try {
    const user = await verifyUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('id');
    const { confirmed } = await c.req.json();
    
    const order = await kv.get(orderId);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    if (order.customerId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    order.deliveryConfirmed = confirmed;
    if (confirmed) {
      order.deliveryConfirmedAt = new Date().toISOString();
      order.status = 'delivered';
    }
    order.updatedAt = new Date().toISOString();
    
    await kv.set(orderId, order);
    return c.json({ order });
  } catch (error) {
    console.log(`Error confirming delivery: ${error}`);
    return c.json({ error: 'Failed to confirm delivery' }, 500);
  }
});

Deno.serve(app.fetch);
