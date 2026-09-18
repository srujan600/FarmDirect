import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAgriStore } from '../context/useAgriStore';
import { useTranslation } from '../context/useTranslation';
import type { CropListing } from '@types';

export const Marketplace: React.FC = () => {
  const { addToCart } = useAgriStore();
  const { t } = useTranslation();
  const [listings, setListings] = useState<CropListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchListings = (category?: string, query?: string) => {
    setLoading(true);
    api.getMarketplaceListings(category === 'ALL' ? undefined : category, query)
      .then((res) => {
        if (res.data) {
          setListings(res.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching marketplace listings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(selectedCategory, searchQuery);
  };

  return (
    <section className="section-container section-padding" id="marketplace">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm font-bold uppercase tracking-wider">
            {t('marketplace.badge')}
          </span>
          <h2 className="text-headline-xl font-headline-xl text-primary mt-2">
            {t('marketplace.title')}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            {t('marketplace.subtitle')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: t('marketplace.allCategories'), value: 'ALL' },
            { label: t('marketplace.categoryFruits'), value: 'FRUITS' },
            { label: t('marketplace.categoryVegetables'), value: 'VEGETABLES' },
            { label: t('marketplace.categoryPulses'), value: 'PULSES' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-label-sm font-label-sm font-bold shrink-0 transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] ${
                selectedCategory === tab.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest border border-outline-variant hover:bg-surface-container text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2 sm:gap-3 w-full items-stretch">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder={t('marketplace.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[48px] pl-11 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-secondary/40 focus:border-secondary focus:outline-none text-xs sm:text-body-sm transition-all"
          />
        </div>
        <button
          type="submit"
          className="btn-secondary min-h-[48px] px-5 sm:px-6 rounded-xl text-xs sm:text-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>{t('common.search')}</span>
        </button>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-surface-container-low border border-outline-variant/60"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant p-8">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
          <h3 className="text-headline-sm font-bold text-primary">No Active Lots Found</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Try adjusting your search criteria or switch category filters.
          </p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 overflow-hidden shadow-elevation-1 hover:shadow-elevation-2 transition-all flex flex-col justify-between group min-w-0"
            >
              <div>
                {/* Header Zone: Producer & Location */}
                <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-secondary-fixed flex items-center justify-center font-bold text-label-sm">
                      {item.farmer?.full_name ? item.farmer.full_name.substring(0, 2).toUpperCase() : 'KD'}
                    </div>
                    <div>
                      <div className="text-label-md font-bold text-on-surface">
                        {item.farmer?.full_name || t('marketplace.verifiedFarmer')}
                      </div>
                      <div className="text-[11px] text-outline">
                        {item.pickup_location?.village_or_locality || 'Nashik Belt'} ({item.pickup_location?.district || 'Nashik'})
                      </div>
                    </div>
                  </div>
                  <span className="badge-verified">
                    <span className="material-symbols-outlined text-[13px] fill-current">verified</span> Grade {item.quality_grade}
                  </span>
                </div>

                {/* Produce Image */}
                <div className="relative h-44 overflow-hidden bg-surface-container">
                  <img
                    src={item.images_urls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'}
                    alt={item.crop_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-primary/80 backdrop-blur-xs text-surface-container-lowest text-[11px] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">schedule</span> Harvested Recently
                  </div>
                </div>

                {/* Data Zone */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-headline-sm font-headline-sm text-primary leading-tight line-clamp-1">
                      {item.crop_name}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
                      {item.variety || 'Certified High-Yield Table Variety'}
                    </p>
                  </div>

                  {/* Quality Assay Telemetry */}
                  <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-lg bg-surface-container-low text-label-sm">
                    <div>
                      <span className="text-outline text-[11px] block">{t('marketplace.moisture')}</span>
                      <span className="font-bold text-on-surface font-mono">
                        {item.quality_assay?.moisture_percentage ? `${item.quality_assay.moisture_percentage}%` : 'Optimal'}
                      </span>
                    </div>
                    <div>
                      <span className="text-outline text-[11px] block">Shelf Life</span>
                      <span className="font-bold text-secondary font-mono">
                        {item.shelf_life_days} Days Cold
                      </span>
                    </div>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-headline-md font-bold text-primary font-mono">
                        ₹{item.price_per_kg_expected}
                      </span>
                      <span className="text-body-sm text-outline"> / kg</span>
                    </div>
                    {item.mandi_benchmark_price && (
                      <div className="text-right">
                        <span className="text-[11px] text-outline block">{t('marketplace.mandiRate')}</span>
                        <span className="text-label-sm text-error font-mono line-through">
                          ₹{item.mandi_benchmark_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => addToCart(item, item.minimum_order_kg || 5)}
                  className="btn-primary w-full min-h-[48px] px-4 rounded-xl text-xs sm:text-label-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                  <span>{t('marketplace.addToCart')} (₹{item.price_per_kg_expected}/kg)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
