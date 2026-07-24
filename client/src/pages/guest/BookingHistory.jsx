import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI, reviewAPI } from '../../api';
import { format } from 'date-fns';
import { MapPin, Star, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const STATUS_BADGES = {
  CONFIRMED: 'success',
  PAYMENT_PENDING: 'warning',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
  PENDING: 'warning',
};

function ReviewModal({ booking, open, onOpenChange }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('bookingId', booking.id);
      fd.append('rating', rating);
      fd.append('comment', comment);
      return reviewAPI.create(fd);
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      qc.invalidateQueries({ queryKey: ['myBookings'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Failed to submit review'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>{booking?.room?.property?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                <Star className={`h-7 w-7 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted/40'}`} />
              </button>
            ))}
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Tell us about your stay experience..."
            className="resize-none text-xs rounded-xl"
            minLength={10}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="gradient" onClick={() => mutation.mutate()} disabled={!comment.trim() || mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingHistory() {
  const [reviewTarget, setReviewTarget] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingAPI.getMyBookings().then((r) => r.data.data),
  });

  const bookings = data?.bookings || [];

  return (
    <div className="min-h-screen pt-20 py-8">
      <div className="page-container max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold font-display text-foreground">My Bookings</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="text-center py-16 rounded-2xl border-dashed">
            <CardContent className="space-y-4">
              <div className="text-5xl">🏨</div>
              <h3 className="text-lg font-bold text-foreground">No bookings yet</h3>
              <p className="text-muted-foreground text-xs">Start exploring hotels and resorts across India.</p>
              <Button variant="gradient" asChild>
                <Link to="/search">Explore Stays</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-5">
                <CardContent className="p-0 space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={booking.room?.property?.thumbnailImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120'}
                      alt=""
                      className="w-20 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-sm line-clamp-1">
                          {booking.room?.property?.name}
                        </h3>
                        <Badge variant={STATUS_BADGES[booking.status] || 'neutral'} className="text-[10px] uppercase">
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary" />
                        {booking.room?.property?.city}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(booking.checkIn), 'dd MMM')} – {format(new Date(booking.checkOut), 'dd MMM yyyy')}
                        </span>
                        <span className="font-bold text-foreground">₹{booking.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-lg">
                      <Link to={`/booking/${booking.id}`}>View Details</Link>
                    </Button>
                    {booking.status === 'COMPLETED' && !booking.review && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReviewTarget(booking)}
                        className="h-8 text-xs rounded-lg gap-1"
                      >
                        <Star className="h-3.5 w-3.5" /> Write Review
                      </Button>
                    )}
                    {['CONFIRMED', 'PAYMENT_PENDING'].includes(booking.status) && (
                      <Button variant="default" size="sm" asChild className="h-8 text-xs rounded-lg">
                        <Link to={`/checkout/${booking.id}`}>Continue Payment</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          open={!!reviewTarget}
          onOpenChange={(op) => !op && setReviewTarget(null)}
        />
      )}
    </div>
  );
}
