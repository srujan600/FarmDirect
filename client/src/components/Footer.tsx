import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-on-primary border-t border-primary-container">
      <div className="w-full px-gutter md:px-margin-lg py-space-xl max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-space-md">
        {/* Brand Logo & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-headline-md font-headline-md font-extrabold text-primary-fixed tracking-tight">
            AgriDirect
          </div>
          <div className="text-body-sm font-body-sm text-outline-variant text-center md:text-left max-w-lg leading-relaxed">
            © 2025 AgriDirect Infrastructure Inc. Sovereign Kisan-to-Grahak Disintermediation Grid. All rights reserved. Target Ministry: Ministry of Consumer Affairs, Food &amp; Public Distribution (DoCA).
          </div>
        </div>

        {/* Required Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-1 max-w-2xl text-label-sm">
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#marketplace">
            APMC Mandi Benchmarks
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#logistics-map">
            Cold Chain Telemetry
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#pricing-model">
            Escrow Settlement Terms
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#offline-pwa">
            PWA Offline Protocols
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#hero">
            Vernacular Dialect Audio SDK
          </a>
          <a className="inline-flex items-center min-h-[40px] py-2 text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-1" href="#provenance">
            Privacy &amp; Traceability Policy
          </a>
        </div>
      </div>
    </footer>
  );
};
