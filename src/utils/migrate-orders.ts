// Utility to migrate old orders to have barcodes
// This can be run once to update existing orders

import { generateBarcode, generateTrackingNumber, calculateEstimatedDelivery } from './barcode';

export async function migrateOrdersWithBarcodes(sessionToken: string) {
  try {
    const response = await fetch('/api/migrate-orders', {
      method: 'POST',
      headers: {
        'X-Session-Token': sessionToken,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Generate barcode for an order that doesn't have one
export function generateMissingBarcode(orderId: string) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderPart = orderId.split('_')[1]?.substring(0, 4).toUpperCase() || random;
  return `VST${timestamp}${orderPart}${random}`;
}
