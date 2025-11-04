import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import paymentQR from 'figma:asset/15b4911465f7d1743a0ae036f7679526e9e67c96.png';

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
  const handlePayNow = () => {
    console.log('Opening UPI link:', upiLink);
    // Open UPI deep link in new tab for better compatibility
    const link = document.createElement('a');
    link.href = upiLink;
    link.target = '_blank';
    link.click();
    toast.info('UPI app should open. Complete payment there.');
  };

  const handleClose = () => {
    toast.info('Payment window closed. Please complete payment and check your orders.');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Extra overlay to ensure visibility */}
      <div className="fixed inset-0 z-[60] bg-black/60 pointer-events-none" style={{ display: open ? 'block' : 'none' }} />
      
      <Dialog open={open} onOpenChange={handleClose}>
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

          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Amount to Pay</p>
              <p className="text-3xl">₹{amount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Order #{orderId.split('_')[1] || orderId.substring(0, 10)}</p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                <img src={paymentQR} alt="Payment QR Code" className="w-[280px] h-auto" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Scan with any UPI app (PhonePe, Google Pay, Paytm, etc.)
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={handlePayNow}
              >
                Pay with PhonePe/UPI
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Transaction ID: {transactionId}</p>
              <p className="text-orange-600">Note: After completing payment, your order will be processed automatically.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
