import React from 'react';
import { useTranslation } from '../context/useTranslation';

export const DisintermediationGrid: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-space-xl px-gutter md:px-margin-lg max-w-7xl mx-auto" id="disintermediation">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="px-3 py-1 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm font-bold tracking-wider uppercase">
          {t('grid.badge')}
        </span>
        <h2 className="text-headline-xl font-headline-xl text-primary mt-3">
          {t('grid.title')}
        </h2>
        <p className="text-body-lg text-on-surface-variant mt-3">
          {t('grid.subtitle')}
        </p>
      </div>

      {/* Side-by-side comparative architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* A) Traditional APMC Multi-Intermediary Chain */}
        <div className="p-4 sm:p-6 md:p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col justify-between relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 px-2.5 sm:px-4 py-1 sm:py-1.5 bg-error-container text-on-error-container text-[10px] sm:text-label-sm font-bold rounded-bl-xl">
            Legacy Loss: 42%
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3 mt-4 sm:mt-0">
              <span className="material-symbols-outlined text-error text-[24px] sm:text-[28px] shrink-0">broken_image</span>
              <h3 className="text-base sm:text-headline-sm font-headline-sm text-on-surface leading-tight">
                {t('grid.traditionalMandi')}
              </h3>
            </div>
            <div className="text-xs sm:text-label-md text-outline font-semibold mb-4 sm:mb-6 leading-relaxed">
              Transit Time: 7–9 Days · 42% Spoilage · Farmer Realization: 36%
            </div>

            {/* Step-by-step pipeline */}
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-outline-variant/40">
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-outline"></span>
                <span className="text-xs sm:text-body-md font-medium text-on-surface truncate min-w-0">{t('grid.tier1')}</span>
                <span className="text-[11px] sm:text-label-sm text-outline font-mono shrink-0 whitespace-nowrap">₹18.00/kg payout</span>
              </div>
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-outline"></span>
                <span className="text-xs sm:text-body-md font-medium text-on-surface-variant truncate min-w-0">{t('grid.tier2')}</span>
                <span className="text-[11px] sm:text-label-sm text-error font-mono shrink-0 whitespace-nowrap">+₹4.50 margin</span>
              </div>
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-outline"></span>
                <span className="text-xs sm:text-body-md font-medium text-on-surface-variant truncate min-w-0">{t('grid.tier3')}</span>
                <span className="text-[11px] sm:text-label-sm text-error font-mono shrink-0 whitespace-nowrap">+₹6.00 cess</span>
              </div>
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-outline"></span>
                <span className="text-xs sm:text-body-md font-medium text-on-surface-variant truncate min-w-0">{t('grid.tier4')}</span>
                <span className="text-[11px] sm:text-label-sm text-error font-mono shrink-0 whitespace-nowrap">+₹7.50 markup</span>
              </div>
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-outline"></span>
                <span className="text-xs sm:text-body-md font-medium text-on-surface-variant truncate min-w-0">{t('grid.tier5')}</span>
                <span className="text-[11px] sm:text-label-sm text-error font-mono shrink-0 whitespace-nowrap">+₹5.00 freight</span>
              </div>
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-outline"></span>
                <span className="text-xs sm:text-body-md font-medium text-on-surface-variant truncate min-w-0">{t('grid.tier6')}</span>
                <span className="text-[11px] sm:text-label-sm text-error font-mono shrink-0 whitespace-nowrap">+₹4.00 rent</span>
              </div>
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-1.5 bg-surface-container-low p-2 rounded-lg gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-error"></span>
                <span className="text-xs sm:text-body-md font-bold text-on-surface truncate min-w-0">{t('grid.tier7')}</span>
                <span className="text-xs sm:text-label-lg font-bold text-error font-mono shrink-0 whitespace-nowrap">₹50.00 / kg</span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 text-[11px] sm:text-label-sm">
            <span className="text-error font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">trending_down</span> {t('grid.farmerRealization')}: 36%
            </span>
            <span className="text-on-surface-variant">{t('grid.logisticsWaste')}: ~420 kg / Ton</span>
          </div>
        </div>

        {/* B) AgriDirect Sovereign Disintermediation Grid */}
        <div className="p-4 sm:p-6 md:p-8 rounded-xl bg-surface-container-lowest border-2 border-secondary shadow-md flex flex-col justify-between relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 px-2.5 sm:px-4 py-1 sm:py-1.5 bg-secondary-container text-on-secondary-container text-[10px] sm:text-label-sm font-bold rounded-bl-xl">
            AgriDirect Protocol: 76% to Farmer
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3 mt-4 sm:mt-0">
              <span className="material-symbols-outlined text-secondary text-[24px] sm:text-[28px] shrink-0">verified</span>
              <h3 className="text-base sm:text-headline-sm font-headline-sm text-primary leading-tight">
                {t('grid.agriDirectGrid')}
              </h3>
            </div>
            <div className="text-xs sm:text-label-md text-secondary font-semibold mb-4 sm:mb-6 leading-relaxed">
              Transit Time: 24–36 Hours · &lt; 4% Spoilage · Farmer Realization: ₹38 on ₹50
            </div>

            {/* Direct Grid Steps */}
            <div className="space-y-3 sm:space-y-4 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-secondary">
              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-2 bg-secondary-container/20 rounded-lg border border-secondary-container gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-secondary"></span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-body-md font-bold text-primary block truncate">{t('grid.tier1')} (Direct Gate)</span>
                  <p className="text-[11px] sm:text-body-sm text-on-surface-variant truncate">AI quality test &amp; digital escrow</p>
                </div>
                <span className="text-xs sm:text-label-lg font-bold text-secondary font-mono shrink-0 whitespace-nowrap">₹38.00/kg (76%)</span>
              </div>

              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-2 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-secondary"></span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-body-md font-medium text-on-surface block truncate">IoT Cold Aggregation Hub</span>
                  <p className="text-[11px] sm:text-body-sm text-on-surface-variant truncate">Pre-cooling at 12°C &amp; barcode tagging</p>
                </div>
                <span className="text-[11px] sm:text-label-sm text-outline font-mono shrink-0 whitespace-nowrap">+₹4.50 logistics</span>
              </div>

              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-2 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-secondary"></span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-body-md font-medium text-on-surface block truncate">Route-Optimized Reefer Dispatch</span>
                  <p className="text-[11px] sm:text-body-sm text-on-surface-variant truncate">CVRPTW multi-stop eco delivery</p>
                </div>
                <span className="text-[11px] sm:text-label-sm text-outline font-mono shrink-0 whitespace-nowrap">+₹3.50 last-mile</span>
              </div>

              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-2 gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-secondary"></span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-body-md font-medium text-on-surface block truncate">Open Infrastructure Platform</span>
                  <p className="text-[11px] sm:text-body-sm text-on-surface-variant truncate">Assay QC, T+0 escrow, PWA</p>
                </div>
                <span className="text-[11px] sm:text-label-sm text-outline font-mono shrink-0 whitespace-nowrap">+₹4.00 platform</span>
              </div>

              <div className="relative pl-7 sm:pl-9 flex items-center justify-between py-2 sm:py-2.5 bg-primary text-on-primary p-2.5 sm:p-3 rounded-lg shadow-inner gap-2 min-w-0">
                <span className="absolute left-2 w-3 h-3 rounded-full bg-secondary-fixed"></span>
                <span className="text-xs sm:text-body-md font-bold text-surface-container-lowest truncate min-w-0">{t('grid.grahakPrice')}</span>
                <span className="text-xs sm:text-label-lg font-bold text-secondary-fixed font-mono shrink-0 whitespace-nowrap">₹50.00 / kg</span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 text-[11px] sm:text-label-sm">
            <span className="text-secondary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">verified</span> {t('grid.farmerRealization')}: 76%
            </span>
            <span className="text-primary font-bold">Wastage Reduced: &lt; 34 kg / Ton</span>
          </div>
        </div>
      </div>
    </section>
  );
};
