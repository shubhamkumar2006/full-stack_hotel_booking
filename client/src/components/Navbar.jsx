import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../api';
import { toast } from 'sonner';
import {
  Search,
  Heart,
  User,
  LogOut,
  Building2,
  LayoutDashboard,
  Menu,
  Sparkles,
  Shield,
  Compass,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandPalette } from '@/components/CommandPalette';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                🏨
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-display tracking-tight">
                StayNest
              </span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <NavLink to="/search">
                    {({ isActive }) => (
                      <NavigationMenuLink
                        className={`${navigationMenuTriggerStyle()} ${
                          isActive ? 'bg-accent text-accent-foreground font-semibold' : ''
                        }`}
                      >
                        <Compass className="w-4 h-4 mr-2 text-indigo-400" />
                        Explore Stays
                      </NavigationMenuLink>
                    )}
                  </NavLink>
                </NavigationMenuItem>

                {user?.role === 'HOST' && (
                  <NavigationMenuItem>
                    <NavLink to="/host">
                      {({ isActive }) => (
                        <NavigationMenuLink
                          className={`${navigationMenuTriggerStyle()} ${
                            isActive ? 'bg-accent text-accent-foreground font-semibold' : ''
                          }`}
                        >
                          <Building2 className="w-4 h-4 mr-2 text-purple-400" />
                          Host Dashboard
                        </NavigationMenuLink>
                      )}
                    </NavLink>
                  </NavigationMenuItem>
                )}

                {user?.role === 'ADMIN' && (
                  <NavigationMenuItem>
                    <NavLink to="/admin">
                      {({ isActive }) => (
                        <NavigationMenuLink
                          className={`${navigationMenuTriggerStyle()} ${
                            isActive ? 'bg-accent text-accent-foreground font-semibold' : ''
                          }`}
                        >
                          <Shield className="w-4 h-4 mr-2 text-rose-400" />
                          Admin Portal
                        </NavigationMenuLink>
                      )}
                    </NavLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Search Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border-border/60 bg-background/50 hover:bg-accent rounded-xl px-3 h-9"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle className="rounded-xl h-9 w-9" />

              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="hidden sm:flex rounded-xl h-9 w-9"
                  >
                    <Link to="/wishlist">
                      <Heart className="h-4 w-4 text-rose-400" />
                      <span className="sr-only">Wishlist</span>
                    </Link>
                  </Button>

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl border-border/60 hover:bg-accent transition-all h-9"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user?.avatar} alt={user?.name} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-xs font-semibold max-w-[90px] truncate">
                          {user?.name?.split(' ')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 p-1.5">
                      <DropdownMenuLabel className="font-normal p-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none">{user?.name}</p>
                          <p className="text-xs text-muted-foreground leading-none truncate">{user?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2">
                        <Link to="/profile">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Profile & Account</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2">
                        <Link to="/bookings">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>My Bookings</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2">
                        <Link to="/wishlist">
                          <Heart className="h-4 w-4 text-rose-400" />
                          <span>Wishlist</span>
                        </Link>
                      </DropdownMenuItem>

                      {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2">
                            <Link to="/host">
                              <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                              <span>Host Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      {user?.role === 'ADMIN' && (
                        <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2">
                          <Link to="/admin">
                            <Shield className="h-4 w-4 text-rose-400" />
                            <span>Admin Portal</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer gap-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex rounded-xl h-9 text-xs">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button variant="gradient" size="sm" asChild className="rounded-xl h-9 text-xs px-4">
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Drawer Trigger */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader className="text-left pb-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-gradient-to-tr from-amber-500 to-orange-500 text-white">
                        🏨
                      </div>
                      <span className="font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        StayNest
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-3 pt-6">
                    <Button
                      variant="outline"
                      className="justify-start gap-2 h-11 text-xs"
                      onClick={() => {
                        setSheetOpen(false);
                        setCommandOpen(true);
                      }}
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span>Search stays or locations...</span>
                    </Button>

                    <NavLink
                      to="/search"
                      onClick={() => setSheetOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
                        }`
                      }
                    >
                      <Compass className="h-4 w-4 text-indigo-400" />
                      Explore Stays
                    </NavLink>

                    {isAuthenticated ? (
                      <>
                        <NavLink
                          to="/bookings"
                          onClick={() => setSheetOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              isActive ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
                            }`
                          }
                        >
                          <Calendar className="h-4 w-4 text-blue-400" />
                          My Bookings
                        </NavLink>

                        <NavLink
                          to="/wishlist"
                          onClick={() => setSheetOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              isActive ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
                            }`
                          }
                        >
                          <Heart className="h-4 w-4 text-rose-400" />
                          Wishlist
                        </NavLink>

                        <NavLink
                          to="/profile"
                          onClick={() => setSheetOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              isActive ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
                            }`
                          }
                        >
                          <User className="h-4 w-4 text-amber-400" />
                          Profile
                        </NavLink>

                        {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                          <NavLink
                            to="/host"
                            onClick={() => setSheetOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                isActive ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
                              }`
                            }
                          >
                            <Building2 className="h-4 w-4 text-purple-400" />
                            Host Portal
                          </NavLink>
                        )}

                        {user?.role === 'ADMIN' && (
                          <NavLink
                            to="/admin"
                            onClick={() => setSheetOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                isActive ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
                              }`
                            }
                          >
                            <Shield className="h-4 w-4 text-red-400" />
                            Admin Panel
                          </NavLink>
                        )}

                        <div className="pt-4 mt-2 border-t border-border">
                          <Button
                            variant="destructive"
                            className="w-full justify-start gap-2 h-11"
                            onClick={() => {
                              setSheetOpen(false);
                              handleLogout();
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign out</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 pt-4 border-t border-border">
                        <Button variant="outline" asChild className="w-full justify-center h-11" onClick={() => setSheetOpen(false)}>
                          <Link to="/login">Sign in</Link>
                        </Button>
                        <Button variant="gradient" asChild className="w-full justify-center h-11" onClick={() => setSheetOpen(false)}>
                          <Link to="/signup">Create account</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
