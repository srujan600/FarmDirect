import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { PriceBreakdown } from '@types';

export const PricingCalculator: React.FC = () => {
  const [sliderPrice, setSliderPrice] = useState<number>(50);
  const [breakdown, setBreakdown] = useState<PriceBreakdown>({
    farmer_unit_price: 38.0,
    logistics_fee_per_kg: 8.0,
    platform_fee_per_kg: 4.0,
    consumer_unit_price: 50.0,
    quantity_kg: 1.0,
    farmer_payout_total: 38.0,
    logistics_fee_total: 8.0,
    platform_fee_total: 4.0,
    consumer_total: 50.0,
    savings_vs_mandi_percentage: 33,
  });

  useEffect(() => {
    // Call real backend API calculation engine
    const farmerEquivalent = Number((sliderPrice * 0.76).toFixed(2));
    api.calculatePriceBreakdown(farmerEquivalent, 1)
      .then((res) => {
        if (res.data) {
          setBreakdown(res.data);
        }
      })
      .catch(() => {
        // Local calculation fallback matching exact formula
        const farmer = Number((sliderPrice * 0.76).toFixed(2));
        const logistics = Number((sliderPrice * 0.16).toFixed(2));
        const platform = Number((sliderPrice - farmer - logistics).toFixed(2));
        setBreakdown({
          farmer_unit_price: farmer,
          logistics_fee_per_kg: logistics,
          platform_fee_per_kg: platform,
          consumer_unit_price: sliderPrice,
          quantity_kg: 1,
          farmer_payout_total: farmer,
          logistics_fee_total: logistics,
          platform_fee_total: platform,
          consumer_total: sliderPrice,
          savings_vs_mandi_percentage: 33,
        });
      });
  }, [sliderPrice]);

  return (
    <section className="py-14 sm:py-16 md:py-20 lg:py-24 bg-surface-container-low px-4 sm:px-6 lg:px-8" id="pricing-model">
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-4 sm:p-6 md:p-10 shadow-elevation-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left info & Interactive breakdown */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6 min-w-0">
              <div>
                <span className="badge-verified">
                  <span className="material-symbols-outlined text-[14px] fill-current">verified</span> 100% Ledger Transparency
                </span>
                <h2 className="text-xl sm:text-2xl md:text-headline-lg font-headline-lg text-primary mt-3 leading-tight">
                  Where Does Every Rupee Actually Go?
                </h2>
                <p className="text-xs sm:text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Use the interactive breakdown below to analyze a standardized ₹{sliderPrice.toFixed(2)}/kg basket of premium Maharashtra grade-A produce.
                </p>
              </div>

              {/* Dynamic Interactive Range Slider */}
              <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-variant space-y-3.5">
                <div className="flex justify-between items-center gap-2">
                  <label className="text-xs sm:text-label-md font-bold text-primary truncate" htmlFor="price-slider">
                    Simulated Consumer Price:
                  </label>
                  <span className="text-base sm:text-headline-sm font-bold text-secondary font-mono shrink-0">
                    ₹{sliderPrice.toFixed(2)} / kg
                  </span>
                </div>
                <input
                  id="price-slider"
                  type="range"
                  min="30"
                  max="120"
                  step="5"
                  value={sliderPrice}
                  onChange={(e) => setSliderPrice(parseFloat(e.target.value))}
                  className="w-full min-h-[44px] h-11 py-3 cursor-pointer accent-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 rounded-lg"
                  aria-label="Simulated Consumer Price in Rupees per Kilogram"
                />
                <div className="flex justify-between items-center gap-2 pt-1">
                  {[
                    { label: '₹30 Staples', val: 30 },
                    { label: '₹75 Exotics', val: 75 },
                    { label: '₹120 Organic GI', val: 120 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setSliderPrice(preset.val)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        sliderPrice === preset.val
                          ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-secondary hover:text-primary'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Metrics Tiles: Responsive 1 col on mobile, 3 cols on tablet+ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center">
                <div className="p-3 bg-secondary-container/30 border border-secondary-container rounded-lg">
                  <div className="text-xs sm:text-label-sm text-secondary font-semibold">Farmer Realization</div>
                  <div className="text-lg sm:text-headline-sm font-bold text-primary font-mono mt-0.5 sm:mt-1">
                    ₹{breakdown.farmer_unit_price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-medium">76.0% direct share</div>
                </div>
                <div className="p-3 bg-surface-container border border-outline-variant rounded-lg">
                  <div className="text-xs sm:text-label-sm text-on-surface-variant font-semibold">Cold Logistics</div>
                  <div className="text-lg sm:text-headline-sm font-bold text-on-surface font-mono mt-0.5 sm:mt-1">
                    ₹{breakdown.logistics_fee_per_kg.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-outline font-medium">16.0% IoT reefer</div>
                </div>
                <div className="p-3 bg-surface-container border border-outline-variant rounded-lg">
                  <div className="text-xs sm:text-label-sm text-on-surface-variant font-semibold">Assay &amp; Escrow</div>
                  <div className="text-lg sm:text-headline-sm font-bold text-on-surface font-mono mt-0.5 sm:mt-1">
                    ₹{breakdown.platform_fee_per_kg.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-outline font-medium">8.0% lab testing</div>
                </div>
              </div>
            </div>

            {/* Right: Visual Comparative Segmented Bar Chart */}
            <div className="lg:col-span-6 bg-surface-container-low p-4 sm:p-6 md:p-8 rounded-xl border border-outline-variant space-y-5 sm:space-y-6 min-w-0">
              <h3 className="text-base sm:text-headline-sm font-headline-sm text-primary flex flex-wrap items-center justify-between gap-2">
                <span>Capital Flow Comparison</span>
                <span className="text-[11px] sm:text-label-sm text-secondary bg-surface-container-lowest px-2.5 py-0.5 sm:py-1 rounded-full border border-secondary/30 font-mono">
                  Live Disintermediation Delta
                </span>
              </h3>

              {/* AgriDirect Distribution Bar */}
              <div>
                <div className="flex justify-between text-xs sm:text-label-sm font-bold mb-1.5 gap-2">
                  <span className="text-secondary flex items-center gap-1 truncate">
                    <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span> AgriDirect Distribution
                  </span>
                  <span className="text-primary font-mono shrink-0">₹{sliderPrice.toFixed(2)} Total</span>
                </div>
                <div className="h-7 sm:h-8 rounded-lg overflow-hidden flex text-[10px] sm:text-label-sm font-bold text-surface-container-lowest text-center leading-7 sm:leading-8 shadow-inner">
                  <div className="bg-secondary w-[76%] transition-all duration-300 truncate px-1">
                    ₹{breakdown.farmer_unit_price.toFixed(0)} (76%) Farmer
                  </div>
                  <div className="bg-primary-container w-[16%] transition-all duration-300 truncate px-1">
                    16% Cold
                  </div>
                  <div className="bg-tertiary-container w-[8%] transition-all duration-300 truncate px-0.5">
                    8%
                  </div>
                </div>
                <div className="flex flex-wrap justify-between text-[10px] sm:text-[11px] text-on-surface-variant mt-1 gap-1">
                  <span>Green: Kisan Direct (76%)</span>
                  <span>Dark: Reefer Fleet (16%)</span>
                  <span>Amber: Tech (8%)</span>
                </div>
              </div>

              {/* Traditional APMC Bar */}
              <div>
                <div className="flex justify-between text-xs sm:text-label-sm font-bold mb-1.5 gap-2">
                  <span className="text-error flex items-center gap-1 truncate">
                    <span className="material-symbols-outlined text-[16px] shrink-0">cancel</span> Traditional APMC Mandi
                  </span>
                  <span className="text-outline font-mono shrink-0">₹{sliderPrice.toFixed(2)} Total</span>
                </div>
                <div className="h-7 sm:h-8 rounded-lg overflow-hidden flex text-[10px] sm:text-label-sm font-bold text-surface-container-lowest text-center leading-7 sm:leading-8 shadow-inner">
                  <div className="bg-outline w-[36%] transition-all duration-300 truncate px-1">
                    36% Kisan
                  </div>
                  <div className="bg-error/80 w-[44%] transition-all duration-300 truncate px-1">
                    44% Middlemen
                  </div>
                  <div className="bg-outline-variant w-[20%] transition-all duration-300 text-on-surface truncate px-1">
                    20% Rot
                  </div>
                </div>
                <div className="flex flex-wrap justify-between text-[10px] sm:text-[11px] text-outline mt-1 gap-1">
                  <span>Grey: Farmer Payout (36%)</span>
                  <span className="text-error">Red: Middlemen (44%)</span>
                  <span>Light: Waste (20%)</span>
                </div>
              </div>

              {/* Real-time Impact Metric Highlight */}
              <div className="p-4 rounded-lg bg-surface-container-lowest border-l-4 border-secondary shadow-xs">
                <div className="text-label-md font-bold text-secondary">Validated Impact Assertion:</div>
                <div className="text-body-md text-on-surface font-semibold mt-0.5">
                  Net Farmer Income Boost:{' '}
                  <strong className="text-secondary font-bold font-mono">+111%</strong> | Consumer Price Savings:{' '}
                  <strong className="text-primary font-bold font-mono">14% - 33% Cheaper</strong> than big-box retail.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
