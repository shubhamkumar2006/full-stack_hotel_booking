import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { userAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { User, Phone, Save, Camera, ShieldCheck, Lock, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    hostBio: user?.hostBio || '',
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userAPI.getMe().then((r) => r.data.data),
    onSuccess: (d) => setForm({ name: d.name, phone: d.phone || '', hostBio: d.hostBio || '' }),
  });

  const updateMutation = useMutation({
    mutationFn: () => userAPI.updateMe(form),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Update failed'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return userAPI.uploadAvatar(fd);
    },
    onSuccess: (res) => {
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Avatar updated!');
    },
  });

  return (
    <div className="min-h-screen pt-20 py-8">
      <div className="page-container max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Account Settings</h1>
          <p className="text-muted-foreground text-xs">Manage your profile, preferences and security settings</p>
        </div>

        {/* User Card */}
        <Card className="p-6 flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-primary/40">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])}
              />
            </label>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
            <div className="pt-1">
              {user?.isVerified ? (
                <Badge variant="success" className="text-[10px] gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified Account
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        {profile?._count && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Bookings', val: profile._count.bookings },
              { label: 'Properties', val: profile._count.properties },
              { label: 'Wishlist', val: profile._count.wishlists },
            ].map(({ label, val }) => (
              <Card key={label} className="p-4 text-center">
                <div className="text-2xl font-bold text-primary font-display">{val}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs for Settings */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg text-xs gap-1.5">
              <User className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg text-xs gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg text-xs gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="pt-4">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Phone Number</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                  placeholder="+91 (987) 654-3210"
                />
              </div>

              {user?.role === 'HOST' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Host Bio</label>
                  <Textarea
                    value={form.hostBio}
                    onChange={(e) => setForm({ ...form, hostBio: e.target.value })}
                    rows={3}
                    placeholder="Tell guests about your properties and hospitality..."
                    className="rounded-xl text-xs resize-none"
                  />
                </div>
              )}

              <Button
                variant="gradient"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="gap-2 rounded-xl text-xs h-10 px-6"
              >
                <Save className="h-4 w-4" />
                <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="pt-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm">Account Security</h3>
              <p className="text-xs text-muted-foreground">Your account uses dual JWT HTTP-only cookies and mobile OTP authentication.</p>
              <Button variant="outline" size="sm" className="text-xs rounded-xl">Change Password</Button>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="pt-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm">Notification Preferences</h3>
              <p className="text-xs text-muted-foreground">Receive real-time reservation updates via SMS and Email.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
