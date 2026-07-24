import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { toast } from 'sonner';
import { Search, Trash2, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function AdminReviews() {
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminReviews', search],
    queryFn: () => adminAPI.getReviews({ search, limit: 50 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.removeReview(id),
    onSuccess: () => {
      toast.success('Review deleted successfully');
      qc.invalidateQueries({ queryKey: ['adminReviews'] });
      setDeleteTargetId(null);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Delete failed'),
  });

  const reviews = data?.reviews || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Review Moderation</h1>
        <p className="text-muted-foreground text-xs mt-0.5">{data?.total || 0} user reviews submitted</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search review content or property..."
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property / Guest</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Host Reply</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                Loading reviews...
              </TableCell>
            </TableRow>
          ) : reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                No reviews found.
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="text-xs font-semibold text-foreground">{r.property?.name}</p>
                  <p className="text-[11px] text-muted-foreground">by {r.guest?.name}</p>
                </TableCell>
                <TableCell>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted/30'}`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.comment}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {r.hostReply ? (
                    <span className="flex items-center gap-1 text-primary">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      {r.hostReply}
                    </span>
                  ) : (
                    'No reply'
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.createdAt), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTargetId(r.id)}
                    className="h-8 text-xs rounded-lg gap-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(op) => !op && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guest Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The review will be permanently deleted from the property rating calculation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
