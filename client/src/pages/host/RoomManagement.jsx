import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyAPI } from '../../api';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Save, Upload, Zap } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

function RoomForm({ propertyId, room, open, onOpenChange }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: room?.name || '',
    description: room?.description || '',
    pricePerNight: room?.pricePerNight || '',
    maxOccupancy: room?.maxOccupancy || 2,
    bedConfig: room?.bedConfig || '',
    isInstantBook: room?.isInstantBook || false,
  });
  const [images, setImages] = useState([]);

  const mutation = useMutation({
    mutationFn: () => {
      if (room) return propertyAPI.updateRoom(room.id, form);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));
      return propertyAPI.createRoom(propertyId, fd);
    },
    onSuccess: () => {
      toast.success(room ? 'Room updated!' : 'Room created!');
      qc.invalidateQueries({ queryKey: ['property', propertyId] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Failed to save room'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{room ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          <DialogDescription>Configure room rate, capacity, and bed configuration</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Room Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Deluxe Sea View Suite"
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Room amenities, view, balcony..."
              className="rounded-xl text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Price per Night (₹) *</Label>
              <Input
                type="number"
                value={form.pricePerNight}
                onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Max Occupancy *</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.maxOccupancy}
                onChange={(e) => setForm({ ...form, maxOccupancy: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Bed Configuration</Label>
            <Input
              value={form.bedConfig}
              onChange={(e) => setForm({ ...form, bedConfig: e.target.value })}
              placeholder="e.g. 1 King Bed or 2 Twin Beds"
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label className="text-xs font-semibold">Instant Booking</Label>
              <p className="text-[11px] text-muted-foreground">Allow guests to book without host approval</p>
            </div>
            <Switch
              checked={form.isInstantBook}
              onCheckedChange={(val) => setForm({ ...form, isInstantBook: val })}
            />
          </div>

          {!room && (
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold">Upload Room Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="rounded-xl text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="gradient"
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.pricePerNight || mutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{mutation.isPending ? 'Saving...' : room ? 'Update Room' : 'Add Room'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomManagement() {
  const { propertyId } = useParams();
  const qc = useQueryClient();
  const [editRoom, setEditRoom] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyAPI.getOne(propertyId).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (roomId) => propertyAPI.deleteRoom(roomId),
    onSuccess: () => {
      toast.success('Room deleted');
      qc.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });

  if (isLoading) return <div className="text-muted-foreground text-xs p-6">Loading room specifications...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Rooms — {property?.name}</h1>
          <p className="text-muted-foreground text-xs">{property?.rooms?.length || 0} rooms configured</p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => {
            setEditRoom(null);
            setModalOpen(true);
          }}
          className="rounded-xl gap-2 text-xs"
        >
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      {!property?.rooms?.length ? (
        <Card className="text-center py-16 rounded-2xl border-dashed">
          <CardContent className="space-y-4">
            <div className="text-5xl">🛏</div>
            <h3 className="text-lg font-bold text-foreground">No rooms configured</h3>
            <p className="text-muted-foreground text-xs">Add room types to accept reservations.</p>
            <Button
              variant="gradient"
              onClick={() => {
                setEditRoom(null);
                setModalOpen(true);
              }}
            >
              Add First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {property.rooms.map((room) => (
            <Card key={room.id} className="p-5 overflow-hidden">
              <CardContent className="p-0 space-y-3">
                {room.images?.[0] && (
                  <img src={room.images[0]} alt={room.name} className="w-full h-36 object-cover rounded-xl" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{room.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Up to {room.maxOccupancy} guests · {room.bedConfig || 'Standard Bed'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-foreground">₹{room.pricePerNight?.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground block">/night</span>
                  </div>
                </div>

                {room.isInstantBook && (
                  <Badge variant="default" className="text-[10px] gap-1">
                    <Zap className="h-3 w-3" /> Instant Book
                  </Badge>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditRoom(room);
                      setModalOpen(true);
                    }}
                    className="h-8 text-xs rounded-lg gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(room.id)}
                    className="h-8 text-xs rounded-lg gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoomForm
        propertyId={propertyId}
        room={editRoom}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
