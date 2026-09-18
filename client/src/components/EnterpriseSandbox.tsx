import React, { useState } from 'react';
import { useAgriStore } from '../context/useAgriStore';
import { useTranslation } from '../context/useTranslation';

interface EnterpriseSandboxProps {
  onOpenSellHarvest: () => void;
  onOpenCart: () => void;
}

type SandboxPersonaTab = 'kisan' | 'grahak' | 'b2b' | 'fleet' | 'admin';

interface PersonaTabConfig {
  id: SandboxPersonaTab;
  label: string;
  icon: string;
}

const PERSONA_TABS: PersonaTabConfig[] = [
  { id: 'kisan', label: '1. Kisan Field', icon: 'agriculture' },
  { id: 'grahak', label: '2. Retail Grahak', icon: 'shopping_cart' },
  { id: 'b2b', label: '3. B2B HoReCa', icon: 'domain' },
  { id: 'fleet', label: '4. Logistics Fleet', icon: 'local_shipping' },
  { id: 'admin', label: '5. Mandi Admin', icon: 'admin_panel_settings' },
];

export const EnterpriseSandbox: React.FC<EnterpriseSandboxProps> = ({ onOpenSellHarvest, onOpenCart }) => {
  const { setRole, showToast } = useAgriStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SandboxPersonaTab>('kisan');

  const handleTabSwitch = (tab: SandboxPersonaTab) => {
    setActiveTab(tab);
    const roleMapping = {
      kisan: 'FARMER',
      grahak: 'RETAIL_CONSUMER',
      b2b: 'BULK_BUYER',
      fleet: 'LOGISTICS_DRIVER',
      admin: 'GOVT_ADMIN',
    } as const;
    setRole(roleMapping[tab]);
  };

  return (
    <section className="py-14 sm:py-16 md:py-20 lg:py-24 bg-surface-container-low px-4 sm:px-6 lg:px-8" id="portal-sandbox">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="badge-verified">
            <span className="material-symbols-outlined text-[14px] fill-current">grid_view</span> {t('sandbox.badge')}
          </span>
          <h2 className="text-headline-xl font-headline-xl text-primary mt-2">
            {t('sandbox.title')}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-2">
            Toggle between role perspectives to see how Kisan, Grahak, Bulk HoReCa, Logistics Fleet, and Mandi Admin coordinate on a single synchronized ledger.
          </p>
        </div>

        {/* Tab Buttons Cluster */}
        <div
          role="tablist"
          aria-label="Enterprise Persona Portals"
          className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 px-1 w-full"
        >
          {PERSONA_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => handleTabSwitch(tab.id)}
              className={`min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-label-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs sm:text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Tab Shell Preview Screen */}
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 p-4 sm:p-6 md:p-8 shadow-elevation-1 min-h-[380px] min-w-0"
        >
          {/* Tab 1: Kisan */}
          {activeTab === 'kisan' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant gap-4">
                <div>
                  <div className="text-label-sm text-secondary font-bold">Kisan Field Console · Active Account</div>
                  <h3 className="text-headline-lg font-headline-lg text-primary">
                    Namaste, Balasaheb Shinde (Dindori Cluster)
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-[#DCFCE7] text-[#14532D] text-label-sm font-bold">
                    UPI Linked: 982301****@sbi
                  </span>
                  <button
                    onClick={onOpenSellHarvest}
                    className="btn-accent min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-label-sm font-bold shadow-sm"
                  >
                    + New Harvest Entry
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-outline text-label-sm font-semibold">Settled Direct Earnings (This Month)</span>
                  <div className="text-metric-number font-bold text-primary font-mono mt-1">₹1,84,200</div>
                  <div className="text-secondary text-label-sm font-bold mt-1">▲ +₹82,400 vs Traditional APMC Mandi</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-outline text-label-sm font-semibold">Active Lots in Cold Transit</span>
                  <div className="text-metric-number font-bold text-secondary font-mono mt-1">2 Lots (85 Q)</div>
                  <div className="text-on-surface-variant text-label-sm mt-1">Reefer Truck MH-15-EG-8291 · Lock 12.4°C</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-outline text-label-sm font-semibold">Next Farm Gate Pickup Slot</span>
                  <div className="text-metric-number font-bold text-on-tertiary-container font-mono mt-1">Today 02:30 PM</div>
                  <div className="text-on-surface-variant text-label-sm mt-1">Driver: Ramesh Pawar (Verified Carrier)</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Grahak */}
          {activeTab === 'grahak' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant gap-4">
                <div>
                  <div className="text-label-sm text-secondary font-bold">Grahak Farm-to-Table Checkout</div>
                  <h3 className="text-headline-lg font-headline-lg text-primary">Your Direct Farm Cart (Fresh Today)</h3>
                </div>
                <div className="text-label-sm font-bold text-secondary bg-surface-container px-3 py-1 rounded-full">
                  Free Reefer Delivery on orders &gt; ₹299
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-outline-variant flex items-center justify-between">
                    <div>
                      <div className="font-bold text-on-surface">Nashik Grade-A Tomatoes (3 kg)</div>
                      <div className="text-[11px] text-outline">Plucked 4 hours ago · Balasaheb Shinde</div>
                    </div>
                    <div className="font-mono font-bold text-primary">₹102.00</div>
                  </div>
                  <div className="p-3 rounded-lg border border-outline-variant flex items-center justify-between">
                    <div>
                      <div className="font-bold text-on-surface">Ratnagiri Alphonso Hapus (1 Dozen)</div>
                      <div className="text-[11px] text-outline">GI Certified · Vasant Patil Orchard</div>
                    </div>
                    <div className="font-mono font-bold text-primary">₹540.00</div>
                  </div>
                </div>
                <div className="p-5 bg-surface-container-low rounded-xl border border-outline-variant space-y-3">
                  <h4 className="font-bold text-primary">Immediate Environmental Impact</h4>
                  <p className="text-body-sm text-on-surface-variant">
                    By purchasing directly through AgriDirect, you provided <strong className="text-secondary font-bold font-mono">₹482</strong> directly to the farmers' bank accounts and eliminated 3 intermediary transport hops.
                  </p>
                  <button
                    onClick={onOpenCart}
                    className="btn-secondary w-full min-h-[48px] px-4 py-3 rounded-xl font-bold text-sm shadow-md"
                  >
                    Open Farm Basket (₹642.00)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: B2B */}
          {activeTab === 'b2b' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant gap-4">
                <div>
                  <div className="text-label-sm text-secondary font-bold">Enterprise Procurement Portal</div>
                  <h3 className="text-headline-lg font-headline-lg text-primary">Taj Vivanta &amp; Cloud Kitchens Pune Hub</h3>
                </div>
                <span className="px-3 py-1 rounded bg-secondary-container text-on-secondary-container font-mono text-label-sm font-bold">
                  Corporate Credit Line: ₹25,00,000 (Active)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-outline text-label-sm">Active Forward Contracts</span>
                  <div className="text-headline-lg font-bold text-primary mt-1">4 Mega Lots</div>
                  <p className="text-[11px] text-outline mt-1">500 Quintals Onion &amp; Potato locked for Nov</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-outline text-label-sm">Quality Rejection Rate</span>
                  <div className="text-headline-lg font-bold text-secondary mt-1">0.18%</div>
                  <p className="text-[11px] text-outline mt-1">vs 6.8% legacy mandi rejection rate</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-outline text-label-sm">Automated GST Invoicing</span>
                  <div className="text-headline-lg font-bold text-primary mt-1">100% Tax Compliant</div>
                  <p className="text-[11px] text-outline mt-1">E-Way Bills &amp; FSSAI QC batch stamped</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Fleet */}
          {activeTab === 'fleet' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant gap-4">
                <div>
                  <div className="text-label-sm text-secondary font-bold">Reefer Logistics Command</div>
                  <h3 className="text-headline-lg font-headline-lg text-primary">Maharashtra Regional Dispatch Grid</h3>
                </div>
                <span className="px-3 py-1 rounded bg-surface-container text-primary font-mono text-label-sm font-bold">
                  34 Trucks Active · 0 Temp Violations
                </span>
              </div>
              <div className="p-4 bg-primary text-on-primary rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-surface-container-lowest">Fleet Health Status: All Green</div>
                  <div className="text-[12px] text-primary-fixed">
                    Average route turnaround: 3.2 hours · Fleet electrification: 68% Tata EV
                  </div>
                </div>
                <button
                  onClick={() => showToast('Dispatched hot-standby EV Reefer #MH-15-EV-9021', 'info')}
                  className="btn-secondary min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-label-sm"
                >
                  Dispatch Hot-Standby Reefer
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Admin */}
          {activeTab === 'admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant gap-4">
                <div>
                  <div className="text-label-sm text-secondary font-bold">State APMC Compliance &amp; Food-Mile Audit</div>
                  <h3 className="text-headline-lg font-headline-lg text-primary">Department of Agricultural Marketing Dashboard</h3>
                </div>
                <span className="px-3 py-1 rounded bg-[#DCFCE7] text-[#14532D] text-label-sm font-bold">
                  Audited by NABARD &amp; AGMARKNET
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <div className="text-[11px] text-outline uppercase font-bold">Gross Disintermediated GTV</div>
                  <div className="text-headline-sm font-bold text-primary font-mono mt-1">₹42.8 Cr</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <div className="text-[11px] text-outline uppercase font-bold">T+0 Farmer UPI Remitted</div>
                  <div className="text-headline-sm font-bold text-secondary font-mono mt-1">₹32.5 Cr</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <div className="text-[11px] text-outline uppercase font-bold">Food Waste Prevented</div>
                  <div className="text-headline-sm font-bold text-primary font-mono mt-1">1,940 MT</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <div className="text-[11px] text-outline uppercase font-bold">Cess &amp; Mandi Tax Replaced</div>
                  <div className="text-headline-sm font-bold text-on-tertiary-container font-mono mt-1">₹0.00 (Zero Cess)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
