import { useQuery } from '@tanstack/react-query';
import { wishlistAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Wishlist() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistAPI.get().then((r) => r.data.data),
  });

  return (
    <div className="min-h-screen pt-20 py-8">
      <div className="page-container space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Wishlist</h1>
          <p className="text-muted-foreground text-xs">Properties you've saved</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3]" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !items?.length ? (
          <Card className="text-center py-20 rounded-2xl border-dashed max-w-md mx-auto">
            <CardContent className="space-y-4">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">Your wishlist is empty</h3>
              <p className="text-muted-foreground text-xs">Explore stays across India and save your favorite properties.</p>
              <Button variant="gradient" asChild>
                <Link to="/search">Explore Stays</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => (
              <PropertyCard key={item.id} property={{ ...item.property, isWishlisted: true }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
