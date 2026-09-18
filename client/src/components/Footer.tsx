import React from 'react';
import { useTranslation } from '../context/useTranslation';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-on-primary border-t border-primary-container">
      <div className="w-full px-gutter md:px-margin-lg py-space-xl max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-space-md">
        {/* Brand Logo & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-headline-md font-headline-md font-extrabold text-primary-fixed tracking-tight">
            {t('nav.brand')}
          </div>
          <div className="text-body-sm font-body-sm text-outline-variant text-center md:text-left max-w-lg leading-relaxed">
            {t('footer.allRightsReserved')} {t('footer.targetMinistry')}
          </div>
        </div>

        {/* Required Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-1 max-w-2xl text-label-sm">
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#marketplace">
            {t('footer.mandiBenchmarks')}
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#logistics-map">
            {t('footer.coldChainTelemetry')}
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#pricing-model">
            {t('footer.escrowSettlement')}
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#offline-pwa">
            {t('footer.pwaProtocols')}
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#hero">
            {t('footer.audioSdk')}
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#provenance">
            {t('footer.privacyTraceability')}
          </a>
        </div>
      </div>
    </footer>
  );
};
