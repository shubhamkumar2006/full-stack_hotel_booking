import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyAPI } from '../../api';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, MapPin, MoreHorizontal, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_BADGES = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  SUSPENDED: 'destructive',
};

export default function HostProperties() {
  const qc = useQueryClient();
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hostProperties'],
    queryFn: () => propertyAPI.getHostProperties().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => propertyAPI.delete(id),
    onSuccess: () => {
      toast.success('Property deleted');
      qc.invalidateQueries({ queryKey: ['hostProperties'] });
      setDeleteTargetId(null);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Delete failed'),
  });

  const properties = data?.properties || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">My Properties</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{properties.length} property listings in your account</p>
        </div>
        <Button variant="gradient" size="sm" asChild className="rounded-xl gap-2">
          <Link to="/host/properties/new">
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="text-center py-16 rounded-2xl border-dashed">
          <CardContent className="space-y-4">
            <div className="text-5xl">🏨</div>
            <h3 className="text-lg font-bold text-foreground">No properties listed yet</h3>
            <p className="text-muted-foreground text-xs">Start hosting by adding your first property.</p>
            <Button variant="gradient" asChild>
              <Link to="/host/properties/new">Add First Property</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>City & Type</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={p.thumbnailImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120'}
                      alt={p.name}
                      className="w-12 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-foreground line-clamp-1">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{p.id.substring(0, 8)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-semibold">{p.city}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{p.propertyType}</div>
                </TableCell>
                <TableCell className="text-xs font-semibold">{p.rooms?.length || 0} Rooms</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGES[p.status] || 'neutral'} className="text-[10px]">
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="cursor-pointer gap-2 text-xs">
                        <Link to={`/properties/${p.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View Listing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer gap-2 text-xs">
                        <Link to={`/host/properties/${p.id}/edit`}>
                          <Edit className="h-3.5 w-3.5" /> Edit Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer gap-2 text-xs">
                        <Link to={`/host/properties/${p.id}/rooms`}>
                          <DoorOpen className="h-3.5 w-3.5" /> Manage Rooms
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTargetId(p.id)}
                        className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(op) => !op && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All room records and pricing availability calendars will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
