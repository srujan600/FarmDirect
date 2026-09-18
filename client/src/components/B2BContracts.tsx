import React from 'react';
import { useAgriStore } from '../context/useAgriStore';

export const B2BContracts: React.FC = () => {
  const { showToast } = useAgriStore();

  const handleContractReserve = (crop: string, lotId: string) => {
    showToast(`Initiated 30% advance escrow lock for ${crop} (${lotId})`, 'success');
  };

  return (
    <section className="section-container section-padding" id="b2b-contracts">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="badge-verified">
            <span className="material-symbols-outlined text-[14px] fill-current">apartment</span> Enterprise &amp; HoReCa Grid
          </span>
          <h2 className="text-headline-xl font-headline-xl text-primary mt-2">
            Institutional Procurement &amp; Forward Contracts
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Lock guaranteed supply for retail chains, hotels, and cloud kitchens with Smart Settlement Escrow and volume tier discounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant text-label-sm text-primary font-bold">
            FSSAI &amp; NPOP Certified Lots Only
          </span>
        </div>
      </div>

      {/* Data Matrix / Table Component */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/70 overflow-hidden shadow-elevation-1">
        <div className="overflow-x-auto no-scrollbar w-full">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-primary font-label-sm uppercase tracking-wider text-[11px] border-b border-outline-variant">
                <th className="py-3.5 px-4 font-bold">Produce &amp; Lot ID</th>
                <th className="py-3.5 px-4 font-bold">Certified Origin FPO</th>
                <th className="py-3.5 px-4 font-bold">Forward Window</th>
                <th className="py-3.5 px-4 font-bold">Tiered Volume Pricing</th>
                <th className="py-3.5 px-4 font-bold">Escrow Security</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 text-body-sm">
              {/* Row 1: Forward Onions */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-4">
                  <div className="font-bold text-on-surface text-label-md">Lasalgaon Grade-A Red Onions</div>
                  <div className="text-[11px] text-outline">Lot #FWD-ON-502 · 50 Quintals (5,000 kg)</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-on-surface font-medium">Nashik Sahyadri Krishi FPO</div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-secondary font-bold">
                    <span className="material-symbols-outlined text-[12px]">verified</span> KYC Verified
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-label-sm font-mono">
                    Nov 01 – Nov 15
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-label-sm">
                  <div>100-500 kg: <strong className="text-on-surface">₹28.00/kg</strong></div>
                  <div className="text-secondary font-semibold">2,000kg+: ₹22.50/kg</div>
                </td>
                <td className="py-4 px-4">
                  <span className="badge-verified">
                    <span className="material-symbols-outlined text-[13px]">lock</span> 100% Escrow
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => handleContractReserve('Lasalgaon Red Onions', 'FWD-ON-502')}
                    className="btn-primary min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm"
                  >
                    Contract Reserve
                  </button>
                </td>
              </tr>

              {/* Row 2: Forward Potatoes */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-4">
                  <div className="font-bold text-on-surface text-label-md">Malwa Chipping Potatoes (Low Sugar)</div>
                  <div className="text-[11px] text-outline">Lot #FWD-POT-118 · 120 Quintals</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-on-surface font-medium">Malwa Agro Cooperative</div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-secondary font-bold">
                    <span className="material-symbols-outlined text-[12px]">verified</span> FSSAI Standard
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-label-sm font-mono">
                    Nov 10 – Nov 25
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-label-sm">
                  <div>500-1,000 kg: <strong className="text-on-surface">₹21.00/kg</strong></div>
                  <div className="text-secondary font-semibold">5,000kg+: ₹18.20/kg</div>
                </td>
                <td className="py-4 px-4">
                  <span className="badge-verified">
                    <span className="material-symbols-outlined text-[13px]">lock</span> 100% Escrow
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => handleContractReserve('Malwa Chipping Potatoes', 'FWD-POT-118')}
                    className="btn-primary min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm"
                  >
                    Contract Reserve
                  </button>
                </td>
              </tr>

              {/* Row 3: Organic Turmeric */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-4">
                  <div className="font-bold text-on-surface text-label-md">Waigaon Turmeric (High Curcumin 6.2%)</div>
                  <div className="text-[11px] text-outline">Lot #FWD-TUR-901 · 25 Quintals</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-on-surface font-medium">Wardha Organic Producer Co.</div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#92400E] font-bold">
                    <span className="material-symbols-outlined text-[12px]">grade</span> GI Tagged Wardha
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-label-sm font-mono">
                    Dec 01 – Dec 15
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-label-sm">
                  <div>100-250 kg: <strong className="text-on-surface">₹140.00/kg</strong></div>
                  <div className="text-secondary font-semibold">1,000kg+: ₹118.00/kg</div>
                </td>
                <td className="py-4 px-4">
                  <span className="badge-verified">
                    <span className="material-symbols-outlined text-[13px]">lock</span> 100% Escrow
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => handleContractReserve('Waigaon Turmeric', 'FWD-TUR-901')}
                    className="btn-primary min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm"
                  >
                    Contract Reserve
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
