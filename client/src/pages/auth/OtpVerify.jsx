import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { ArrowRight, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OtpVerify() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setAuth } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  const userId = state?.userId;
  const email = state?.email;
  const phone = state?.phone;
  const devOtp = state?.devOtp;

  const mutation = useMutation({
    mutationFn: () => authAPI.verifyOtp({ userId, otp: otp.join(''), purpose: 'signup' }),
    onSuccess: (res) => {
      const authData = res.data?.data;
      if (authData && authData.accessToken) {
        setAuth(authData);
        toast.success('Account verified! Welcome to StayNest.');
        const role = authData.user?.role;
        if (role === 'ADMIN') navigate('/admin');
        else if (role === 'HOST') navigate('/host');
        else navigate('/');
      } else {
        toast.success('Account verified! Please sign in.');
        navigate('/login');
      }
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Verification failed'),
  });

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) setOtp(text.split(''));
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Button variant="gradient" asChild>
          <Link to="/signup">Go to Signup</Link>
        </Button>
      </div>
    );
  }

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

        <Card className="p-8 text-center shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
            <Mail className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Verification Code</h1>
            <p className="text-muted-foreground text-xs mt-1">
              We sent a 6-digit code to <span className="text-foreground font-semibold">{phone ? `${phone} & ${email}` : email}</span>
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
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl border-border"
              />
            ))}
          </div>

          <Button
            variant="gradient"
            onClick={() => mutation.mutate()}
            disabled={otp.join('').length < 6 || mutation.isPending}
            className="w-full h-11 rounded-xl text-xs font-semibold gap-2"
          >
            {mutation.isPending ? 'Verifying...' : <>Verify Account <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <p className="text-xs text-muted-foreground">
            Didn't receive it? Check spam or{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              sign up again
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
