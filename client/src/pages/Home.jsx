import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyAPI } from '../api';
import PropertyCard from '../components/PropertyCard';
import { Search, MapPin, Calendar as CalendarIcon, Users, Star, Shield, Zap, ArrowRight, ChevronRight, Heart, TrendingUp, Award } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CITIES = [
  { name: 'Goa', tag: 'Beach Paradise', img: 'photo-1506905925346-21bda4d32df4' },
  { name: 'Mumbai', tag: 'City of Dreams', img: 'photo-1595658658481-d53d3f999875' },
  { name: 'Jaipur', tag: 'Pink City', img: 'photo-1524613032530-449a5d94c285' },
  { name: 'Udaipur', tag: 'Lake City', img: 'photo-1590766740534-f21c28994bae' },
  { name: 'Kerala', tag: "God's Own Country", img: 'photo-1602216056096-3b40cc0c9944' },
  { name: 'Bangalore', tag: 'Silicon Valley', img: 'photo-1596176530529-78163a4f7af2' },
  { name: 'Delhi', tag: 'Capital Pride', img: 'photo-1587474260584-136574528ed5' },
  { name: 'Manali', tag: 'Mountain Escape', img: 'photo-1558618666-fcd25c85cd64' },
];

const DEMO_PROPERTIES = [
  {
    id: 'demo-1', name: 'The Oberoi Udaivilas',
    city: 'Udaipur', country: 'India',
    avgRating: 4.9, reviewCount: 312, lowestPrice: 28000,
    thumbnailImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=75&fit=crop',
    rooms: [{ maxOccupancy: 4, isInstantBook: true }],
  },
  {
    id: 'demo-2', name: 'Taj Lake Palace',
    city: 'Udaipur', country: 'India',
    avgRating: 4.8, reviewCount: 487, lowestPrice: 35000,
    thumbnailImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75&fit=crop',
    rooms: [{ maxOccupancy: 2, isInstantBook: false }],
  },
  {
    id: 'demo-3', name: 'Amari Goa Resort',
    city: 'Goa', country: 'India',
    avgRating: 4.7, reviewCount: 218, lowestPrice: 9500,
    thumbnailImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=75&fit=crop',
    rooms: [{ maxOccupancy: 3, isInstantBook: true }],
  },
  {
    id: 'demo-4', name: 'The Leela Palace Jaipur',
    city: 'Jaipur', country: 'India',
    avgRating: 4.8, reviewCount: 156, lowestPrice: 18500,
    thumbnailImage: 'https://images.unsplash.com/photo-1551882547-ff40c4a49f5e?w=600&q=75&fit=crop',
    rooms: [{ maxOccupancy: 2, isInstantBook: true }],
  },
  {
    id: 'demo-5', name: 'Kumarakom Lake Resort',
    city: 'Kerala', country: 'India',
    avgRating: 4.9, reviewCount: 89, lowestPrice: 12000,
    thumbnailImage: 'https://images.unsplash.com/photo-1544550581-1bcabf842b77?w=600&q=75&fit=crop',
    rooms: [{ maxOccupancy: 2, isInstantBook: false }],
  },
  {
    id: 'demo-6', name: 'ITC Grand Bharat Manesar',
    city: 'Delhi', country: 'India',
    avgRating: 4.6, reviewCount: 204, lowestPrice: 22000,
    thumbnailImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=75&fit=crop',
    rooms: [{ maxOccupancy: 4, isInstantBook: true }],
  },
];

const FEATURES = [
  { icon: Shield, title: 'Verified Stays', desc: 'Every property personally reviewed and quality-certified by our travel experts.', iconClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  { icon: Zap, title: 'Instant Booking', desc: 'Skip the wait — receive your booking confirmation in seconds.', iconClass: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400' },
  { icon: Heart, title: 'Best Price Guarantee', desc: "Find it cheaper elsewhere? We'll match it — no questions asked.", iconClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
];

const STATS = [
  { value: '500+', label: 'Curated Properties', icon: Award },
  { value: '50K+', label: 'Happy Guests', icon: Heart },
  { value: '100+', label: 'Cities', icon: MapPin },
  { value: '4.9★', label: 'Avg Rating', icon: Star },
];

export default function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [guests, setGuests] = useState(2);

  const { data: featuredProps } = useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertyAPI.search({ limit: 6, sortBy: 'rating' }).then((r) => r.data.data.properties),
    retry: 0,
  });

  const displayProps = featuredProps?.length ? featuredProps : DEMO_PROPERTIES;

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (dateRange.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    if (guests) params.set('guests', guests);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-gradient relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
        <div className="page-container relative z-10 py-20 w-full">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <Badge
              variant="outline"
              className="px-4 py-1.5 rounded-full border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold mb-8 gap-2 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
            >
              <Zap className="h-3.5 w-3.5" />
              India&apos;s #1 Luxury Stay Platform
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 font-display leading-tight tracking-tight">
              Find Your{' '}
              <span className="gradient-text">Perfect Stay</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              From palace hotels to secluded beach villas — curate your dream
              getaway and book with instant confirmation.
            </p>

            {/* Search Form */}
            <Card className="p-3 max-w-4xl mx-auto shadow-warm bg-white/90 dark:bg-card/90 backdrop-blur-xl border-amber-100 dark:border-border rounded-3xl">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="relative">
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-transparent text-left pl-10">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <SelectValue placeholder="Where to?" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-12 w-full justify-start rounded-2xl border-border/60 bg-transparent text-left font-normal pl-10 text-xs truncate"
                      >
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                        {dateRange.from ? (
                          dateRange.to
                            ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                            : format(dateRange.from, 'MMM d, yyyy')
                        ) : (
                          <span className="text-muted-foreground">Check-in / Check-out</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range || { from: null, to: null })}
                        minDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2 md:col-span-2">
                  <div className="relative flex-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      type="number" min={1} max={20}
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                      className="pl-10 h-12 rounded-2xl border-border/60 bg-transparent"
                      placeholder="Guests"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-6 rounded-2xl gap-2 text-sm font-semibold text-white border-0"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16 animate-slide-up">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold gradient-text font-display">{value}</div>
                <div className="text-muted-foreground text-xs mt-1 flex items-center justify-center gap-1">
                  <Icon className="h-3 w-3" /> {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground text-xs animate-float">
          <span>Scroll to explore</span>
          <ChevronRight className="h-4 w-4 rotate-90" />
        </div>
      </section>

      {/* ── CITY CARDS ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container">
          <div className="mb-10">
            <h2 className="section-heading">Explore Destinations</h2>
            <p className="section-subheading">Hand-picked cities for unforgettable getaways</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CITIES.map((c) => (
              <div
                key={c.name}
                onClick={() => navigate(`/search?city=${c.name}`)}
                className="group relative overflow-hidden rounded-2xl aspect-[3/2] cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={`https://images.unsplash.com/${c.img}?w=400&q=70&fit=crop`}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-white font-bold text-sm font-display">{c.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">{c.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED STAYS ───────────────────────────────────── */}
      <section className="py-24 bg-muted/40">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Featured Stays</h2>
              <p className="section-subheading">Top-rated properties loved by guests</p>
            </div>
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate('/search')}
              className="gap-1 text-xs text-primary hover:text-primary"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProps.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY STAYNEST ─────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-heading">Why StayNest?</h2>
            <p className="section-subheading">Everything you need for a perfect trip</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, iconClass }) => (
              <Card
                key={title}
                className="p-8 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border-border/60"
              >
                <CardContent className="p-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-foreground font-bold mb-2 font-display text-lg">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOST CTA ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container">
          <div
            className="relative overflow-hidden p-12 text-center rounded-3xl"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/10 pointer-events-none" />
            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5" /> Join 10,000+ hosts
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                List Your Property on StayNest
              </h2>
              <p className="text-white/80 text-sm">
                Earn income by sharing your space with travellers. Setup takes under 15 minutes.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="gap-2 mt-4 px-8 rounded-2xl bg-white text-amber-700 hover:bg-amber-50 font-semibold border-0"
              >
                <span>Become a Host</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
