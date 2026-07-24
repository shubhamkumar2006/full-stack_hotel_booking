import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { propertyAPI } from '../../api';
import { toast } from 'sonner';
import { Save, Upload, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AMENITIES_LIST = ['WiFi', 'Pool', 'Gym', 'Spa', 'Parking', 'Restaurant', 'Bar', 'Beach Access', 'Room Service', 'Concierge', 'Business Center', 'Pet Friendly', 'Kitchen', 'Laundry', 'Air Conditioning'];
const PROPERTY_TYPES = ['hotel', 'resort', 'homestay', 'villa', 'boutique', 'inn', 'hostel'];

export default function AddEditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', description: '', address: '', city: '', state: '', country: 'India',
    geoLat: '', geoLng: '', propertyType: 'hotel', cancellationPolicy: 'FREE',
    houseRules: '', amenities: [], status: 'DRAFT',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyAPI.getOne(id).then(r => r.data.data),
    enabled: isEdit,
    onSuccess: (data) => {
      setForm({
        name: data.name, description: data.description, address: data.address,
        city: data.city, state: data.state || '', country: data.country, geoLat: data.geoLat || '',
        geoLng: data.geoLng || '', propertyType: data.propertyType, cancellationPolicy: data.cancellationPolicy,
        houseRules: data.houseRules || '', amenities: data.amenities || [], status: data.status,
      });
      if (data.thumbnailImage) setImagePreview(data.thumbnailImage);
    },
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) return propertyAPI.update(id, form);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'amenities') fd.append(k, JSON.stringify(v));
        else if (v !== undefined && v !== '') fd.append(k, v);
      });
      if (image) fd.append('images', image);
      return propertyAPI.create(fd);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Property updated!' : 'Property created!');
      navigate('/host/properties');
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Save failed'),
  });

  const toggleAmenity = (a) => {
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-xl">
            <Link to="/host/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
            <p className="text-muted-foreground text-xs">Fill out the property specifications below</p>
          </div>
        </div>

        <Button variant="gradient" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2 rounded-xl">
          <Save className="h-4 w-4" />
          <span>{mutation.isPending ? 'Saving...' : 'Save Property'}</span>
        </Button>
      </div>

      {/* Main Form Cards */}
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold">Property Title / Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Grand Heritage Palace & Spa"
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold">Full Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, Landmark"
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">City</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Goa, Udaipur"
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Property Type</Label>
            <Select value={form.propertyType} onValueChange={(val) => setForm({ ...form, propertyType: val })}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold">Property Overview / Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe the ambiance, view, location benefits..."
              className="rounded-xl text-xs resize-none"
            />
          </div>
        </div>

        {/* Thumbnail Dropzone */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Property Cover Image</Label>
          {imagePreview ? (
            <div className="relative aspect-[16/7] rounded-2xl overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-3 right-3 h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs font-semibold">Click to upload thumbnail</span>
              <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* Amenities Selection */}
        <div className="space-y-3 pt-2">
          <Label className="text-xs font-semibold">Select Amenities Offered</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AMENITIES_LIST.map((a) => (
              <div key={a} className="flex items-center space-x-2 p-2.5 rounded-xl border border-border/50 bg-accent/20">
                <Checkbox
                  id={`am-${a}`}
                  checked={form.amenities.includes(a)}
                  onCheckedChange={() => toggleAmenity(a)}
                />
                <label htmlFor={`am-${a}`} className="text-xs font-medium cursor-pointer">
                  {a}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Status Selection */}
        <div className="pt-2 flex items-center gap-4">
          <Label className="text-xs font-semibold">Listing Status:</Label>
          <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
            <SelectTrigger className="w-40 h-9 text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">DRAFT</SelectItem>
              <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}
