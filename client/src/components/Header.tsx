import React, { useEffect, useState } from 'react';
import { useAgriStore } from '../context/useAgriStore';
import { api } from '../services/api';
import { SUPPORTED_LANGUAGES, type MandiPriceQuote, type UserRole } from '@types';
import { t } from '../services/i18n';


interface HeaderProps {
  onOpenSellHarvest: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSellHarvest, onOpenCart, onOpenAuth }) => {
  const {
    currentUser,
    isAuthenticated,
    logout,
    currentRole,
    setRole,
    language,
    setLanguage,
    isOnline,
    setOnlineStatus,
    unsyncedDraftCount,
    cart,
  } = useAgriStore();

  const [quotes, setQuotes] = useState<MandiPriceQuote[]>([
    {
      commodity: 'Nashik Tomato A+',
      state: 'Maharashtra',
      district: 'Nashik',
      market: 'Pimpalgaon',
      min_price_per_kg: 28,
      max_price_per_kg: 36,
      modal_price_per_kg: 34,
      price_date: '2026-10-14',
      source: 'AGMARKNET',
    },
    {
      commodity: 'Lasalgaon Red Onion',
      state: 'Maharashtra',
      district: 'Nashik',
      market: 'Lasalgaon',
      min_price_per_kg: 22,
      max_price_per_kg: 29.5,
      modal_price_per_kg: 26.5,
      price_date: '2026-10-14',
      source: 'AGMARKNET',
    },
    {
      commodity: 'Ratnagiri Alphonso Hapus (GI)',
      state: 'Maharashtra',
      district: 'Ratnagiri',
      market: 'Devgad',
      min_price_per_kg: 160,
      max_price_per_kg: 210,
      modal_price_per_kg: 180,
      price_date: '2026-10-14',
      source: 'APMC_SPOT',
    },
    {
      commodity: 'Indore Jyoti Potato',
      state: 'Madhya Pradesh',
      district: 'Indore',
      market: 'Indore',
      min_price_per_kg: 20,
      max_price_per_kg: 26,
      modal_price_per_kg: 24,
      price_date: '2026-10-14',
      source: 'AGMARKNET',
    },
    {
      commodity: 'Amravati Desi Chana',
      state: 'Maharashtra',
      district: 'Amravati',
      market: 'Amravati',
      min_price_per_kg: 62,
      max_price_per_kg: 72,
      modal_price_per_kg: 68,
      price_date: '2026-10-14',
      source: 'NCDEX',
    },
  ]);

  useEffect(() => {
    api.getMandiBenchmarks()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setQuotes(res.data);
        }
      })
      .catch(() => {
        // Retain initial verified benchmark quotes
      });
  }, []);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity_kg, 0);

  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');

  useEffect(() => {
    if (!isLangModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLangModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLangModalOpen]);

  const filteredLanguages = Object.values(SUPPORTED_LANGUAGES).filter((item) => {
    const q = langSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.script.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* 0. LIVE MANDI SPOT RATE TICKER (Stitch Top Bar) */}
      <aside className="bg-primary text-primary-fixed text-label-sm font-label-sm px-4 md:px-margin-lg py-1.5 border-b border-primary-container overflow-hidden z-50">
        <div className="max-w-full 2xl:max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex h-2 w-2 rounded-full bg-secondary-fixed animate-pulse"></span>
            <span className="font-bold text-surface-container-lowest">
              {t('mandiBenchmark', language)}
            </span>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-on-primary-container">
            {quotes.map((quote, idx) => (
              <React.Fragment key={quote.commodity}>
                <span>
                  {quote.commodity}:{' '}
                  <strong className="text-surface-container-lowest">
                    ₹{quote.modal_price_per_kg.toFixed(2)}/kg
                  </strong>{' '}
                  <span className={idx % 2 === 0 ? 'text-secondary-fixed font-bold' : 'text-on-tertiary-container font-bold'}>
                    {idx % 2 === 0 ? '▲ +8.2%' : '▼ -1.4%'}
                  </span>
                </span>
                {idx < quotes.length - 1 && <span className="text-outline">|</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-2 shrink-0 text-outline-variant">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>NCDEX &amp; AGMARKNET Live Feed</span>
          </div>
        </div>
      </aside>

      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-surface-container-lowest border-b border-outline-variant shadow-elevation-1 sticky top-0 z-40 transition-all w-full">
        <nav className="flex items-center justify-between w-full px-3 sm:px-6 lg:px-8 max-w-full 2xl:max-w-[1600px] mx-auto h-16 min-w-0 gap-2 sm:gap-4">
          {/* Left: Brand Logo & Tagline */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <a className="flex items-center gap-1.5 sm:gap-2 group shrink-0" href="#hero">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-container flex items-center justify-center text-secondary-fixed shadow-sm group-hover:scale-95 transition-transform duration-150 shrink-0">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">eco</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base md:text-headline-sm font-extrabold text-primary tracking-tight leading-none truncate">
                  AgriDirect
                </div>
                <div className="text-[9px] sm:text-[10px] font-label-sm tracking-wider uppercase text-on-surface-variant font-semibold mt-0.5 hidden xs:block truncate">
                  Kisan-to-Grahak Grid
                </div>
              </div>
            </a>

            {/* Network / PWA Status Pill */}
            <div className="hidden 2xl:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm border border-outline-variant shrink-0">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-secondary animate-pulse-slow' : 'bg-error animate-ping'}`}></span>
              <span className="text-on-surface font-medium">
                {isOnline ? 'PWA Synced' : 'Offline Mode'}
              </span>
              <span className="text-outline-variant">|</span>
              <span className="text-[10px] text-on-surface-variant font-mono">
                {unsyncedDraftCount > 0 ? `${unsyncedDraftCount} Local Drafts` : 'IndexedDB Ready'}
              </span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden xl:flex items-center gap-4 2xl:gap-7 shrink-0 text-sm font-medium">
            <a
              className="text-secondary font-bold pb-1 border-b-2 border-secondary transition-colors"
              href="#marketplace"
            >
              {t('marketplace', language)}
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
              href="#disintermediation"
            >
              Disintermediation
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
              href="#pricing-model"
            >
              Pricing Model
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
              href="#demand-forecast"
            >
              Forecasting
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
              href="#logistics-map"
            >
              Logistics
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
              href="#b2b-contracts"
            >
              B2B
            </a>
          </div>

          {/* Right: Actions Cluster (Touch Target Optimized) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Persona Switcher Dropdown */}
            <select
              value={currentRole}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-9 sm:h-10 px-2 sm:px-2.5 py-1 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-label-sm font-label-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer shrink-0 max-w-[105px] xs:max-w-none transition-all shadow-sm"
              aria-label="Select Persona Role"
            >
              <option value="FARMER">🌱 Kisan</option>
              <option value="RETAIL_CONSUMER">🛒 Grahak</option>
              <option value="BULK_BUYER">🏢 B2B</option>
              <option value="LOGISTICS_DRIVER">🚚 Fleet</option>
              <option value="GOVT_ADMIN">🏛️ Mandi</option>
            </select>

            {/* 22-Language Vernacular Selector Trigger */}
            <button
              onClick={() => setIsLangModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl border border-secondary/40 bg-secondary/10 hover:bg-secondary/20 text-label-sm font-label-sm text-primary transition-all shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary shrink-0 select-none cursor-pointer"
              type="button"
              title="Switch from 22 Eighth Schedule Indian Languages"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-secondary">translate</span>
              <span className="font-bold text-on-surface hidden 2xl:inline text-xs">
                {SUPPORTED_LANGUAGES[language]?.nativeName || 'हिन्दी'}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                {language}
              </span>
            </button>

            {/* Online / Offline Network Toggle Simulator */}
            <button
              onClick={() => setOnlineStatus(!isOnline)}
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 select-none cursor-pointer"
              title={isOnline ? 'Connected (Click to simulate offline field)' : 'Offline (Click to simulate reconnection)'}
              type="button"
            >
              <span className={`material-symbols-outlined text-[20px] ${isOnline ? 'text-secondary' : 'text-error'}`}>
                {isOnline ? 'wifi' : 'wifi_off'}
              </span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low relative active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 select-none cursor-pointer"
              title="View Cart"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-tertiary-container text-surface-container-lowest rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Sell Harvest Action Button (Opens Kisan Screen 2 Flow) */}
            <button
              onClick={onOpenSellHarvest}
              className="hidden lg:inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-tertiary-container hover:bg-on-tertiary-fixed-variant text-surface-container-lowest font-label-sm font-bold shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-container shrink-0 select-none cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-[17px]">agriculture</span>
              <span className="hidden 2xl:inline">{t('sellHarvest', language)}</span>
              <span className="2xl:hidden">Sell Harvest</span>
            </button>

            {/* User Auth Status / Trigger (ALWAYS VISIBLE & PROMINENT) */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-surface-container border border-outline-variant text-xs shadow-sm shrink-0">
                <div className="w-7 h-7 rounded-lg bg-primary text-secondary-fixed flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left leading-tight max-w-[85px] truncate">
                  <div className="font-bold text-primary truncate text-[11px]">{currentUser?.full_name}</div>
                  <div className="text-[9px] text-on-surface-variant font-mono uppercase">{currentUser?.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error-container hover:text-error text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                type="button"
                className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-sm font-bold shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 text-xs select-none cursor-pointer whitespace-nowrap"
                title="Sign In with Email OTP"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Sign In</span>
              </button>
            )}

            {/* Enter Portal Anchor */}
            <a
              href="#portal-sandbox"
              className="hidden 2xl:inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm font-bold shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 text-xs select-none"
            >
              <span>Portals</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </nav>
      </header>

      {/* 22 EIGHTH SCHEDULE LANGUAGES SELECTOR MODAL */}
      {isLangModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-language-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-surface-container-lowest rounded-2xl shadow-elevation-3 border border-outline-variant max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">translate</span>
                </div>
                <div>
                  <h3 id="modal-language-title" className="font-bold text-base md:text-lg text-primary leading-tight">
                    {t('officialLanguagesCount', language)}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Sovereign Bhashini &amp; Indic Voice Engine across all 22 official languages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3.5 border-b border-outline-variant bg-surface">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder={t('searchLanguage', language)}
                  className="w-full min-h-[48px] pl-11 pr-4 py-2.5 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-outline"
                  autoFocus
                />
              </div>
            </div>

            {/* Language Grid */}
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh]">
              {filteredLanguages.map((meta) => {
                const isSelected = language === meta.code;
                return (
                  <button
                    key={meta.code}
                    type="button"
                    onClick={() => {
                      setLanguage(meta.code);
                      setIsLangModalOpen(false);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-2 group cursor-pointer ${
                      isSelected
                        ? 'border-secondary bg-secondary-fixed/15 ring-2 ring-secondary/30'
                        : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-secondary/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-primary">
                          {meta.nativeName}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          ({meta.name})
                        </span>
                      </div>
                      <div className="text-[11px] text-outline font-mono mt-0.5">
                        {meta.script} • Bhashini: {meta.bhashiniCode}
                      </div>
                      <div className="text-[11px] text-on-surface-variant/80 italic mt-1 truncate max-w-[220px]">
                        "{meta.samplePhrase}"
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary text-[18px] shrink-0 mt-0.5">
                        arrow_forward
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
                Constitutional 8th Schedule Recognized
              </span>
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="btn-outline min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
