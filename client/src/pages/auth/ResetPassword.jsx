import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const inputs = useRef([]);
  const email = state?.email || '';

  const mutation = useMutation({
    mutationFn: () => authAPI.resetPassword({ email, otp: otp.join(''), password }),
    onSuccess: () => {
      toast.success('Password reset! Please sign in with your new password.');
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Reset failed'),
  });

  const handleOtp = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
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

        <Card className="p-8 shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-xs mt-1">
              Enter the OTP sent to <span className="text-foreground font-semibold">{email}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {otp.map((d, i) => (
              <Input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleOtp(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
                }}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl border-border"
              />
            ))}
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-xs font-semibold">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPass ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <Button
            variant="gradient"
            onClick={() => mutation.mutate()}
            disabled={otp.join('').length < 6 || !password || mutation.isPending}
            className="w-full h-11 rounded-xl text-xs font-semibold gap-2"
          >
            {mutation.isPending ? 'Resetting...' : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </Card>
      </div>
    </div>
  );
}
