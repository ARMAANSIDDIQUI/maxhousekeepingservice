import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Lenis from 'lenis';

import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { PWAProvider } from './context/PWAContext';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import MobileBar from './components/common/MobileBar';
import ScrollToTopButton from './components/common/ScrollToTopButton';
import PWAInstallModal from './components/common/PWAInstallModal';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import BookingPage from './pages/BookingPage';
import TrackBookingPage from './pages/TrackBookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Lenis Smooth Scroll Initializer
function LenisProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      window.lenis = null;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LenisProvider>
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <BookingProvider>
                <PWAProvider>
                  <div className="flex flex-col min-h-screen bg-[#F4EFE6] text-[#10231D]">
                    <ScrollToTop />
                    
                    {/* Top Navigation */}
                    <Header />

                    {/* Main Route Content */}
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/services/:slug" element={<ServiceDetailPage />} />
                        <Route path="/book" element={<BookingPage />} />
                        <Route path="/book/:slug" element={<BookingPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/track" element={<TrackBookingPage />} />
                        <Route path="/track/:code" element={<TrackBookingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/dashboard" element={<CustomerDashboard />} />
                        <Route path="/my-bookings" element={<CustomerDashboard />} />
                        <Route path="/admin/*" element={<AdminDashboard />} />
                        {/* Broken / Non-existent links redirect to Home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>

                    {/* Mobile Sticky Bar (<768px) */}
                    <MobileBar />

                    {/* Floating Scroll To Top Button */}
                    <ScrollToTopButton />

                    {/* Editorial Footer */}
                    <Footer />

                    {/* Once-per-day PWA App Download Modal Pop Up on site load & explicit clicks */}
                    <PWAInstallModal />
                  </div>
                </PWAProvider>
              </BookingProvider>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </LenisProvider>
    </BrowserRouter>
  );
}
