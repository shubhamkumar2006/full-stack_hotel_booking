import { useQuery } from '@tanstack/react-query';
import { hostAPI, propertyAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Building2, CalendarDays, TrendingUp, Star, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HostDashboard() {
  const { user } = useAuthStore();
  const { data: properties } = useQuery({ queryKey: ['hostProperties'], queryFn: () => propertyAPI.getHostProperties().then((r) => r.data.data) });
  const { data: bookings } = useQuery({ queryKey: ['hostBookings'], queryFn: () => hostAPI.getBookings({ limit: 5 }).then((r) => r.data.data) });
  const { data: earnings } = useQuery({ queryKey: ['hostEarnings'], queryFn: () => hostAPI.getEarnings({}).then((r) => r.data.data) });

  const stats = [
    { label: 'Total Properties', value: properties?.total || 0, icon: Building2, color: 'text-primary' },
    { label: 'Total Bookings', value: bookings?.total || 0, icon: CalendarDays, color: 'text-emerald-400' },
    { label: 'Total Revenue', value: `₹${(earnings?.totalEarnings || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Published Stays', value: properties?.properties?.filter((p) => p.status === 'PUBLISHED').length || 0, icon: Star, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">Here is a quick overview of your host properties and bookings.</p>
        </div>
        <Button variant="gradient" size="sm" asChild className="rounded-xl gap-2">
          <Link to="/host/properties/new">
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className="p-2 rounded-xl bg-accent">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold font-display text-foreground">{value}</div>
          </Card>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Recent Guest Bookings</h3>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link to="/host/bookings">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Property / Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!bookings?.bookings?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No bookings received yet.
                </TableCell>
              </TableRow>
            ) : (
              bookings.bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-semibold text-xs">{b.guest?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {b.room?.property?.name} · <span className="text-foreground font-medium">{b.room?.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'warning'} className="text-[10px]">
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs">₹{b.totalAmount?.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/host/properties/new', label: 'Add Property', emoji: '🏨', desc: 'List a new hotel or resort' },
          { to: '/host/bookings', label: 'View Bookings', emoji: '📅', desc: 'Manage reservations & requests' },
          { to: '/host/earnings', label: 'Earnings Report', emoji: '💰', desc: 'Track your revenue & payouts' },
        ].map(({ to, label, emoji, desc }) => (
          <Link key={to} to={to} className="block group">
            <Card className="p-5 hover:border-primary/50 transition-all">
              <CardContent className="p-0">
                <div className="text-3xl mb-2">{emoji}</div>
                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
