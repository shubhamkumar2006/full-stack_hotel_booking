import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { toast } from 'sonner';
import { Search, UserCheck, UserX, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [userToToggle, setUserToToggle] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, role],
    queryFn: () => adminAPI.getUsers({ search, role: role === 'all' ? '' : role, limit: 50 }).then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.toggleUserStatus(id, !isActive),
    onSuccess: () => {
      toast.success('User status updated successfully');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      setUserToToggle(null);
    },
    onError: (e) => toast.error(e.response?.data?.error?.message || 'Failed to update user status'),
  });

  const users = data?.users || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">User Governance</h1>
        <p className="text-muted-foreground text-xs mt-0.5">{data?.total || 0} registered user accounts</p>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>

        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-36 h-10 text-xs rounded-xl">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="GUEST">Guest</SelectItem>
            <SelectItem value="HOST">Host</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                Loading user accounts...
              </TableCell>
            </TableRow>
          ) : users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                      {u.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={u.role === 'ADMIN' ? 'default' : u.role === 'HOST' ? 'warning' : 'neutral'} className="text-[10px]">
                  {u.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={u.isActive ? 'success' : 'destructive'} className="text-[10px]">
                  {u.isActive ? 'Active' : 'Banned'}
                </Badge>
              </TableCell>
              <TableCell>
                {u.isVerified ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">User Governance</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setUserToToggle(u)}
                      className={`cursor-pointer gap-2 text-xs ${u.isActive ? 'text-destructive' : 'text-emerald-400'}`}
                    >
                      {u.isActive ? (
                        <>
                          <UserX className="h-3.5 w-3.5" /> Suspend / Ban User
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" /> Activate User
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!userToToggle} onOpenChange={(op) => !op && setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.isActive ? 'Suspend User Account?' : 'Reactivate User Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.isActive
                ? `Are you sure you want to ban ${userToToggle?.name}? They will be logged out and unable to access StayNest.`
                : `Reactivate account for ${userToToggle?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToToggle && toggleMutation.mutate({ id: userToToggle.id, isActive: userToToggle.isActive })}
              className={userToToggle?.isActive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {userToToggle?.isActive ? 'Ban Account' : 'Activate Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
