import { useQuery } from '@tanstack/react-query';
import { hostAPI } from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Building2, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function HostEarnings() {
  const { data, isLoading } = useQuery({
    queryKey: ['hostEarnings'],
    queryFn: () => hostAPI.getEarnings({}).then((r) => r.data.data),
  });

  const chartData = data?.byProperty?.map((p) => ({
    name: p.name.substring(0, 12) + (p.name.length > 12 ? '...' : ''),
    earnings: p.total,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Earnings & Revenue</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Financial analytics across all your listed properties</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">₹{(data?.totalEarnings || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Confirmed Bookings</span>
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{data?.totalBookings || 0}</div>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Avg per Booking</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ₹{data?.totalEarnings && data?.totalBookings ? Math.round(data.totalEarnings / data.totalBookings).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base">Earnings by Property</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Breakdown by Property */}
      {data?.byProperty?.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base">Breakdown by Property</h3>
          <div className="space-y-3">
            {data.byProperty.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-xs">
                <div>
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="text-muted-foreground">{p.bookings} booking(s)</p>
                </div>
                <div className="text-primary font-bold">₹{p.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
