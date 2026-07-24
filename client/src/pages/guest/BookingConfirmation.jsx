import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingAPI } from '../../api';
import { MOCK_PROPERTY_DETAILS } from '../../lib/mockData';
import { format } from 'date-fns';
import { CheckCircle, MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
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
          status: 'CONFIRMED',
          room: {
            ...room,
            property: property
          }
        });
      }
      return bookingAPI.getOne(bookingId).then((r) => r.data.data);
    },
  });

  if (isLoading) return <div className="min-h-screen pt-24 text-center text-muted-foreground">Loading confirmation...</div>;
  if (!data) return null;

  const booking = data;
  const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000);

  return (
    <div className="min-h-screen pt-20 py-12">
      <div className="page-container max-w-xl mx-auto text-center space-y-6">
        {/* Success Icon */}
        <div className="relative inline-flex">
          <div className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center animate-scale-in">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Booking Confirmed! 🎉</h1>
          <p className="text-muted-foreground text-xs mt-1">Your stay has been booked and payment verified.</p>
        </div>

        {/* Card */}
        <Card className="p-6 text-left shadow-2xl">
          <CardContent className="p-0 space-y-4">
            <div className="flex gap-4">
              <img
                src={booking.room?.property?.thumbnailImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'}
                alt=""
                className="w-20 h-16 rounded-xl object-cover"
              />
              <div>
                <h2 className="font-bold text-foreground text-base">{booking.room?.property?.name}</h2>
                <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-primary" /> {booking.room?.property?.city}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">Check-in</span>
                <span className="font-semibold text-foreground">{format(new Date(booking.checkIn), 'EEE, dd MMM yyyy')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Check-out</span>
                <span className="font-semibold text-foreground">{format(new Date(booking.checkOut), 'EEE, dd MMM yyyy')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Room</span>
                <span className="font-semibold text-foreground">{booking.room?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Guests</span>
                <span className="font-semibold text-foreground">{booking.guestsCount} guests</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Duration</span>
                <span className="font-semibold text-foreground">{nights} night(s)</span>
              </div>
              <div>
                <span className="text-muted-foreground block">GST Tax ({booking.gstRate || 5}%)</span>
                <span className="font-semibold text-amber-400">₹{(booking.gstFee || 0).toLocaleString()}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground block">Booking Reference</span>
                <span className="font-mono text-xs font-semibold text-foreground">{booking.id}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Total Amount Paid</span>
                <span className="text-lg font-bold text-emerald-400">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" asChild className="flex-1 h-11 rounded-xl">
            <Link to="/bookings">View My Bookings</Link>
          </Button>
          <Button variant="gradient" asChild className="flex-1 h-11 rounded-xl">
            <Link to="/search">Explore More Stays</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
