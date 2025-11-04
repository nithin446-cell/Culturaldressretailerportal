// Generate a unique barcode for orders
export function generateBarcode(orderId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderPart = orderId.split('_')[1]?.substring(0, 4).toUpperCase() || random;
  return `VST${timestamp}${orderPart}${random}`;
}

// Generate tracking number
export function generateTrackingNumber(): string {
  const prefix = 'VAST';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

// Calculate estimated delivery date (5-7 business days)
export function calculateEstimatedDelivery(): string {
  const today = new Date();
  const deliveryDays = Math.floor(Math.random() * 3) + 5; // 5-7 days
  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + deliveryDays);
  return estimatedDate.toISOString();
}

// Format barcode for display
export function formatBarcodeDisplay(barcode?: string): string {
  if (!barcode) {
    return 'N/A';
  }
  // Add dashes for readability: VST-XXXXX-XXXX-XXXX
  if (barcode.length >= 16) {
    return `${barcode.slice(0, 3)}-${barcode.slice(3, 8)}-${barcode.slice(8, 12)}-${barcode.slice(12)}`;
  }
  return barcode;
}

// Validate barcode format
export function isValidBarcode(barcode?: string): boolean {
  if (!barcode) return false;
  return /^VST[A-Z0-9]{13,20}$/.test(barcode.replace(/-/g, ''));
}
