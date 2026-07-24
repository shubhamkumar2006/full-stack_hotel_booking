import api from './axios';

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  signup:            (data) => api.post('/auth/signup', data),
  login:             (data) => api.post('/auth/login', data),
  requestPhoneOtp:   (data) => api.post('/auth/login-phone-request', data),
  verifyPhoneOtp:    (data) => api.post('/auth/login-phone-verify', data),
  verifyOtp:         (data) => api.post('/auth/verify-otp', data),
  refreshToken:      ()     => api.post('/auth/refresh'),
  logout:            ()     => api.post('/auth/logout'),
  forgotPassword:    (data) => api.post('/auth/forgot-password', data),
  resetPassword:     (data) => api.post('/auth/reset-password', data),
};

// ── Users ─────────────────────────────────────────────────
export const userAPI = {
  getMe:               ()     => api.get('/users/me'),
  updateMe:            (data) => api.patch('/users/me', data),
  deactivate:          ()     => api.delete('/users/me'),
  uploadAvatar:        (form) => api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getNotifications:    (p)    => api.get('/users/notifications', { params: p }),
  markNotificationsRead: ()   => api.patch('/users/notifications/read'),
};

// ── Properties ────────────────────────────────────────────
export const propertyAPI = {
  search:          (params) => api.get('/properties', { params }),
  getOne:          (id)     => api.get(`/properties/${id}`),
  getById:         (id)     => api.get(`/properties/${id}`),
  create:          (form)   => api.post('/properties', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:          (id, data) => api.patch(`/properties/${id}`, data),
  delete:          (id)     => api.delete(`/properties/${id}`),
  getHostProperties:(p)     => api.get('/host/properties', { params: p }),
  // Rooms
  createRoom:      (propId, form) => api.post(`/properties/${propId}/rooms`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateRoom:      (roomId, data) => api.patch(`/properties/rooms/${roomId}`, data),
  deleteRoom:      (roomId)       => api.delete(`/properties/rooms/${roomId}`),
  setAvailability: (roomId, dates) => api.put(`/properties/rooms/${roomId}/availability`, { dates }),
};

// ── Search ────────────────────────────────────────────────
export const searchAPI = {
  properties: (params) => api.get('/properties', { params }),
  reviews:    (propId, p) => api.get(`/reviews/property/${propId}`, { params: p }),
};

// ── Bookings ──────────────────────────────────────────────
export const bookingAPI = {
  checkAvailability:(params) => api.get('/bookings/check-availability', { params }),
  create:           (data)   => api.post('/bookings', data),
  getOne:           (id)     => api.get(`/bookings/${id}`),
  getMyBookings:    (p)      => api.get('/bookings/me', { params: p }),
  cancel:           (id)     => api.patch(`/bookings/${id}/cancel`),
};

// ── Payments ──────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/order', data),
  verify:      (data) => api.post('/payments/verify', data),
};

// ── Reviews ───────────────────────────────────────────────
export const reviewAPI = {
  create:     (form) => api.post('/reviews', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getByProp:  (id, p) => api.get(`/reviews/property/${id}`, { params: p }),
  addReply:   (id, reply) => api.patch(`/reviews/${id}/reply`, { reply }),
  remove:     (id) => api.delete(`/reviews/${id}`),
};

// ── Wishlist ──────────────────────────────────────────────
export const wishlistAPI = {
  get:    ()        => api.get('/wishlist'),
  add:    (propId)  => api.post('/wishlist', { propertyId: propId }),
  remove: (propId)  => api.delete(`/wishlist/${propId}`),
};

// ── Host Dashboard ────────────────────────────────────────
export const hostAPI = {
  getBookings: (p) => api.get('/host/bookings', { params: p }),
  getEarnings: (p) => api.get('/host/earnings', { params: p }),
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getUsers:             (p)       => api.get('/admin/users', { params: p }),
  toggleUserStatus:     (id, s)   => api.patch(`/admin/users/${id}/status`, { isActive: s }),
  getProperties:        (p)       => api.get('/admin/properties', { params: p }),
  updatePropertyStatus: (id, s)   => api.patch(`/admin/properties/${id}/status`, { status: s }),
  getBookings:          (p)       => api.get('/admin/bookings', { params: p }),
  cancelBooking:        (id)      => api.patch(`/admin/bookings/${id}/cancel`),
  refundBooking:        (id, amt) => api.post(`/admin/bookings/${id}/refund`, { amount: amt }),
  getAnalytics:         ()        => api.get('/admin/analytics'),
  getReviews:           (p)       => api.get('/admin/reviews', { params: p }),
  removeReview:         (id)      => api.delete(`/admin/reviews/${id}`),
};
