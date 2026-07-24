import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { toast } from 'sonner';
import { Search, Eye, AlertTriangle, ShieldCheck, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  PENDING: 'warning',
};

export default function AdminListings() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [propertyToModerate, setPropertyToModerate] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminProperties', search, status],
    queryFn: () => adminAPI.getProperties({ search, status: status === 'all' ? '' : status, limit: 50 }).then((r) => r.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updatePropertyStatus(id, status),
    onSuccess: () => {
      toast.success('Property status updated successfully');
      qc.invalidateQueries({ queryKey: ['adminProperties'] });
      setPropertyToModerate(null);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Failed to update status'),
  });

  const properties = data?.properties || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Property Moderation</h1>
        <p className="text-muted-foreground text-xs mt-0.5">{data?.total || 0} listed properties across platform</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 h-10 text-xs rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                Loading property listings...
              </TableCell>
            </TableRow>
          ) : properties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                No properties found.
              </TableCell>
            </TableRow>
          ) : (
            properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={p.thumbnailImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80'}
                      alt=""
                      className="w-10 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.rooms?.length || 0} room(s)</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-foreground">{p.host?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.host?.email}</p>
                </TableCell>
                <TableCell className="text-xs capitalize">{p.propertyType}</TableCell>
                <TableCell className="text-xs font-semibold">{p.city}</TableCell>
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
                      <DropdownMenuLabel className="text-xs">Moderation</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="cursor-pointer gap-2 text-xs">
                        <Link to={`/properties/${p.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View Listing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPropertyToModerate(p)}
                        className={`cursor-pointer gap-2 text-xs ${
                          p.status === 'SUSPENDED' ? 'text-emerald-400' : 'text-destructive'
                        }`}
                      >
                        {p.status === 'SUSPENDED' ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Approve & Publish
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5" /> Suspend Listing
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!propertyToModerate} onOpenChange={(op) => !op && setPropertyToModerate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {propertyToModerate?.status === 'SUSPENDED' ? 'Approve & Publish Listing?' : 'Suspend Property Listing?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {propertyToModerate?.status === 'SUSPENDED'
                ? `Publish ${propertyToModerate?.name} back to public search results?`
                : `Suspend ${propertyToModerate?.name}? It will be hidden from search results.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                propertyToModerate &&
                updateStatusMutation.mutate({
                  id: propertyToModerate.id,
                  status: propertyToModerate.status === 'SUSPENDED' ? 'PUBLISHED' : 'SUSPENDED',
                })
              }
              className={propertyToModerate?.status !== 'SUSPENDED' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {propertyToModerate?.status === 'SUSPENDED' ? 'Approve & Publish' : 'Suspend Listing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
