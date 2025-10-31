import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import QRCode from 'react-qr-code';
import { verifyPayment } from '../utils/api';

interface PhonePePaymentProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  upiLink: string;
  transactionId: string;
  onPaymentSuccess: () => void;
}

export function PhonePePayment({ 
  open, 
  onClose, 
  amount, 
  orderId,
  upiLink,
  transactionId,
  onPaymentSuccess 
}: PhonePePaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = () => {
    console.log('Opening UPI link:', upiLink);
    // Open UPI deep link in new tab for better compatibility
    const link = document.createElement('a');
    link.href = upiLink;
    link.target = '_blank';
    link.click();
    toast.info('UPI app should open. Complete payment there.');
  };

  const handleConfirmPayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Confirming payment for transaction:', transactionId);
      
      // Verify payment with the backend
      await verifyPayment(transactionId, 'success');
      setPaymentStatus('success');
      toast.success('Payment confirmed!');
      
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment. Please try again.');
      setPaymentStatus('pending');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Cancelling payment for transaction:', transactionId);
      await verifyPayment(transactionId, 'failed');
      setPaymentStatus('failed');
      toast.error('Payment cancelled');
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error cancelling payment:', error);
      toast.error(error.message || 'Failed to cancel payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Extra overlay to ensure visibility */}
      <div className="fixed inset-0 z-[60] bg-black/60 pointer-events-none" style={{ display: open ? 'block' : 'none' }} />
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md z-[70]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-purple-600" />
              PhonePe Payment
            </DialogTitle>
            <DialogDescription>
              Scan QR code or use UPI to complete payment
            </DialogDescription>
          </DialogHeader>

          {paymentStatus === 'pending' && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Amount to Pay</p>
                <p className="text-3xl">₹{amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Order #{orderId.split('_')[1] || orderId.substring(0, 10)}</p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                  <QRCode value={upiLink} size={200} />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Scan with any UPI app (PhonePe, Google Pay, Paytm, etc.)
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700" 
                  onClick={handlePayNow}
                  disabled={isProcessing}
                >
                  Pay with PhonePe/UPI
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">After payment</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleConfirmPayment} 
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    disabled={isProcessing}
                  >
                    <CheckCircle className="size-4 mr-1" />
                    {isProcessing ? 'Processing...' : "I've Paid"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelPayment} 
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    disabled={isProcessing}
                  >
                    <XCircle className="size-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>Transaction ID: {transactionId}</p>
                <p className="text-orange-600">Note: This is a prototype. In production, payment verification would be automated via PhonePe API.</p>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="size-16 text-green-500" />
              <p className="text-xl">Payment Successful!</p>
              <p className="text-sm text-gray-600">Your order has been confirmed</p>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="size-16 text-red-500" />
              <p className="text-xl">Payment Cancelled</p>
              <p className="text-sm text-gray-600">Please try again</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
