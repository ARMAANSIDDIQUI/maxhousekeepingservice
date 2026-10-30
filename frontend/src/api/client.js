/**
 * Centralized Axios API Client with Comprehensive Fallbacks
 * Max Housekeeping Service - Western UP (India)
 * Single API source for all frontend network requests
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';

// Create single Axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor: attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage may not be accessible in SSR/sandbox environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwraps data and catches formatted errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend returns a formatted error response with message
    if (error.response && error.response.data) {
      const serverMsg = error.response.data.message || error.response.data.error;
      if (serverMsg) {
        return Promise.reject(new Error(serverMsg));
      }
    }
    return Promise.reject(error);
  }
);

// ========================================================
// FALLBACK RESPONSE PROVIDER (When Server Is Unreachable)
// ========================================================

export function getFallbackResponse(url, options = {}) {
  const [pathPart] = url.split('?');
  const cleanPath = pathPart.toLowerCase().replace(/^\/api\/v1/, '').replace(/^\//, '/');

  if (cleanPath === '/categories' || cleanPath === '/admin/categories') {
    return { success: false, count: 0, categories: [] };
  }

  if (cleanPath === '/locations/cities') {
    return { success: false, cities: [], count: 0 };
  }

  if (cleanPath === '/public/brands') {
    return { success: false, brands: [] };
  }

  if (cleanPath === '/public/testimonials') {
    return { success: false, testimonials: [] };
  }

  if (cleanPath === '/admin/stats') {
    return { success: false, stats: { totalBookings: 0, pendingBookings: 0, totalRevenue: 0, totalCustomerSavings: 0 } };
  }

  if (cleanPath === '/services' || cleanPath === '/admin/services') {
    return { success: false, services: [], count: 0 };
  }

  if (cleanPath === '/admin/cities') {
    return { success: false, cities: [] };
  }

  if (cleanPath === '/admin/testimonials') {
    return { success: false, testimonials: [] };
  }

  if (cleanPath === '/admin/contact-messages') {
    return { success: false, messages: [] };
  }

  if (cleanPath === '/admin/bookings') {
    return { success: false, bookings: [] };
  }

  if (cleanPath === '/admin/users') {
    return { success: false, users: [] };
  }

  if (cleanPath.startsWith('/services/')) {
    return { success: false, service: null };
  }

  return null;
}

import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js';

// Proactively clear any legacy stale cached business settings and operational data from localStorage
try {
  clearCacheByPrefix('/public/settings');
  clearCacheByPrefix('/settings');
  clearCacheByPrefix('/supervisor');
  clearCacheByPrefix('/bookings');
  clearCacheByPrefix('/admin/bookings');
} catch {}

// Unified apiRequest helper powered by Axios with automatic graceful fallbacks and memory+localStorage caching
export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toLowerCase();
  const rawUrl = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = options.params ? `${rawUrl}_${JSON.stringify(options.params)}` : rawUrl;

  const isPrivateEndpoint =
    rawUrl.startsWith('/auth') ||
    rawUrl.startsWith('/admin') ||
    rawUrl.startsWith('/supervisor') ||
    rawUrl.includes('/bookings') ||
    rawUrl.includes('/messages') ||
    rawUrl.includes('/settings');
  const canCache = method === 'get' && !options.noCache && !isPrivateEndpoint;

  // Check cache for public idempotent GET requests
  if (canCache) {
    const cached = getCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Prevent browser HTTP heuristic caching for noCache or settings requests
  const requestParams = { ...options.params };
  if (method === 'get' && (options.noCache || rawUrl.includes('/settings'))) {
    requestParams._t = Date.now();
  }

  try {
    const response = await api({
      url: rawUrl,
      method,
      data: options.body || options.data,
      headers: {
        ...(options.headers || {}),
        ...(options.noCache || rawUrl.includes('/settings') ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } : {})
      },
      params: requestParams
    });

    // Check if response is empty or unpopulated when expected
    if (response && response.success !== false) {
      // Save to cache memo & localStorage on successful public GET
      if (canCache) {
        setCache(cacheKey, response);
      } else if (method !== 'get') {
        // Invalidate cache on mutations
        if (rawUrl.includes('/services')) clearCacheByPrefix('/services');
        if (rawUrl.includes('/cities')) {
          clearCacheByPrefix('/locations/cities');
          clearCacheByPrefix('/admin/cities');
        }
        if (rawUrl.includes('/testimonials')) {
          clearCacheByPrefix('/public/testimonials');
          clearCacheByPrefix('/admin/testimonials');
        }
        if (rawUrl.includes('/users')) clearCacheByPrefix('/admin/users');
        if (rawUrl.includes('/settings')) {
          clearCacheByPrefix('/public/settings');
          clearCacheByPrefix('/settings');
          clearCacheByPrefix('/admin/settings');
        }
        if (rawUrl.includes('/bookings') || rawUrl.includes('/supervisor')) {
          clearCacheByPrefix('/bookings');
          clearCacheByPrefix('/supervisor');
          clearCacheByPrefix('/admin/bookings');
        }
      }
      return response;
    }
    // If backend returned success: false on GET, try fallback
    if (method === 'get') {
      const fallback = getFallbackResponse(rawUrl, options);
      if (fallback) return fallback;
    }
    return response;
  } catch (error) {
    // If GET request failed due to server offline, network timeout or 404/500, activate fallback
    if (method === 'get' || rawUrl === '/bookings/quote') {
      const fallback = getFallbackResponse(rawUrl, options);
      if (fallback) {
        console.warn(`[Axios API Fallback] Serving response for ${rawUrl}:`, error.message);
        return fallback;
      }
    }
    throw error;
  }
}

// ========================================================
// STRUCTURED DOMAIN API SERVICE OBJECTS
// ========================================================

export const servicesAPI = {
  getAll: (params = {}) => apiRequest('/services', { method: 'GET', params }),
  getPopular: () => apiRequest('/services?popular=true', { method: 'GET' }),
  getByCategory: (categorySlug) => apiRequest(`/services?category=${categorySlug}`, { method: 'GET' }),
  getBySlug: (slug) => apiRequest(`/services/${slug}`, { method: 'GET' })
};

export const categoriesAPI = {
  getAll: () => apiRequest('/categories', { method: 'GET' })
};

export const locationsAPI = {
  getCities: () => apiRequest('/locations/cities', { method: 'GET' })
};

export const brandsAPI = {
  getAll: () => apiRequest('/public/brands', { method: 'GET' })
};

export const testimonialsAPI = {
  getAll: () => apiRequest('/public/testimonials', { method: 'GET' })
};

export const bookingsAPI = {
  create: (bookingData) => apiRequest('/bookings', { method: 'POST', body: bookingData }),
  createBooking: (data) => apiRequest('/bookings', { method: 'POST', body: data }),
  getMyBookings: () => apiRequest('/bookings/my', { method: 'GET' }),
  track: (code) => apiRequest(`/bookings/track/${encodeURIComponent(code)}`, { method: 'GET' }),
  trackBooking: (code) => apiRequest(`/bookings/track/${encodeURIComponent(code)}`, { method: 'GET' }),
  getQuote: (payloadOrItems, citySlug) => {
    if (citySlug !== undefined) {
      return apiRequest('/bookings/quote', { method: 'POST', body: { items: payloadOrItems, citySlug } });
    }
    return apiRequest('/bookings/quote', { method: 'POST', body: payloadOrItems });
  },
  update: (bookingId, data) => apiRequest(`/bookings/${bookingId}/edit`, { method: 'PUT', body: data }),
  editBooking: (id, data) => apiRequest(`/bookings/${id}/edit`, { method: 'PUT', body: data }),
  cancelBooking: (id, reason) => apiRequest(`/bookings/${id}/cancel`, { method: 'PUT', body: { reason } }),
  deleteBooking: (id) => apiRequest(`/bookings/${id}`, { method: 'DELETE' }),
  getMessages: (bookingId) => apiRequest(`/bookings/${bookingId}/messages`, { method: 'GET' }),
  sendMessage: (bookingId, text, senderName) => apiRequest(`/bookings/${bookingId}/messages`, { method: 'POST', body: { text, senderName } }),
  getPublicCoupons: () => apiRequest('/bookings/coupons', { method: 'GET' }),
  getLiveLocation: (code) => apiRequest(`/bookings/${encodeURIComponent(code)}/live-location`, { method: 'GET', noCache: true })
};

export const authAPI = {
  getMe: () => apiRequest('/auth/me', { method: 'GET' }),
  sendSignupOtp: (data) => apiRequest('/auth/signup-otp', { method: 'POST', body: data }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (identifier, password) => apiRequest('/auth/login', { method: 'POST', body: { identifier, password } }),
  requestOtp: (email) => apiRequest('/auth/request-otp', { method: 'POST', body: { email } }),
  verifyOtp: (payload) => apiRequest('/auth/verify-otp', { method: 'POST', body: payload }),
  googleLogin: (payload) => apiRequest('/auth/google', { method: 'POST', body: payload }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  addAddress: (addressData) => apiRequest('/auth/addresses', { method: 'POST', body: addressData }),
  updateAddress: (addressId, addressData) => apiRequest(`/auth/addresses/${addressId}`, { method: 'PUT', body: addressData }),
  setDefaultAddress: (addressId) => apiRequest(`/auth/addresses/${addressId}/default`, { method: 'PUT' }),
  deleteAddress: (addressId) => apiRequest(`/auth/addresses/${addressId}`, { method: 'DELETE' }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  changePassword: (payload) => apiRequest('/auth/change-password', { method: 'PUT', body: payload })
};

export const publicAPI = {
  submitContact: (data) => apiRequest('/public/contact', { method: 'POST', body: data }),
  getTestimonials: () => apiRequest('/public/testimonials', { method: 'GET' }),
  getBrands: () => apiRequest('/public/brands', { method: 'GET' }),
  getSettings: () => apiRequest('/public/settings', { method: 'GET' })
};

export const adminAPI = {
  getStats: () => apiRequest('/admin/stats', { method: 'GET', noCache: true }),
  getBookings: (params = {}) => apiRequest('/admin/bookings', { method: 'GET', noCache: true, params }),
  getServices: () => apiRequest('/admin/services', { method: 'GET' }),
  updateBooking: (id, data) => apiRequest(`/admin/bookings/${id}`, { method: 'PUT', body: data }),
  deleteBooking: (id) => apiRequest(`/admin/bookings/${id}`, { method: 'DELETE' }),
  updateService: (id, data) => apiRequest(`/admin/services/${id}`, { method: 'PUT', body: data }),
  createService: (data) => apiRequest('/admin/services', { method: 'POST', body: data }),
  deleteService: (id) => apiRequest(`/admin/services/${id}`, { method: 'DELETE' }),
  // Categories management
  getCategories: () => apiRequest('/admin/categories', { method: 'GET' }),
  createCategory: (data) => apiRequest('/admin/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  // Cloudinary image upload
  uploadImage: async (file, folder = 'max-housekeeping/uploads') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post('/admin/upload', formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  uploadMultipleImages: async (files, folder = 'max-housekeeping/services') => {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    fileArray.forEach(file => formData.append('images', file));
    formData.append('folder', folder);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post('/admin/upload-multiple', formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  deleteImage: (publicId) => apiRequest(`/admin/upload/${encodeURIComponent(publicId)}`, { method: 'DELETE' }),
  // Testimonials management
  getTestimonials: () => apiRequest('/admin/testimonials', { method: 'GET' }),
  createTestimonial: (data) => apiRequest('/admin/testimonials', { method: 'POST', body: data }),
  updateTestimonial: (id, data) => apiRequest(`/admin/testimonials/${id}`, { method: 'PUT', body: data }),
  deleteTestimonial: (id) => apiRequest(`/admin/testimonials/${id}`, { method: 'DELETE' }),
  // Contact messages
  getContactMessages: () => apiRequest('/admin/contact-messages', { method: 'GET' }),
  updateContactMessage: (id, data) => apiRequest(`/admin/contact-messages/${id}`, { method: 'PUT', body: data }),
  deleteContactMessage: (id) => apiRequest(`/admin/contact-messages/${id}`, { method: 'DELETE' }),
  // Cities management
  getCities: () => apiRequest('/admin/cities', { method: 'GET' }),
  createCity: (data) => apiRequest('/admin/cities', { method: 'POST', body: data }),
  updateCity: (id, data) => apiRequest(`/admin/cities/${id}`, { method: 'PUT', body: data }),
  deleteCity: (id) => apiRequest(`/admin/cities/${id}`, { method: 'DELETE' }),
  // Users Database management (MongoDB Atlas)
  getUsers: () => apiRequest('/admin/users', { method: 'GET' }),
  updateUserRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  // Coupons management
  getCoupons: () => apiRequest('/admin/coupons', { method: 'GET' }),
  createCoupon: (data) => apiRequest('/admin/coupons', { method: 'POST', body: data }),
  updateCoupon: (id, data) => apiRequest(`/admin/coupons/${id}`, { method: 'PUT', body: data }),
  deleteCoupon: (id) => apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' }),
  // Site & Business Settings
  getSettings: () => apiRequest('/admin/settings', { method: 'GET', noCache: true }),
  // Video upload for Service forms
  uploadVideo: async (file, folder = 'max-housekeeping/services/videos') => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('folder', folder);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post('/admin/upload-video', formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  // Supervisor Management (Admins create and manage supervisor accounts)
  getSupervisors: () => apiRequest('/admin/supervisors', { method: 'GET' }),
  getSupervisorSlotAvailability: (params) => apiRequest('/admin/supervisors/slot-availability', { method: 'GET', params }),
  createSupervisor: (data) => apiRequest('/admin/supervisors', { method: 'POST', body: data }),
  updateSupervisor: (id, data) => apiRequest(`/admin/supervisors/${id}`, { method: 'PUT', body: data }),
  deleteSupervisor: (id) => apiRequest(`/admin/supervisors/${id}`, { method: 'DELETE' }),
  assignBookingSupervisor: (id, data) => apiRequest(`/admin/bookings/${id}/assign`, { method: 'PUT', body: data }),
  updateSettings: async (data) => {
    clearCacheByPrefix('/public/settings');
    clearCacheByPrefix('/settings');
    clearCacheByPrefix('/admin/settings');
    const res = await apiRequest('/admin/settings', { method: 'PUT', body: data });
    clearCacheByPrefix('/public/settings');
    clearCacheByPrefix('/settings');
    clearCacheByPrefix('/admin/settings');
    try {
      localStorage.setItem('max_settings_updated_at', Date.now().toString());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('max_settings_updated', { detail: res }));
      }
    } catch {}
    return res;
  }
};

/**
 * Supervisor API: Dashboard, OTP verification, and Before/After photo uploads
 */
export const supervisorAPI = {
  getStats: (supervisorId) => apiRequest('/supervisor/stats', { method: 'GET', noCache: true, params: supervisorId ? { supervisorId } : {} }),
  getSchedule: (date, supervisorId) => apiRequest('/supervisor/schedule', { method: 'GET', noCache: true, params: { ...(date ? { date } : {}), ...(supervisorId ? { supervisorId } : {}) } }),
  getBookings: (params = {}) => apiRequest('/supervisor/bookings', { method: 'GET', noCache: true, params }),
  getBookingDetails: (id) => apiRequest(`/supervisor/bookings/${id}`, { method: 'GET', noCache: true }),
  verifyOtp: (id, otp) => apiRequest(`/supervisor/bookings/${id}/verify-otp`, { method: 'POST', body: { otp } }),
  getSupervisors: () => apiRequest('/supervisor/supervisors', { method: 'GET', noCache: true }),
  getPool: () => apiRequest('/supervisor/pool', { method: 'GET', noCache: true }),
  claimBooking: (id) => apiRequest(`/supervisor/bookings/${id}/claim`, { method: 'POST' }),
  createQuickTestBooking: () => apiRequest('/supervisor/quick-test-booking', { method: 'POST' }),
  uploadPhoto: async (id, file, type = 'before', notes = '') => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);
    if (notes) formData.append('notes', notes);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post(`/supervisor/bookings/${id}/photos`, formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  deletePhoto: (id, photoId) => apiRequest(`/supervisor/bookings/${id}/photos/${photoId}`, { method: 'DELETE' }),
  updateStatus: (id, status, note) => apiRequest(`/supervisor/bookings/${id}/status`, { method: 'PUT', body: { status, note } }),
  updateLiveLocation: (id, locationData) => apiRequest(`/supervisor/bookings/${id}/location`, { method: 'POST', body: locationData }),
  broadcastLiveLocation: (locationData) => apiRequest('/supervisor/location/broadcast', { method: 'POST', body: locationData })
};

// Export api Axios instance as default for direct use if desired
export default apiRequest;
