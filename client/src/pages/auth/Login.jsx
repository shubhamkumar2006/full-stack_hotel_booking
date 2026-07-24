import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Phone, KeyRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loginMethod, setLoginMethod] = useState('email');

  // Email state
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Phone state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email login mutation
  const emailLoginMutation = useMutation({
    mutationFn: () => authAPI.login(form),
    onSuccess: (res) => {
      setAuth(res.data.data);
      toast.success('Welcome back!');
      const role = res.data.data.user.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'HOST') navigate('/host');
      else navigate('/');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Invalid email or password'),
  });

  // Phone OTP request mutation
  const phoneRequestOtpMutation = useMutation({
    mutationFn: () => authAPI.requestPhoneOtp({ phone }),
    onSuccess: () => {
      setOtpSent(true);
      toast.success('OTP sent to your phone!');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to send OTP'),
  });

  // Phone OTP verify mutation
  const phoneVerifyOtpMutation = useMutation({
    mutationFn: () => authAPI.verifyPhoneOtp({ phone, otp }),
    onSuccess: (res) => {
      setAuth(res.data.data);
      toast.success('Welcome back!');
      const role = res.data.data.user.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'HOST') navigate('/host');
      else navigate('/');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Verification failed'),
  });

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) {
      phoneRequestOtpMutation.mutate();
    } else {
      phoneVerifyOtpMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-md">
              🏨
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-display">
              StayNest
            </span>
          </Link>
        </div>

        <Card className="p-8 shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-xs mt-1">Sign in to your account to manage bookings</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); emailLoginMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-9 h-11 text-xs rounded-xl"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-9 pr-9 h-11 text-xs rounded-xl"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              disabled={emailLoginMutation.isPending}
              className="w-full h-11 rounded-xl text-xs font-semibold gap-2"
            >
              {emailLoginMutation.isPending ? 'Signing in...' : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo Logins */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-[11px] text-muted-foreground text-center mb-3 font-semibold">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Guest', email: 'guest@staynest.com', pass: 'Guest@123' },
                { label: 'Host', email: 'host@staynest.com', pass: 'Host@123' },
                { label: 'Admin', email: 'admin@staynest.com', pass: 'Admin@123' },
              ].map(({ label, email, pass }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoginMethod('email');
                    setForm({ email, password: pass });
                  }}
                  className="text-xs h-8 rounded-lg"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
