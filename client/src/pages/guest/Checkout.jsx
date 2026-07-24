import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bookingAPI, paymentAPI } from '../../api';
import { MOCK_PROPERTY_DETAILS } from '../../lib/mockData';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  CreditCard, Lock, Shield, Building2, Calendar, AlertTriangle, CheckCircle2, Car, Bike, KeyRound, Loader2, ArrowRight, Smartphone, Globe, Wallet, Check, Sparkles
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState('FORM');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // In-app Razorpay Gateway Modal State
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState('card');
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [upiId, setUpiId] = useState('user@okhdfcbank');

  const VEHICLES = [
    { id: 'sedan', name: 'Economy Sedan Cab', rate: '₹10 / km', daily: 1200, icon: Car, desc: 'Ideal for city tours & local airport drop' },
    { id: 'suv', name: 'Luxury SUV (Innova)', rate: '₹18 / km', daily: 2400, icon: Car, desc: 'Spacious 7-seater for family & group travel' },
    { id: 'bike', name: 'Scooter / Bike Rental', rate: '₹400 / day', daily: 400, icon: Bike, desc: 'Effortless local commuting & sightseeing' },
    { id: 'selfdrive', name: 'Self-Drive SUV', rate: '₹1,500 / day', daily: 1500, icon: KeyRound, desc: 'Unlimited km self-drive vehicle at hotel' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => {
      if (bookingId && bookingId.startsWith('demo-booking-')) {
        const parts = bookingId.split('-');
        const propertyId = `demo-${parts[3]}`;
        const roomId = `demo-r-${parts[6]}`;
        const property = MOCK_PROPERTY_DETAILS[propertyId];
        const room = property?.rooms?.find(r => r.id === roomId) || property?.rooms?.[0];
        
        return Promise.resolve({
          id: bookingId,
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          guestsCount: 2,
          includePickup: false,
          pickupFee: 0,
          includeDining: false,
          diningFee: 0,
          discountAmount: 0,
          gstFee: Math.round((room?.pricePerNight || 2000) * 2 * 0.05),
          gstRate: 5,
          totalAmount: Math.round((room?.pricePerNight || 2000) * 2 * 1.05),
          status: 'PENDING_PAYMENT',
          room: {
            ...room,
            property: property
          }
        });
      }
      return bookingAPI.getOne(bookingId).then((r) => r.data.data);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (payload) => paymentAPI.verify(payload),
    onSuccess: () => {
      toast.success('🎉 Payment verified & booking confirmed!');
      navigate(`/booking/${bookingId}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Payment verification failed.');
      setStep('FORM');
    },
  });

  const handleStartPayment = async () => {
    setConfirmModalOpen(false);
    setStep('OPENING');

    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Failed to load Razorpay SDK script. Please check your internet connection.');
      setStep('FORM');
      return;
    }

    try {
      const orderRes = await paymentAPI.createOrder({ bookingId });
      const orderData = orderRes.data.data?.order || orderRes.data.data;

      if (!orderData || (!orderData.orderId && !orderData.id)) {
        throw new Error('Failed to retrieve order details from server');
      }

      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TGuoXv26IIKgZJ',
        order_id: orderData.orderId || orderData.id,
        name: 'StayNest Platform',
        description: `Reservation #${bookingId.substring(0, 8)}`,
        handler: async (res) => {
          setStep('VERIFYING');
          verifyPaymentMutation.mutate({
            razorpayOrderId: res.razorpay_order_id || orderData.orderId,
            razorpay_order_id: res.razorpay_order_id || orderData.orderId,
            razorpayPaymentId: res.razorpay_payment_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpaySignature: res.razorpay_signature,
            razorpay_signature: res.razorpay_signature,
            bookingId,
          });
        },
        prefill: {
          name: user?.name || 'Guest User',
          email: user?.email || 'guest@example.com',
          contact: user?.phone || '9999999999',
        },
        theme: {
          color: '#f97316',
        },
        modal: {
          ondismiss: () => {
            setStep('FORM');
            toast.info('Payment window closed');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to initialize payment gateway.';
      toast.error(msg);
      setStep('FORM');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 page-container max-w-4xl space-y-6">
        <Skeleton className="h-8 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const booking = data?.booking || data;
  if (!booking) {
    return (
      <div className="min-h-screen pt-24 page-container flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Reservation Not Found</h2>
          <Button onClick={() => navigate('/bookings')}>Go to My Bookings</Button>
        </Card>
      </div>
    );
  }

  const room = booking.room;
  const property = room?.property;
  const roomTotal = booking.totalAmount - (booking.gstFee || 0) - (booking.pickupFee || 0) - (booking.diningFee || 0) + (booking.discountAmount || 0);

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="page-container max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Confirm & Pay</h1>
          <p className="text-muted-foreground text-xs mt-1">Review your reservation details and trigger secure Razorpay checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold">Trip Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Check-in</div>
                  <div className="font-semibold">{format(new Date(booking.checkIn), 'EEE, MMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Check-out</div>
                  <div className="font-semibold">{format(new Date(booking.checkOut), 'EEE, MMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Guests</div>
                  <div className="font-semibold">{booking.guestsCount} Guest(s)</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Room Type</div>
                  <div className="font-semibold">{room?.name}</div>
                </div>
              </div>
              {booking.includePickup && (
                <div className="pt-3 border-t border-border mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Airport Pickup</div>
                    <div className="font-semibold capitalize">{booking.pickupVehicleCategory} ({booking.pickupDistanceKm} km)</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pickup Location</div>
                    <div className="font-semibold">{booking.pickupLocation || 'Airport / Railway Station'}</div>
                  </div>
                </div>
              )}
              {booking.includeDining && (
                <div className="pt-3 border-t border-border mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Dining Package</div>
                    <div className="font-semibold capitalize">{booking.diningPlan?.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold text-emerald-500">Included in Reservation</div>
                  </div>
                </div>
              )}
            </Card>

            {/* Optional Add-on Local Vehicles */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-bold">Add Local Transport (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VEHICLES.map((v) => {
                  const Icon = v.icon;
                  const isSelected = selectedVehicle?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(isSelected ? null : v)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'hover:border-primary/50 bg-accent/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">{v.name}</div>
                          <div className="text-[11px] text-muted-foreground">{v.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {v.rate}
                        </Badge>
                        <span className="text-xs font-bold text-primary">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Payment Security Guarantee */}
            <Card className="p-6 bg-muted/20 border-emerald-500/20">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Protected by StayNest Guarantee</h4>
                  <p className="text-xs text-muted-foreground">Instant refund eligibility according to property cancellation policy.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Price & Razorpay Trigger Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-5 sticky top-24 shadow-2xl">
              <div className="flex items-center gap-3">
                <img
                  src={property?.thumbnailImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300'}
                  alt={property?.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300';
                  }}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm line-clamp-1">{property?.name}</h4>
                  <p className="text-xs text-muted-foreground">{property?.city}, India</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Charges</span>
                  <span className="font-semibold">₹{roomTotal.toLocaleString()}</span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount ({booking.couponCode || 'Promo'})</span>
                    <span>-₹{booking.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {booking.gstFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & GST ({booking.gstRate}%)</span>
                    <span className="font-semibold">₹{booking.gstFee.toLocaleString()}</span>
                  </div>
                )}
                {booking.includePickup && (
                  <div className="flex justify-between text-indigo-500">
                    <span className="text-muted-foreground">Airport Pickup ({booking.pickupVehicleCategory})</span>
                    <span className="font-semibold">+₹{booking.pickupFee.toLocaleString()}</span>
                  </div>
                )}
                {booking.includeDining && (
                  <div className="flex justify-between text-purple-500">
                    <span className="text-muted-foreground">Dining Plan ({booking.diningPlan})</span>
                    <span className="font-semibold">+₹{booking.diningFee.toLocaleString()}</span>
                  </div>
                )}
                {selectedVehicle && (
                  <div className="flex justify-between text-indigo-400 font-semibold">
                    <span>Extra Transport ({selectedVehicle.name})</span>
                    <span>+₹{selectedVehicle.daily.toLocaleString()}</span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between text-base font-bold">
                  <span>Total Payable</span>
                  <span className="text-primary">
                    ₹{(booking.totalAmount + (selectedVehicle?.daily || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                variant="gradient"
                size="lg"
                onClick={handleStartPayment}
                disabled={step !== 'FORM'}
                className="w-full h-12 rounded-xl font-bold shadow-xl"
              >
                {step === 'OPENING' || step === 'VERIFYING' ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Launching Razorpay...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Proceed to Razorpay</span>
                  </div>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
