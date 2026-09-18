import React from 'react';

interface HeroProps {
  onOpenSellHarvest: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenSellHarvest }) => {
  return (
    <section className="relative min-h-[720px] lg:min-h-[820px] flex items-center overflow-hidden bg-primary text-on-primary" id="hero">
      {/* Seamless Farmer Harvest Video Stream Background with Scrim */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center opacity-40 scale-105 filter saturate-125 transition-opacity duration-700"
          poster="https://lh3.googleusercontent.com/aida-public/AB6AXuBLgWlnpi9nt-CT8sJGjK5-pK48AssXxjEUjLqWRH1fO6YyLWOZPawlJB_Bp255AqMcbA0G9ztjlexrLqGTLK-4erBeCCaSah_8SWELSxluaBP3U8I2yn1Ow9Ah0zLRDzUWW5fal_AOB5490gdcnzIwC5lcVhWUs2b5B8e3ihAQdl65MMeL-NkGdP6Y_wHblUKnEU93B6LtjiYAiSFGsXMDlifIjKx6LLOwGBOeQTt0ovLBesWH09kOzA"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-through-a-crop-field-42485-large.mp4"
            type="video/mp4"
          />
        </video>
        {/* Scrim Gradients for crisp typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/40"></div>
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-gutter md:px-margin-lg py-space-xl w-full">
        <div className="max-w-3xl space-y-6">
          {/* Live Metrics Ticker Badge */}
          <div className="inline-flex max-w-full items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md border border-outline-variant/30 text-surface-container-lowest shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-pulse shrink-0"></span>
            <span className="text-[11px] sm:text-label-sm font-label-sm tracking-wide leading-snug">
              1,248 Verified Farms Connected · 14,890 Quintals Shipped
            </span>
          </div>

          {/* Headline & Subtitle */}
          <h1 className="text-3xl sm:text-4xl md:text-display-lg font-extrabold tracking-tight text-surface-container-lowest leading-tight drop-shadow-sm">
            From the Farm.<br />
            <span className="text-primary-fixed underline decoration-secondary decoration-4 underline-offset-8">
              Direct to You.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-body-xl font-body-xl text-surface-dim font-normal max-w-2xl leading-relaxed">
            A transparent marketplace connecting farmers directly with consumers and institutional buyers — delivering fairer farmer realization, fresher produce, and AI-optimized cold-chain logistics.
          </p>

          {/* Interactive CTA Cluster */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <a
              href="#marketplace"
              className="btn-secondary min-h-[48px] px-5 sm:px-6 rounded-xl text-sm sm:text-base shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Explore Fresh Harvest</span>
            </a>

            <button
              onClick={onOpenSellHarvest}
              className="btn-accent min-h-[48px] px-5 sm:px-6 rounded-xl text-sm sm:text-base shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Sell Harvest (किसान विक्री)</span>
            </button>

            <a
              href="#pricing-model"
              className="btn-ghost text-surface-container-lowest hover:bg-surface-container-lowest/15 hover:text-primary-fixed min-h-[48px] px-4 rounded-xl text-xs sm:text-label-md"
            >
              <span className="material-symbols-outlined text-[18px]">calculate</span>
              <span>Calculate Price Advantage</span>
            </a>
          </div>

          {/* Social Proof & Validation */}
          <div className="pt-6 sm:pt-8 border-t border-outline/30 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-surface-container-low">
            <div>
              <div className="text-lg sm:text-headline-sm font-bold text-surface-container-lowest">76%</div>
              <div className="text-[11px] sm:text-body-sm text-outline-variant leading-tight">Avg. Farmer Realization</div>
            </div>
            <div>
              <div className="text-lg sm:text-headline-sm font-bold text-surface-container-lowest">&lt; 24 Hrs</div>
              <div className="text-[11px] sm:text-body-sm text-outline-variant leading-tight">Harvest-to-Doorstep</div>
            </div>
            <div>
              <div className="text-lg sm:text-headline-sm font-bold text-surface-container-lowest">3.4%</div>
              <div className="text-[11px] sm:text-body-sm text-outline-variant leading-tight">Produce Transit Spoilage</div>
            </div>
            <div>
              <div className="text-lg sm:text-headline-sm font-bold text-surface-container-lowest">100% UPI</div>
              <div className="text-[11px] sm:text-body-sm text-outline-variant leading-tight">Instant T+0 Escrow</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
