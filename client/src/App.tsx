import React, { useState, useEffect } from 'react';
import { useAgriStore } from './context/useAgriStore';

// UI Components according to Stitch Design Tokens & Hierarchy
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DisintermediationGrid } from './components/DisintermediationGrid';
import { PricingCalculator } from './components/PricingCalculator';
import { Marketplace } from './components/Marketplace';
import { AIDemandForecasting } from './components/AIDemandForecasting';
import { LogisticsMap } from './components/LogisticsMap';
import { B2BContracts } from './components/B2BContracts';
import { ProvenanceTimeline } from './components/ProvenanceTimeline';
import { OfflineSyncConsole } from './components/OfflineSyncConsole';
import { EnterpriseSandbox } from './components/EnterpriseSandbox';
import { Footer } from './components/Footer';

// Modals
import { FarmerWizardModal } from './components/FarmerWizardModal';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [isFarmerWizardOpen, setIsFarmerWizardOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const {
    toast,
    clearToast,
    setOnlineStatus,
    refreshOfflineDrafts,
    currentRole,
    currentUser,
    showToast,
    isOnline,
    initSupabaseAuth,
  } = useAgriStore();

  // Initialize Supabase Auth session & listener on mount
  useEffect(() => {
    initSupabaseAuth();
  }, [initSupabaseAuth]);

  // Listen for browser online / offline lifecycle
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of offline drafts
    refreshOfflineDrafts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, refreshOfflineDrafts]);

  // Real-time SSE notification subscriber
  useEffect(() => {
    if (!isOnline || typeof EventSource === 'undefined') return;

    const sseUrl = `/api/v1/notifications/stream?role=${currentRole}&userId=${currentUser?.id || ''}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('ORDER_CREATED', (e: MessageEvent) => {
      try {
        const notif = JSON.parse(e.data);
        showToast(notif.message, 'success');
      } catch (err) {
        console.warn('Failed to parse SSE ORDER_CREATED:', err);
      }
    });

    eventSource.addEventListener('TEMPERATURE_ALERT', (e: MessageEvent) => {
      try {
        const notif = JSON.parse(e.data);
        showToast(notif.message, 'warning');
      } catch (err) {
        console.warn('Failed to parse SSE TEMPERATURE_ALERT:', err);
      }
    });

    eventSource.addEventListener('PRICE_ALERT', (e: MessageEvent) => {
      try {
        const notif = JSON.parse(e.data);
        showToast(notif.message, 'info');
      } catch (err) {
        console.warn('Failed to parse SSE PRICE_ALERT:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [isOnline, currentRole, currentUser?.id, showToast]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface text-on-surface flex flex-col selection:bg-secondary-container selection:text-on-secondary-container antialiased">
      {/* 1. Global Navigation Bar & Mandi Ticker */}
      <Header
        onOpenSellHarvest={() => setIsFarmerWizardOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section with Cinematic Farm Scrim & Key Metrics */}
        <Hero onOpenSellHarvest={() => setIsFarmerWizardOpen(true)} />

        {/* 3. 7-Tier Disintermediation Margin Comparison Grid */}
        <DisintermediationGrid />

        {/* 4. Interactive Formula-Based Mandi Pricing Calculator */}
        <PricingCalculator />

        {/* 5. Live Harvest Marketplace with Quality Assays & Cart Actions */}
        <Marketplace />

        {/* 6. AI Demand Forecasting & Nashik Micro-Climate Telemetry */}
        <AIDemandForecasting />

        {/* 7. Cold Logistics Multi-Stop Route Optimization Engine (Tata Ace EV Reefer) */}
        <LogisticsMap />

        {/* 8. B2B Institutional Forward Contracts & Volume Bookings */}
        <B2BContracts />

        {/* 9. Cryptographic Farm-to-Table Provenance QR Verification */}
        <ProvenanceTimeline />

        {/* 10. IndexedDB Offline Mutation Queue & Network Simulator */}
        <OfflineSyncConsole />

        {/* 11. Multi-Persona Interactive Testing Sandbox */}
        <EnterpriseSandbox
          onOpenSellHarvest={() => setIsFarmerWizardOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
        />
      </main>

      {/* 12. Stitch Master Footer */}
      <Footer />

      {/* Modal 1: Screen 2 Kisan Vernacular Harvest Wizard */}
      <FarmerWizardModal
        isOpen={isFarmerWizardOpen}
        onClose={() => setIsFarmerWizardOpen(false)}
      />

      {/* Modal 2: Grahak Direct Cart & Transparent Ledger Breakdown */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Modal 3: Supabase Email OTP Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Toast Notification System */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md w-full px-4 sm:px-0">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-primary-container text-on-primary-container border-primary/30'
                : toast.type === 'error'
                ? 'bg-error-container text-on-error-container border-error/30'
                : toast.type === 'warning'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-surface-container-highest text-on-surface border-outline/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">
                {toast.type === 'success'
                  ? 'check_circle'
                  : toast.type === 'error'
                  ? 'error'
                  : toast.type === 'warning'
                  ? 'warning'
                  : 'info'}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={clearToast}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Close notification"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
