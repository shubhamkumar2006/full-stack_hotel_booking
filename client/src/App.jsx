import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authAPI, userAPI } from './api';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public pages
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import OtpVerify from './pages/auth/OtpVerify';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/NotFound';

// Guest pages
import Checkout from './pages/guest/Checkout';
import BookingConfirmation from './pages/guest/BookingConfirmation';
import BookingHistory from './pages/guest/BookingHistory';
import Wishlist from './pages/guest/Wishlist';
import Profile from './pages/guest/Profile';

// Host pages
import HostDashboard from './pages/host/HostDashboard';
import HostProperties from './pages/host/HostProperties';
import AddEditProperty from './pages/host/AddEditProperty';
import RoomManagement from './pages/host/RoomManagement';
import HostBookings from './pages/host/HostBookings';
import HostEarnings from './pages/host/HostEarnings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminBookings from './pages/admin/AdminBookings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReviews from './pages/admin/AdminReviews';

// Guards
const RequireAuth = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { isAuthenticated, setAccessToken, updateUser, logout } = useAuthStore();

  useEffect(() => {
    // Silent session refresh and profile sync on page load/refresh
    if (isAuthenticated) {
      authAPI.refreshToken()
        .then((res) => {
          const newToken = res.data.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            userAPI.getMe().then((meRes) => {
              if (meRes.data.data) {
                updateUser(meRes.data.data);
              }
            }).catch(console.error);
          }
        })
        .catch((err) => {
          console.warn('Silent refresh skipped/failed:', err?.response?.data?.message || err.message);
        });
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ──────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
        </Route>

        {/* ── Auth (no navbar) ─────────────────── */}
        <Route path="/login"          element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/signup"         element={<RedirectIfAuth><Signup /></RedirectIfAuth>} />
        <Route path="/verify-otp"     element={<OtpVerify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Guest ───────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/checkout/:bookingId"     element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/booking/:bookingId"      element={<RequireAuth><BookingConfirmation /></RequireAuth>} />
          <Route path="/bookings"                element={<RequireAuth><BookingHistory /></RequireAuth>} />
          <Route path="/wishlist"                element={<RequireAuth><Wishlist /></RequireAuth>} />
          <Route path="/profile"                 element={<RequireAuth><Profile /></RequireAuth>} />
        </Route>

        {/* ── Host ────────────────────────────── */}
        <Route path="/host" element={<RequireAuth roles={['HOST', 'ADMIN']}><DashboardLayout role="host" /></RequireAuth>}>
          <Route index element={<HostDashboard />} />
          <Route path="properties" element={<HostProperties />} />
          <Route path="properties/new" element={<AddEditProperty />} />
          <Route path="properties/:id/edit" element={<AddEditProperty />} />
          <Route path="properties/:propertyId/rooms" element={<RoomManagement />} />
          <Route path="bookings" element={<HostBookings />} />
          <Route path="earnings" element={<HostEarnings />} />
        </Route>

        {/* ── Admin ───────────────────────────── */}
        <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><DashboardLayout role="admin" /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reviews" element={<AdminReviews />} />
        </Route>

        {/* ── 404 ─────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
