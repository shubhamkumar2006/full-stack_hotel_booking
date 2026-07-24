import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api';
import { toast } from 'sonner';
import {
  LayoutDashboard, Building2, CalendarDays, TrendingUp, Users,
  Star, LogOut, ChevronRight, Bell, Menu, Home, Shield
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const hostNav = [
  { to: '/host',            label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/host/properties', label: 'Properties',  icon: Building2 },
  { to: '/host/bookings',   label: 'Bookings',    icon: CalendarDays },
  { to: '/host/earnings',   label: 'Earnings',    icon: TrendingUp },
];

const adminNav = [
  { to: '/admin',           label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/admin/users',     label: 'Users',       icon: Users },
  { to: '/admin/listings',  label: 'Listings',    icon: Building2 },
  { to: '/admin/bookings',  label: 'Bookings',    icon: CalendarDays },
  { to: '/admin/analytics', label: 'Analytics',   icon: TrendingUp },
  { to: '/admin/reviews',   label: 'Reviews',     icon: Star },
];

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = role === 'admin' ? adminNav : hostNav;
  const brandLabel = role === 'admin' ? 'Admin Portal' : 'Host Portal';

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const url = `/${segments.slice(0, index + 1).join('/')}`;
      const isLast = index === segments.length - 1;
      const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { url, label: formatted, isLast };
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/70 backdrop-blur-xl border-r border-border w-64">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-tr from-amber-500 to-orange-500 shadow-md">
            🏨
          </div>
          <div>
            <div className="font-bold text-foreground text-sm tracking-tight flex items-center gap-1">
              StayNest
            </div>
            <div className="text-xs font-semibold text-primary">{brandLabel}</div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSheetOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />
          </NavLink>
        ))}
      </nav>

      {/* Footer User */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-border/60 rounded-xl h-9 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Mobile Sheet Trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r border-border">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb Navigation */}
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {getBreadcrumbs().map((b) => (
                  <BreadcrumbItem key={b.url}>
                    {b.isLast ? (
                      <BreadcrumbPage>{b.label}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link to={b.url}>{b.label}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-xl h-9 w-9" />
            <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
