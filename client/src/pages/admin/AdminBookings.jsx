import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { toast } from 'sonner';
import { Search, XCircle, RotateCcw, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_BADGES = {
  CONFIRMED: 'success',
  PAYMENT_PENDING: 'warning',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
  PENDING: 'warning',
};

export default function AdminBookings() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [refundBookingTarget, setRefundBookingTarget] = useState(null);
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminBookings', search, status],
    queryFn: () => adminAPI.getBookings({ search, status: status === 'all' ? '' : status, limit: 50 }).then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => adminAPI.cancelBooking(id),
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      qc.invalidateQueries({ queryKey: ['adminBookings'] });
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Cancellation failed'),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount }) => adminAPI.refundBooking(id, amount),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      qc.invalidateQueries({ queryKey: ['adminBookings'] });
      setRefundBookingTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Refund processing failed'),
  });

  const handleProcessRefund = () => {
    if (!refundBookingTarget) return;
    const amount = parseFloat(refundAmountInput);
    if (isNaN(amount) || amount <= 0 || amount > refundBookingTarget.totalAmount) {
      toast.error('Invalid refund amount');
      return;
    }
    refundMutation.mutate({ id: refundBookingTarget.id, amount });
  };

  const bookings = data?.bookings || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Booking Controls</h1>
        <p className="text-muted-foreground text-xs mt-0.5">{data?.total || 0} total bookings across platform</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest or property..."
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 h-10 text-xs rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Property & Room</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                Loading bookings...
              </TableCell>
            </TableRow>
          ) : bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                No bookings found.
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="text-xs font-semibold text-foreground">{b.guest?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{b.guest?.email}</p>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-foreground">{b.room?.property?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{b.room?.name}</p>
                </TableCell>
                <TableCell className="text-xs">
                  {format(new Date(b.checkIn), 'dd MMM yyyy')} – {format(new Date(b.checkOut), 'dd MMM yyyy')}
                </TableCell>
                <TableCell className="text-xs font-bold">₹{b.totalAmount?.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGES[b.status] || 'neutral'} className="text-[10px]">
                    {b.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      {['CONFIRMED', 'PAYMENT_PENDING'].includes(b.status) && (
                        <DropdownMenuItem
                          onClick={() => cancelMutation.mutate(b.id)}
                          className="cursor-pointer gap-2 text-xs text-destructive"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel Reservation
                        </DropdownMenuItem>
                      )}
                      {b.status === 'CANCELLED' && (
                        <DropdownMenuItem
                          onClick={() => {
                            setRefundBookingTarget(b);
                            setRefundAmountInput(b.totalAmount.toString());
                          }}
                          className="cursor-pointer gap-2 text-xs text-amber-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Process Refund
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Refund Modal */}
      <Dialog open={!!refundBookingTarget} onOpenChange={(op) => !op && setRefundBookingTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Booking Refund</DialogTitle>
            <DialogDescription>
              Enter refund amount for reservation at {refundBookingTarget?.room?.property?.name} (Max: ₹
              {refundBookingTarget?.totalAmount?.toLocaleString()}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              type="number"
              value={refundAmountInput}
              onChange={(e) => setRefundAmountInput(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="Enter refund amount"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundBookingTarget(null)}>Cancel</Button>
            <Button variant="gradient" onClick={handleProcessRefund} disabled={refundMutation.isPending}>
              {refundMutation.isPending ? 'Refunding...' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
