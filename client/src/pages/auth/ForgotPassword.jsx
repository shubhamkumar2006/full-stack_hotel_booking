import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { toast } from 'sonner';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => authAPI.forgotPassword({ email }),
    onSuccess: () => {
      toast.success('Reset OTP sent to your email!');
      navigate('/reset-password', { state: { email } });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Request failed'),
  });

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

        <Card className="p-8 shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto">
            <KeyRound className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Forgot Password?</h1>
            <p className="text-muted-foreground text-xs mt-1">
              Enter your account email to receive a password reset verification code
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 text-xs rounded-xl"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              disabled={mutation.isPending}
              className="w-full h-11 rounded-xl text-xs font-semibold gap-2"
            >
              {mutation.isPending ? 'Sending OTP...' : <>Send Reset OTP <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              ← Back to Sign In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
