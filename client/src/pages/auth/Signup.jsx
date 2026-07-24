import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Signup() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'GUEST' });
  const [showPass, setShowPass] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authAPI.signup(form),
    onSuccess: (res) => {
      const authData = res.data?.data;
      if (authData && authData.accessToken) {
        setAuth(authData);
        toast.success('Account created successfully! Welcome to StayNest.');
        const role = authData.user?.role;
        if (role === 'ADMIN') navigate('/admin');
        else if (role === 'HOST') navigate('/host');
        else navigate('/');
      } else {
        toast.success('Account created! Please sign in.');
        navigate('/login');
      }
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Signup failed'),
  });

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md animate-scale-in space-y-6">
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
            <h1 className="text-2xl font-bold text-foreground">Create account</h1>
            <p className="text-muted-foreground text-xs mt-1">Join thousands of guests & hosts on StayNest</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  required
                  value={form.name}
                  onChange={f('name')}
                  className="pl-9 h-11 text-xs rounded-xl"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={f('email')}
                  className="pl-9 h-11 text-xs rounded-xl"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mobile Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={f('phone')}
                  className="pl-9 h-11 text-xs rounded-xl"
                  placeholder="+919876543210"
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
                  minLength={8}
                  value={form.password}
                  onChange={f('password')}
                  className="pl-9 pr-9 h-11 text-xs rounded-xl"
                  placeholder="Min 8 characters"
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

            {/* Role Selection Buttons */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold">Account Purpose</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'GUEST', label: 'Book Stays', icon: '🌍' },
                  { value: 'HOST', label: 'List Property', icon: '🏨' },
                ].map(({ value, label, icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={form.role === value ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, role: value })}
                    className="h-14 flex-col justify-center rounded-xl text-xs gap-0.5"
                  >
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              disabled={mutation.isPending}
              className="w-full h-11 rounded-xl text-xs font-semibold gap-2 mt-2"
            >
              {mutation.isPending ? 'Creating Account...' : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
