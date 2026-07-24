import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyAPI } from '../api';
import PropertyCard from '../components/PropertyCard';
import PropertyMap from '../components/PropertyMap';
import { Search, MapPin, Calendar as CalendarIcon, Users, SlidersHorizontal, Map as MapIcon, Grid, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const AMENITIES = ['WiFi', 'Pool', 'Gym', 'Spa', 'Parking', 'Restaurant', 'Bar', 'Beach Access'];
const PROPERTY_TYPES = ['hotel', 'resort', 'homestay', 'villa', 'boutique', 'inn'];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

  // Search state
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [dateRange, setDateRange] = useState({
    from: searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')) : null,
    to: searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')) : null,
  });
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests')) || 1);
  const [page, setPage] = useState(1);

  // Filters
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('minPrice')) || 0,
    parseInt(searchParams.get('maxPrice')) || 50000,
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [sortBy, setSortBy] = useState('createdAt');

  const queryParams = {
    city: city || undefined,
    checkIn: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    checkOut: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    guests: guests || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
    propertyType: propertyType || undefined,
    sortBy,
    page,
    limit: showMap ? 16 : 24,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['properties', 'search', queryParams],
    queryFn: () => propertyAPI.search(queryParams).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const { data: allIndiaData } = useQuery({
    queryKey: ['properties', 'all-india-map'],
    queryFn: () => propertyAPI.search({ limit: 300 }).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const properties = data?.properties || [];
  const mapProperties = allIndiaData?.properties?.length ? allIndiaData.properties : properties;
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    const params = {};
    if (city) params.city = city;
    if (dateRange.from) params.checkIn = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange.to) params.checkOut = format(dateRange.to, 'yyyy-MM-dd');
    if (guests) params.guests = guests;
    setSearchParams(params);
  };

  const toggleAmenity = (a) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Search Header Bar */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60 py-3">
        <div className="px-4 md:px-8 max-w-[1600px] mx-auto">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2.5 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-[280px] flex-wrap">
                <div className="relative flex-1 min-w-44">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Destination (e.g. Goa, Mumbai)"
                    className="pl-9 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 text-xs rounded-xl border-border/60 justify-start pl-9 font-normal w-44 truncate"
                      >
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                          ) : (
                            format(dateRange.from, 'MMM d')
                          )
                        ) : (
                          <span className="text-muted-foreground">Select Dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(r) => setDateRange(r || { from: null, to: null })}
                        minDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    className="pl-9 h-10 w-24 text-xs rounded-xl"
                    placeholder="Guests"
                  />
                </div>

                <Button type="submit" size="sm" variant="default" className="h-10 px-4 rounded-xl gap-2 text-xs">
                  <Search className="h-4 w-4" /> Search
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`h-10 px-4 rounded-xl text-xs gap-2 ${filtersOpen ? 'border-primary' : ''}`}
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </div>

              {/* Map Toggle Button */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="h-10 px-4 rounded-xl text-xs gap-2 font-semibold shrink-0"
              >
                {showMap ? <Grid className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                <span>{showMap ? 'Hide map' : 'Show map'}</span>
              </Button>
            </div>

            {/* Filters Collapsible Drawer */}
            {filtersOpen && (
              <Card className="mt-3 p-5 animate-slide-down border-border/80 shadow-xl bg-card/95">
                <CardContent className="p-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Price Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <Label>Price Range (₹/night)</Label>
                        <span className="text-primary font-bold">
                          ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={50000}
                        step={500}
                      />
                    </div>

                    {/* Property type */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Property Type</Label>
                      <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger className="h-10 text-xs rounded-xl">
                          <SelectValue placeholder="All Property Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {PROPERTY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-10 text-xs rounded-xl">
                          <SelectValue placeholder="Sort option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Newest Listings</SelectItem>
                          <SelectItem value="price_asc">Price: Low to High</SelectItem>
                          <SelectItem value="price_desc">Price: High to Low</SelectItem>
                          <SelectItem value="rating">Top Rated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="pt-2">
                    <Label className="text-xs font-semibold mb-2 block">Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map((a) => (
                        <div key={a} className="flex items-center space-x-2">
                          <Checkbox
                            id={`amenity-${a}`}
                            checked={selectedAmenities.includes(a)}
                            onCheckedChange={() => toggleAmenity(a)}
                          />
                          <label
                            htmlFor={`amenity-${a}`}
                            className="text-xs font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            {a}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>

      {/* Main Results Body */}
      <div className="px-4 md:px-8 max-w-[1650px] mx-auto py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display">
              {total > 1000 ? 'Over 1,000' : total} properties {city ? `in ${city}` : 'across India'}
            </h1>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-medium border-emerald-500/30 text-emerald-400">
            <Tag className="h-3.5 w-3.5" /> Prices include taxes & fees
          </Badge>
        </div>

        {/* Split View Container */}
        <div className="flex gap-6 items-start">
          {/* Left Listings Grid */}
          <div className={`transition-all duration-300 ${showMap ? 'w-full lg:w-7/12 xl:w-3/5' : 'w-full'}`}>
            {isLoading ? (
              <div className={`grid gap-5 ${showMap ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3]" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <Card className="text-center py-20 rounded-2xl border-dashed">
                <CardContent className="space-y-4">
                  <div className="text-5xl">🔍</div>
                  <h3 className="text-xl font-bold text-foreground">No properties found</h3>
                  <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                    Try adjusting your search destination, dates, or price range filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCity('');
                      setSearchParams({});
                      setPriceRange([0, 50000]);
                      setPropertyType('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div
                  className={`grid gap-5 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'} ${
                    showMap
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onHover={setHoveredPropertyId}
                      isHovered={hoveredPropertyId === p.id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>

                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={page === pageNum}
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Map View */}
          {showMap && (
            <div className="hidden lg:block lg:w-5/12 xl:w-2/5 h-[calc(100vh-140px)] sticky top-28 transition-all">
              <PropertyMap
                properties={mapProperties}
                activeCity={city}
                hoveredPropertyId={hoveredPropertyId}
                onMarkerHover={setHoveredPropertyId}
                onSelectCity={(selectedCityName) => {
                  setCity(selectedCityName);
                  setPage(1);
                  if (selectedCityName) {
                    setSearchParams({ city: selectedCityName });
                  } else {
                    setSearchParams({});
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
