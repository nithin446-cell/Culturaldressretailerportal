# Vastralaya E-Commerce Platform - Checkout Guide

## How to Place an Order (Customer Portal)

### Step 1: Browse Products
1. Navigate to the "Shop" tab in the customer portal
2. Browse through the traditional Indian dresses
3. Use search and category filters to find products

### Step 2: Add to Cart
1. Click "Add to Cart" on any product
2. The cart sidebar will open automatically
3. You can adjust quantities using +/- buttons
4. Remove items using the trash icon

### Step 3: Enter Shipping Address
1. Fill in all required address fields:
   - Street Address
   - City
   - State
   - Pincode
   - Country (default: India)

### Step 4: Place Order
1. Click the "Place Order" button at the bottom
2. Wait for the order to be created (you'll see "Placing Order...")
3. A success toast will appear: "Order created! Please complete payment."

### Step 5: Complete Payment
1. The PhonePe payment modal will automatically open
2. You have three payment options:
   - **Scan QR Code**: Use any UPI app to scan
   - **Pay with PhonePe/UPI**: Opens UPI deep link
   - **Manual Confirmation**: For testing purposes

3. After completing payment in your UPI app:
   - Click "I've Paid" to confirm
   - Your order will be marked as confirmed
   - Cart will be cleared automatically

## Troubleshooting

### Payment Modal Not Showing?
- Check browser console for errors (F12)
- Ensure all address fields are filled
- Try refreshing the page and adding items again

### Can't Click Buttons?
- The animated background should not block clicks
- If buttons are unresponsive, check z-index in browser DevTools

### Order Not Appearing in "My Orders"?
- Wait a few seconds and refresh
- Check that payment was confirmed
- Look in the retailer portal's order management

## For Retailers

### To Add Products:
1. Login with credentials: rionithin446@gmail.com / Rio_vr_446
2. Go to "My Products" tab
3. Click "Add Product"
4. Fill in all product details and upload an image
5. Click "Save Product"

### To Manage Orders:
1. Go to "Orders" tab
2. View all customer orders
3. Update order status as needed:
   - Pending → Confirmed → Shipped → Delivered

## Technical Details

### API Endpoints Used:
- `POST /make-server-08d26c19/orders` - Create order
- `POST /make-server-08d26c19/create-payment` - Initialize payment
- `POST /make-server-08d26c19/verify-payment` - Confirm payment

### Payment Flow:
1. Order is created with status "pending"
2. Payment transaction is initialized
3. UPI link and QR code are generated
4. After payment, status updates to "confirmed"
5. Order appears in both customer and retailer portals

### Data Storage:
- All data stored in Supabase KV store
- Images stored in Supabase Storage
- Real-time sync between portals

## Notes

This is a prototype/demo application:
- Payment is simulated (no real money transactions)
- PhonePe integration would require merchant account in production
- Email confirmations are not sent (email server not configured)
- SMS OTP requires Supabase phone auth setup
