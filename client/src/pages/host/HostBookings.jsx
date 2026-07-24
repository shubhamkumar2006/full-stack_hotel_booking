import { useQuery } from '@tanstack/react-query';
import { hostAPI } from '../../api';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_BADGES = {
  CONFIRMED: 'success',
  PAYMENT_PENDING: 'warning',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  PENDING: 'warning',
};

export default function HostBookings() {
  const { data, isLoading } = useQuery({
    queryKey: ['hostBookings', 'all'],
    queryFn: () => hostAPI.getBookings({ limit: 50 }).then((r) => r.data.data),
  });

  const bookings = data?.bookings || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Guest Reservations</h1>
        <p className="text-muted-foreground text-xs">{data?.total || 0} total booking records</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : !bookings.length ? (
        <Card className="text-center py-16 rounded-2xl border-dashed">
          <CardContent>
            <p className="text-muted-foreground text-xs">No bookings recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Property & Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="text-center">Guests</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={b.guest?.avatar} alt={b.guest?.name} />
                      <AvatarFallback className="text-[10px] font-bold">
                        {b.guest?.name?.[0] || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{b.guest?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.guest?.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-foreground">{b.room?.property?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{b.room?.name}</p>
                </TableCell>
                <TableCell className="text-xs">{format(new Date(b.checkIn), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-xs">{format(new Date(b.checkOut), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-xs text-center font-semibold">{b.guestsCount}</TableCell>
                <TableCell className="text-right text-xs font-bold">₹{b.totalAmount?.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={STATUS_BADGES[b.status] || 'neutral'} className="text-[10px] uppercase">
                    {b.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
