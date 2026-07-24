import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Twitter, Instagram, Facebook, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-md mt-20">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-md">
                🏨
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-display">
                StayNest
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Find and book unique stays at hotels, resorts, and boutique properties. Your perfect stay is just a click away.
            </p>
            <div className="flex gap-2">
              {[Twitter, Instagram, Facebook, Github].map((Icon, i) => (
                <Button key={i} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/60">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold mb-4 text-sm text-foreground">Explore</h3>
            <ul className="space-y-2.5">
              {['Search Properties', 'Top Destinations', 'Weekend Getaways', 'Luxury Stays', 'Budget Stays'].map(item => (
                <li key={item}>
                  <Link to="/search" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Hosts */}
          <div>
            <h3 className="font-semibold mb-4 text-sm text-foreground">For Hosts</h3>
            <ul className="space-y-2.5">
              {['List Your Property', 'Host Dashboard', 'Pricing & Fees', 'Host Resources', 'Become a Host'].map(item => (
                <li key={item}>
                  <Link to="/host" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-sm text-foreground">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                support@staynest.com
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                +91 (800) STAY-NEST
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} StayNest Platform. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-muted-foreground text-xs hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-muted-foreground text-xs hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="#" className="text-muted-foreground text-xs hover:text-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
