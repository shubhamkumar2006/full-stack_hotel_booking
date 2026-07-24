import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Building2, CalendarDays, TrendingUp, DollarSign, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => adminAPI.getAnalytics().then((r) => r.data.data),
  });

  const o = data?.overview || {};

  const statCards = [
    { label: 'Total Users', value: o.totalUsers || 0, icon: Users, color: 'text-primary' },
    { label: 'Total Properties', value: o.totalProperties || 0, icon: Building2, color: 'text-emerald-400' },
    { label: 'Total Bookings', value: o.totalBookings || 0, icon: CalendarDays, color: 'text-amber-400' },
    { label: 'Total Revenue', value: `₹${(o.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-rose-400' },
    { label: 'This Month Revenue', value: `₹${(o.thisMonthRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-cyan-400' },
    { label: 'Payment Success Rate', value: `${o.paymentSuccessRate || 0}%`, icon: Star, color: 'text-violet-400' },
  ];

  const bookingsPieData =
    data?.bookingsByStatus?.map((b) => ({
      name: b.status.replace('_', ' '),
      value: b._count.status,
    })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Platform metrics, user governance & property status</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <CardContent className="p-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                <div className="p-2 rounded-xl bg-accent">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold font-display text-foreground">{isLoading ? '—' : value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MoM Revenue Banner */}
      {o.revenueGrowth !== undefined && (
        <Card className={`p-4 border ${o.revenueGrowth >= 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}>
          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
            <span>{o.revenueGrowth >= 0 ? '📈' : '📉'}</span>
            <span>
              Month-over-month revenue growth: {o.revenueGrowth >= 0 ? '+' : ''}{o.revenueGrowth.toFixed(1)}%
            </span>
            <span className="text-muted-foreground font-normal">
              (₹{(o.thisMonthRevenue || 0).toLocaleString()} this month vs ₹{(o.lastMonthRevenue || 0).toLocaleString()} last month)
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Pie Chart */}
        {bookingsPieData.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base">Bookings by Status</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingsPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {bookingsPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '12px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Top Properties */}
        {data?.topProperties?.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base">Top Performing Properties</h3>
            <div className="space-y-3">
              {data.topProperties.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  {p.thumbnailImage && <img src={p.thumbnailImage} alt="" className="w-10 h-8 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Recent Platform Bookings */}
      {data?.recentBookings?.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base">Recent Platform Bookings</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-semibold">{b.guest?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.room?.property?.name}</TableCell>
                  <TableCell className="text-xs font-bold">₹{b.payment?.amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'neutral'} className="text-[10px]">
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
