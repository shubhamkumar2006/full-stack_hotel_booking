import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Building2, CalendarDays, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalyticsFull'],
    queryFn: () => adminAPI.getAnalytics().then((r) => r.data.data),
  });

  const o = data?.overview || {};

  const stats = [
    { label: 'Total Revenue', value: `₹${(o.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Platform Users', value: o.totalUsers || 0, icon: Users, color: 'text-primary' },
    { label: 'Active Listings', value: o.totalProperties || 0, icon: Building2, color: 'text-amber-400' },
    { label: 'Total Stays Booked', value: o.totalBookings || 0, icon: CalendarDays, color: 'text-violet-400' },
  ];

  const revenueHistory = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 62000 },
    { month: 'Mar', revenue: 58000 },
    { month: 'Apr', revenue: 95000 },
    { month: 'May', revenue: 120000 },
    { month: 'Jun', revenue: o.lastMonthRevenue || 110000 },
    { month: 'Jul', revenue: o.thisMonthRevenue || 135000 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Detailed Analytics</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Deep dive performance indicators and growth trendlines</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-base">Revenue Growth Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-1 space-y-4">
          <h3 className="font-bold text-base">Overview Metrics</h3>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Payment Success Rate</span>
              <span className="font-bold text-foreground">{o.paymentSuccessRate || 0}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">MoM Growth Rate</span>
              <span className={`font-bold ${o.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                {o.revenueGrowth >= 0 ? '+' : ''}{o.revenueGrowth?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">This Month Revenue</span>
              <span className="font-bold text-foreground">₹{(o.thisMonthRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Last Month Revenue</span>
              <span className="font-bold text-foreground">₹{(o.lastMonthRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
