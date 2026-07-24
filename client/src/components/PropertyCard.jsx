import { Link } from 'react-router-dom';
import { Star, Heart, Zap, Award } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PropertyCard({ property, showWishlistBtn = true, onHover, isHovered = false }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(property.isWishlisted || false);

  const wishlistMutation = useMutation({
    mutationFn: () => isLiked ? wishlistAPI.remove(property.id) : wishlistAPI.add(property.id),
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isLiked ? 'Removed from wishlist' : 'Saved to wishlist');
    },
    onError: () => toast.error('Failed to update wishlist'),
  });

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Sign in to save properties');
      return;
    }
    wishlistMutation.mutate();
  };

  const lowestPrice = property.lowestPrice || property.rooms?.[0]?.pricePerNight || 2000;
  const avgRating = property.avgRating;
  const reviewCount = property.reviewCount || property._count?.reviews || 12;
  const thumbnail = property.thumbnailImage || property.rooms?.[0]?.images?.[0];
  const isGuestFavourite = avgRating >= 4.7 || property.priceRange === 'LUXURY';

  return (
    <Link
      to={`/properties/${property.id}`}
      onMouseEnter={() => onHover && onHover(property.id)}
      onMouseLeave={() => onHover && onHover(null)}
      className="block group"
    >
      <Card
        className={`overflow-hidden transition-all duration-300 ${
          isHovered
            ? 'ring-2 ring-primary border-primary shadow-xl -translate-y-1'
            : 'hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5'
        }`}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={thumbnail || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75`}
            alt={property.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75';
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {isGuestFavourite && (
              <Badge variant="secondary" className="bg-background/90 text-foreground font-bold backdrop-blur-md shadow-md gap-1">
                <Award className="h-3 w-3 text-amber-500" /> Guest favourite
              </Badge>
            )}
            {property.rooms?.some((r) => r.isInstantBook) && (
              <Badge variant="default" className="gap-1 backdrop-blur-md">
                <Zap className="h-3 w-3" /> Instant Book
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          {showWishlistBtn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleWishlist}
              className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur-md transition-all ${
                isLiked
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="sr-only">Save to wishlist</span>
            </Button>
          )}

          {/* Price Overlay */}
          <div className="absolute bottom-3 right-3">
            {lowestPrice && (
              <div className="bg-background/80 backdrop-blur-md border border-border/60 rounded-lg px-2.5 py-1 text-foreground text-xs font-semibold">
                ₹{lowestPrice.toLocaleString()}
                <span className="font-normal text-muted-foreground">/night</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-1.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
              {property.name}
            </h3>
            <div className="flex items-center gap-1 text-xs shrink-0">
              {avgRating ? (
                <>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-foreground font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviewCount})</span>
                </>
              ) : (
                <span className="text-muted-foreground">New</span>
              )}
            </div>
          </div>

          {/* Location & Guests */}
          <p className="text-muted-foreground text-xs truncate">
            {property.city}, {property.country || 'India'} · Up to{' '}
            {Math.max(...(property.rooms?.map((r) => r.maxOccupancy) || [2]))} guests
          </p>

          {/* Total Price & Cancellation */}
          <div className="pt-1 flex items-center justify-between">
            <div>
              <span className="text-foreground font-bold text-sm">
                ₹{(lowestPrice * 2).toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs ml-1">total (2 nights)</span>
            </div>
            <Badge variant="success" className="text-[10px]">
              Free cancellation
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
