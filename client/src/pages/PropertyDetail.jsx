import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { propertyAPI, bookingAPI } from '../api';
import { MOCK_PROPERTY_DETAILS } from '../lib/mockData';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import {
  MapPin, Star, Users, Calendar as CalendarIcon, Heart, ChevronLeft, ChevronRight, Check,
  Wifi, Car, Dumbbell, UtensilsCrossed, Waves, Navigation, Loader2, Tag, Gift, Percent, Zap, Shield, Sparkles, AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AMENITY_ICONS = { WiFi: Wifi, Parking: Car, Gym: Dumbbell, Restaurant: UtensilsCrossed, Pool: Waves };

const CITY_COORDINATES = {
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Goa': { lat: 15.2993, lng: 74.1240 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Udaipur': { lat: 24.5854, lng: 73.7125 },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [imgIdx, setImgIdx] = useState(0);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const handleDateSelect = (range) => {
    setDateRange(range || { from: null, to: null });
    if (range && range.from && range.to) {
      setCheckInOpen(false);
      setCheckOutOpen(false);
    }
  };
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Pickup service state
  const [includePickup, setIncludePickup] = useState(false);
  const [pickupVehicleCategory, setPickupVehicleCategory] = useState('sedan');
  const [pickupDistanceKm, setPickupDistanceKm] = useState(15);
  const [pickupLocation, setPickupLocation] = useState('Airport / Railway Station');
  const [pickupMode, setPickupMode] = useState('manual');
  const [isLocating, setIsLocating] = useState(false);

  const handleShareLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        setPickupLocation(`Shared Live GPS Location (Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)})`);

        if (property?.geoLat && property?.geoLng) {
          const R = 6371; // Earth radius in km
          const dLat = (property.geoLat - userLat) * Math.PI / 180;
          const dLng = (property.geoLng - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(property.geoLat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = Math.round(R * c);

          setPickupDistanceKm(Math.max(1, distance));
          toast.success(`Live GPS location shared & distance calculated: ${distance} km`);
        } else {
          toast.success(`Live GPS location shared successfully!`);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error(error);
        toast.error('Failed to access location. Please enter pickup details manually.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const VEHICLE_CATEGORIES = [
    { id: 'moto', category: 'Moto', type: 'Motorcycle (1 Seat)', rateStr: '₹8/km', rate: 8 },
    { id: 'auto', category: 'Auto', type: 'Auto-rickshaw (3 Seats)', rateStr: '₹12/km', rate: 12 },
    { id: 'go', category: 'Uber Go', type: 'Hatchback (4 Seats)', rateStr: '₹14/km', rate: 14 },
    { id: 'sedan', category: 'Go Sedan', type: 'Sedan (4 Seats)', rateStr: '₹16/km', rate: 16 },
    { id: 'premier', category: 'Premier', type: 'Premium Sedan/SUV (4 Seats)', rateStr: '₹22/km', rate: 22 },
    { id: 'xl', category: 'Uber XL', type: '6-7 Seater SUV (Innova/Ertiga)', rateStr: '₹28/km', rate: 28 },
  ];

  // Dining state
  const [includeDining, setIncludeDining] = useState(false);
  const [diningPlan, setDiningPlan] = useState('breakfast');

  const DINING_OPTIONS = [
    { id: 'breakfast', name: 'Buffet Breakfast', price: 250, desc: 'Daily gourmet breakfast spread' },
    { id: 'half_board', name: 'Half-Board', price: 650, desc: 'Breakfast + 4-course dinner daily' },
    { id: 'full_board', name: 'Full-Board', price: 1100, desc: 'All 3 meals (Breakfast, Lunch, Dinner)' },
    { id: 'all_inclusive', name: 'All-Inclusive Gourmet', price: 1800, desc: 'All meals + unlimited snacks & beverages' },
  ];

  // Offers state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const AVAILABLE_OFFERS = [
    { code: '10', title: '10% Coupon Discount', type: 'PERCENT', value: 10, maxDiscount: 99999, desc: '10% OFF on your stay' },
    { code: 'COUPON10', title: '10% OFF Special Coupon', type: 'PERCENT', value: 10, maxDiscount: 99999, desc: '10% OFF coupon code' },
    { code: 'WELCOME10', title: '10% OFF Welcome Offer', type: 'PERCENT', value: 10, maxDiscount: 1000, desc: 'Save 10% on your stay (max ₹1,000)' },
    { code: 'STAYFEST15', title: '15% OFF Special Deal', type: 'PERCENT', value: 15, maxDiscount: 2500, desc: 'Get 15% discount on mid-range & luxury stays' },
    { code: 'LUXURY500', title: 'Flat ₹500 Instant Off', type: 'FLAT', value: 500, maxDiscount: 500, desc: 'Flat ₹500 instant discount on total bill' },
  ];

  const handleApplyOffer = (offer) => {
    if (appliedCoupon?.code === offer.code) {
      setAppliedCoupon(null);
      setPromoCodeInput('');
      toast.info('Offer removed');
      return;
    }
    setAppliedCoupon(offer);
    setPromoCodeInput(offer.code);
    toast.success(`🎉 Offer ${offer.code} Applied!`);
  };

  const handleApplyManualCode = () => {
    if (!promoCodeInput.trim()) return;
    const found = AVAILABLE_OFFERS.find(o => o.code.toLowerCase() === promoCodeInput.trim().toLowerCase());
    if (found) {
      handleApplyOffer(found);
    } else {
      toast.error('Invalid promo code. Try 10 or WELCOME10');
    }
  };

  const currentVehicle = VEHICLE_CATEGORIES.find(v => v.id === pickupVehicleCategory) || VEHICLE_CATEGORIES[3];
  const activeDining = DINING_OPTIONS.find(d => d.id === diningPlan) || DINING_OPTIONS[0];

  const checkIn = dateRange.from;
  const checkOut = dateRange.to;
  const nightsCount = checkIn && checkOut ? Math.max(1, differenceInDays(checkOut, checkIn)) : 1;
  const currentPickupFee = includePickup ? pickupDistanceKm * currentVehicle.rate : 0;
  const currentDiningFee = includeDining ? activeDining.price * guests * nightsCount : 0;


  // Query property details
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => {
      if (id && id.startsWith('demo-')) {
        const found = MOCK_PROPERTY_DETAILS[id];
        if (found) return Promise.resolve(found);
        return Promise.reject(new Error('Property not found'));
      }
      return propertyAPI.getById(id).then(r => r.data.data?.property || r.data.data);
    },
  });

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: (payload) => {
      if ((payload.roomId && payload.roomId.startsWith('demo-')) || (id && id.startsWith('demo-'))) {
        const mockBookingId = `demo-booking-${id}-${payload.roomId}`;
        return Promise.resolve({
          data: {
            data: {
              booking: {
                id: mockBookingId,
                ...payload
              }
            }
          }
        });
      }
      return bookingAPI.create(payload);
    },
    onSuccess: (res) => {
      const booking = res.data.data?.booking || res.data.data;
      toast.success('Reservation created! Redirecting to payment...');
      navigate(`/checkout/${booking.id}`);
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Booking failed. Room might be unavailable.';
      toast.error(errorMsg);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 page-container space-y-6">
        <Skeleton className="h-10 w-1/2 rounded-xl" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen pt-24 page-container flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground text-xs mb-6">The property listing you requested does not exist or has been suspended.</p>
          <Button onClick={() => navigate('/search')}>Back to Search</Button>
        </Card>
      </div>
    );
  }

  const images = [];
  if (property.thumbnailImage) {
    images.push(property.thumbnailImage);
  }
  // Always include a parking photo in the gallery
  images.push('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80');

  // Add more default high-quality hotel photos (lobby, pool, restaurant, spa)
  images.push(
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', // Lobby
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80', // Pool
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', // Restaurant
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'  // Spa
  );

  if (property.rooms) {
    property.rooms.forEach(r => {
      let roomImgs = [];
      if (typeof r.images === 'string') {
        try {
          roomImgs = JSON.parse(r.images);
        } catch (e) {
          roomImgs = [];
        }
      } else if (Array.isArray(r.images)) {
        roomImgs = r.images;
      }
      images.push(...roomImgs);
    });
  }
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200');
  }

  const activeRoom = selectedRoom ? property.rooms.find(r => r.id === selectedRoom) : property.rooms?.[0];
  const roomPrice = activeRoom?.pricePerNight || property.lowestPrice || 2000;
  const baseRoomTotal = roomPrice * nightsCount;

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENT') {
      discountAmount = Math.min((baseRoomTotal * appliedCoupon.value) / 100, appliedCoupon.maxDiscount || 99999);
    } else if (appliedCoupon.type === 'FLAT') {
      discountAmount = Math.min(appliedCoupon.value, baseRoomTotal);
    }
  }

  const roomAfterDiscount = Math.max(0, baseRoomTotal - discountAmount);
  const gstRate = 10;
  const gstFee = Math.round(baseRoomTotal * (gstRate / 100));
  const finalTotalAmount = roomAfterDiscount + currentPickupFee + currentDiningFee + gstFee;

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to make a booking');
      navigate('/login');
      return;
    }

    if (!activeRoom) {
      toast.error('Please select a room to reserve');
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    bookingMutation.mutate({
      roomId: activeRoom.id,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guestsCount: guests,
      includePickup,
      pickupVehicleCategory: includePickup ? pickupVehicleCategory : undefined,
      pickupDistanceKm: includePickup ? pickupDistanceKm : undefined,
      pickupFee: currentPickupFee,
      pickupLocation: includePickup ? pickupLocation : undefined,
      includeDining,
      diningPlan: includeDining ? diningPlan : undefined,
      diningFee: currentDiningFee,
      couponCode: appliedCoupon?.code,
      discountAmount,
      gstFee,
      gstRate,
      totalAmount: finalTotalAmount,
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="page-container space-y-8">
        {/* Title & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize text-xs">
                {property.propertyType || 'Resort'}
              </Badge>
              {property.avgRating >= 4.7 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Top Rated
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">{property.name}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              {property.address || `${property.city}, India`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Save
            </Button>
          </div>
        </div>

        {/* Gallery Showcase */}
        <Card className="overflow-hidden border-border/80 shadow-2xl">
          <div className="relative aspect-[16/8] md:aspect-[21/9] bg-muted">
            <img
              src={images[imgIdx]}
              alt={property.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200';
              }}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setImgIdx((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setImgIdx((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Main Content & Reservation Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Detailed Tabs */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start rounded-2xl p-1.5 h-12 bg-muted/50 border">
                <TabsTrigger value="overview" className="rounded-xl px-6 font-semibold text-xs">Overview</TabsTrigger>
                <TabsTrigger value="rooms" className="rounded-xl px-6 font-semibold text-xs">Rooms & Rates</TabsTrigger>
                <TabsTrigger value="addons" className="rounded-xl px-6 font-semibold text-xs">Add-on Services</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl px-6 font-semibold text-xs">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 pt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-3">About this stay</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
                </Card>

                {/* Amenities */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Popular Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(property.amenities || ['WiFi', 'Pool', 'Parking', 'Gym', 'Restaurant']).map((a) => {
                      const Icon = AMENITY_ICONS[a] || Check;
                      return (
                        <div key={a} className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border/50">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold">{a}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* FAQs / Policies */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">House Rules & Policies</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="rules">
                      <AccordionTrigger>House Rules</AccordionTrigger>
                      <AccordionContent>
                        No smoking indoors. Quiet hours between 10:00 PM and 7:00 AM.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="cancellation">
                      <AccordionTrigger>Cancellation Policy</AccordionTrigger>
                      <AccordionContent>
                        Free cancellation up to 48 hours before check-in date. Full refund processed within 3-5 business days.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              </TabsContent>

              {/* Rooms Tab */}
              <TabsContent value="rooms" className="space-y-4 pt-4">
                <RadioGroup value={selectedRoom || property.rooms?.[0]?.id} onValueChange={setSelectedRoom}>
                  <div className="space-y-4">
                    {property.rooms?.map((room) => {
                      const availCount = room.availableCount ?? Math.max(1, 5 - ((room.id?.length || 1) % 3));
                      const isSelected = (selectedRoom || property.rooms?.[0]?.id) === room.id;
                      return (
                        <Card key={room.id} className={`p-5 cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={room.id} id={room.id} className="mt-1" />
                              <div>
                                <Label htmlFor={room.id} className="text-base font-bold cursor-pointer">
                                  {room.name}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">{room.description || 'Spacious room with air conditioning, king bed & scenic balcony views'}</p>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                  {/* Rooms Available Counter Badge */}
                                  <Badge 
                                    className={`text-[11px] font-semibold ${
                                      availCount > 1 
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    }`} 
                                    variant="outline"
                                  >
                                    🟢 {availCount} {availCount === 1 ? 'Room' : 'Rooms'} Available
                                  </Badge>

                                  <Badge variant="outline" className="text-[11px]">
                                    Max {room.maxOccupancy} Guests
                                  </Badge>

                                  {room.isInstantBook && (
                                    <Badge variant="default" className="text-[11px] gap-1">
                                      <Zap className="h-3 w-3" /> Instant Book
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xl font-bold text-foreground">₹{room.pricePerNight.toLocaleString()}</div>
                              <div className="text-[11px] text-muted-foreground">per night</div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </RadioGroup>
              </TabsContent>

              {/* Add-ons Tab */}
              <TabsContent value="addons" className="space-y-6 pt-4">
                {/* Airport Pickup */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base">Airport & Station Pickup</h4>
                      <p className="text-xs text-muted-foreground">Chauffeur-driven cab pick up service to property</p>
                    </div>
                    <Switch checked={includePickup} onCheckedChange={setIncludePickup} />
                  </div>

                  {includePickup && (
                    <div className="pt-4 border-t border-border space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {VEHICLE_CATEGORIES.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => setPickupVehicleCategory(v.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              pickupVehicleCategory === v.id ? 'border-primary bg-primary/10' : 'hover:border-primary/40'
                            }`}
                          >
                            <div className="font-bold text-xs">{v.category}</div>
                            <div className="text-[11px] text-muted-foreground">{v.type}</div>
                            <div className="text-xs font-semibold text-primary mt-1">{v.rateStr}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Meal Plans */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base">Dining & Meal Packages</h4>
                      <p className="text-xs text-muted-foreground">Pre-book meal plans for hassle-free dining</p>
                    </div>
                    <Switch checked={includeDining} onCheckedChange={setIncludeDining} />
                  </div>

                  {includeDining && (
                    <div className="pt-4 border-t border-border space-y-3 animate-fade-in">
                      <RadioGroup value={diningPlan} onValueChange={setDiningPlan}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {DINING_OPTIONS.map((d) => (
                            <Card key={d.id} className={`p-3.5 cursor-pointer ${diningPlan === d.id ? 'border-primary bg-primary/10' : ''}`}>
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value={d.id} id={d.id} />
                                <div>
                                  <Label htmlFor={d.id} className="font-bold text-xs cursor-pointer">{d.name}</Label>
                                  <div className="text-[11px] text-muted-foreground">{d.desc}</div>
                                  <div className="text-xs font-semibold text-primary mt-1">₹{d.price}/guest/day</div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6 pt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Guest Reviews</h3>
                  <div className="space-y-4">
                    {property.reviews?.length ? (
                      property.reviews.map((r) => (
                        <div key={r.id} className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={r.guest?.avatar} />
                                <AvatarFallback className="text-xs font-bold">{r.guest?.name?.[0] || 'G'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-xs font-bold">{r.guest?.name}</div>
                                <div className="text-[10px] text-muted-foreground">{format(new Date(r.createdAt), 'MMM d, yyyy')}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-bold">{r.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No guest reviews submitted yet.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Floating Booking Box */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl p-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-foreground">₹{roomPrice.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground"> / night</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold">{property.avgRating ? property.avgRating.toFixed(1) : 'New'}</span>
                </div>
              </div>

              {/* Live Rooms Availability Banner */}
              {(() => {
                const availCount = activeRoom?.availableCount ?? Math.max(1, 5 - ((activeRoom?.id?.length || 1) % 3));
                return (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-emerald-500/30 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Live Availability Status</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold">
                        🟢 {availCount} {availCount === 1 ? 'Room' : 'Rooms'} Available
                      </Badge>
                    </div>

                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{activeRoom?.name || 'Selected Room'}</span>
                    </div>

                    {checkIn && checkOut ? (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 text-primary shrink-0" />
                        <span>{format(checkIn, 'MMM d')} – {format(checkOut, 'MMM d, yyyy')} ({nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'})</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                        <span>📅 Pick Check-in & Check-out dates below</span>
                      </div>
                    )}

                    {includePickup && (
                      <div className="text-[11px] text-indigo-500 font-medium flex items-center gap-1">
                        <Car className="h-3 w-3 shrink-0" />
                        <span>Pickup: {currentVehicle.category} ({pickupDistanceKm} km)</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Dates & Guest Selector */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-12 rounded-xl text-left font-normal flex flex-col items-start px-3 py-1.5 gap-0.5 border border-border/80">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Check-in</span>
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarIcon className="h-3 w-3 text-primary shrink-0" />
                          <span className="font-semibold text-foreground/90">{dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : 'Select Date'}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        minDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-12 rounded-xl text-left font-normal flex flex-col items-start px-3 py-1.5 gap-0.5 border border-border/80">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Check-out</span>
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarIcon className="h-3 w-3 text-primary shrink-0" />
                          <span className="font-semibold text-foreground/90">{dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select Date'}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        minDate={dateRange.from || new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="number"
                    min={1}
                    max={activeRoom?.maxOccupancy || 10}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Airport Pickup Toggle in Sidebar */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <Car className="h-4 w-4 text-primary" />
                    Add Airport & Station Pickup
                  </Label>
                  <Switch checked={includePickup} onCheckedChange={setIncludePickup} />
                </div>
                {includePickup && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-accent/30 border border-border/50 animate-fade-in mt-1">
                    <div>
                      <Label className="text-[10px] text-muted-foreground font-bold uppercase">Vehicle Category</Label>
                      <Select value={pickupVehicleCategory} onValueChange={setPickupVehicleCategory}>
                        <SelectTrigger className="h-8 text-xs rounded-lg mt-0.5">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_CATEGORIES.map(v => (
                            <SelectItem key={v.id} value={v.id} className="text-xs">
                              {v.category} ({v.type}) - {v.rateStr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-[10px] text-muted-foreground font-bold uppercase">Distance (km)</Label>
                      <div className="flex gap-2 mt-0.5">
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          value={pickupDistanceKm}
                          onChange={(e) => setPickupDistanceKm(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-8 text-xs rounded-lg flex-1"
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="secondary" 
                          disabled={isLocating}
                          onClick={handleShareLiveLocation}
                          className="h-8 text-[10px] rounded-lg px-2 flex items-center gap-1 font-semibold shrink-0"
                        >
                          {isLocating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Navigation className="h-3 w-3 text-primary" />
                          )}
                          Use GPS
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground font-bold uppercase">Pickup Location</Label>
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Switch
                            id="share-live-location"
                            checked={pickupLocation.startsWith('Shared Live GPS Location')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleShareLiveLocation();
                              } else {
                                setPickupLocation('Airport / Railway Station');
                              }
                            }}
                          />
                          <Label htmlFor="share-live-location" className="text-[10px] font-semibold cursor-pointer text-primary flex items-center gap-1">
                            <Navigation className="h-2.5 w-2.5" />
                            Share Live Location (GPS)
                          </Label>
                        </div>
                        
                        {!pickupLocation.startsWith('Shared Live GPS Location') ? (
                          <Input
                            placeholder="e.g. Terminal 2, Mumbai Airport"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            className="h-8 text-xs rounded-lg"
                          />
                        ) : (
                          <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg font-medium">
                            📍 {pickupLocation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon Discount Section */}
              <div className="pt-3 border-t border-border space-y-2">
                <Label className="text-xs font-semibold">Have a coupon code?</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code (WELCOME10)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="h-9 text-xs rounded-xl uppercase"
                  />
                  <Button size="sm" variant="secondary" onClick={handleApplyManualCode} className="h-9 rounded-xl text-xs">
                    Apply
                  </Button>
                </div>
                
                {/* Visual list of coupons */}
                <div className="pt-1 space-y-1">
                  <div className="text-[10px] font-medium text-muted-foreground">Available Coupons:</div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {AVAILABLE_OFFERS.map((offer) => {
                      const isApplied = appliedCoupon?.code === offer.code;
                      return (
                        <div
                          key={offer.code}
                          onClick={() => handleApplyOffer(offer)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center gap-2 ${
                            isApplied 
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'hover:border-primary/40 bg-accent/20 border-border/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[9px] tracking-wider uppercase bg-background px-1.5 py-0.5 rounded border border-border/80 text-foreground">
                                {offer.code}
                              </span>
                              <span className="font-semibold text-[10px] truncate">
                                {offer.title}
                              </span>
                            </div>
                            <div className="text-[9px] text-muted-foreground truncate mt-0.5">
                              {offer.desc}
                            </div>
                          </div>
                          <Badge variant={isApplied ? 'default' : 'outline'} className="text-[9px] py-0.5 px-1.5 shrink-0">
                            {isApplied ? 'Applied' : 'Apply'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">₹{roomPrice.toLocaleString()} × {nightsCount} night(s)</span>
                  <span className="font-semibold">₹{baseRoomTotal.toLocaleString()}</span>
                </div>

                {includePickup && (
                  <div className="flex justify-between text-indigo-400">
                    <span>Pickup ({currentVehicle.category} - {pickupDistanceKm}km)</span>
                    <span className="font-semibold">+₹{currentPickupFee.toLocaleString()}</span>
                  </div>
                )}

                {includeDining && (
                  <div className="flex justify-between text-purple-400">
                    <span>Dining ({activeDining.name})</span>
                    <span className="font-semibold">+₹{currentDiningFee.toLocaleString()}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>GST Tax & Service Fee ({gstRate}%)</span>
                  <span className="font-semibold">₹{gstFee.toLocaleString()}</span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{finalTotalAmount.toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="gradient"
                size="lg"
                onClick={handleBooking}
                disabled={bookingMutation.isPending}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-xl"
              >
                {bookingMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Reservation...</span>
                  </div>
                ) : (
                  <span>Reserve Now</span>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
