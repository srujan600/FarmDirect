import React, { useState } from 'react';
import { api } from '../services/api';
import { useAgriStore } from '../context/useAgriStore';
import { useTranslation } from '../context/useTranslation';
import type { ProvenanceBatch } from '@types';

export const ProvenanceTimeline: React.FC = () => {
  const { showToast } = useAgriStore();
  const { t } = useTranslation();
  const [hashInput, setHashInput] = useState('B-NASHIK-99');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    is_valid: boolean;
    batch?: ProvenanceBatch;
    verifiedAt?: string;
  } | null>({
    is_valid: true,
    verifiedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  const handleVerify = async () => {
    if (!hashInput.trim()) {
      showToast('Please enter a batch ID or SHA-256 hash', 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.verifyProvenanceHash(hashInput.trim());
      if (res.data && res.data.is_valid) {
        setVerificationResult({
          is_valid: true,
          batch: res.data.batch,
          verifiedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
        showToast(`Cryptographic Chain Verified: ${res.data.batch?.batch_id || hashInput}`, 'success');
      } else {
        setVerificationResult({ is_valid: false });
        showToast('Verification failed: Tampered or invalid cryptographic hash', 'error');
      }
    } catch {
      setVerificationResult({ is_valid: false });
      showToast('Hash not found in central ledger', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="py-14 sm:py-16 md:py-20 lg:py-24 bg-surface-container-low px-4 sm:px-6 lg:px-8" id="provenance">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="badge-verified">
            <span className="material-symbols-outlined text-[14px] fill-current">qr_code</span> {t('provenance.badge')}
          </span>
          <h2 className="text-headline-xl font-headline-xl text-primary mt-2">
            {t('provenance.title')}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-2">
            {t('provenance.subtitle')}
          </p>

          {/* Interactive Hash Verification Input Bar */}
          <div className="mt-6 max-w-xl mx-auto bg-surface-container-lowest p-1 sm:p-1.5 rounded-2xl border border-outline-variant/70 shadow-elevation-1 flex items-center gap-1.5 sm:gap-2 min-w-0 min-h-[48px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <span className="material-symbols-outlined text-outline pl-2 sm:pl-3 text-[20px] pointer-events-none">qr_code_scanner</span>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Enter Batch ID (e.g. B-NASHIK-99) or Hash"
              className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-body-sm font-mono text-on-surface focus:outline-none placeholder:text-outline/70 min-w-0"
              aria-label="Enter Batch ID or SHA-256 Hash"
            />
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="btn-primary min-h-[40px] px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold shrink-0 shadow-xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${isVerifying ? 'animate-spin' : ''}`}>
                {isVerifying ? 'sync' : 'verified_user'}
              </span>
              <span>{isVerifying ? 'Checking...' : 'Verify Hash'}</span>
            </button>
          </div>

          {/* Live Verification Status Banner */}
          {verificationResult && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono font-bold px-2 text-center">
              {verificationResult.is_valid ? (
                <span className="text-secondary inline-flex items-center gap-1 bg-secondary-container/50 px-2.5 sm:px-3 py-1 rounded-full border border-secondary/30 flex-wrap justify-center">
                  <span className="material-symbols-outlined text-[16px] shrink-0">verified</span>
                  SHA-256 Chain Verified &bull; Tamper: PASS &bull; {verificationResult.verifiedAt}
                </span>
              ) : (
                <span className="text-error inline-flex items-center gap-1 bg-error-container/40 px-2.5 sm:px-3 py-1 rounded-full border border-error/30 flex-wrap justify-center">
                  <span className="material-symbols-outlined text-[16px] shrink-0">gpp_bad</span>
                  Chain Verification Failed &bull; Tamper Alert
                </span>
              )}
            </div>
          )}
        </div>

        {/* 5-Stage Visual Stepper Pipeline: Fluid Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative">
          {/* Step 1 */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/70 shadow-elevation-1 relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-label-md mb-3 shadow-sm">
                01
              </div>
              <div className="text-label-sm text-secondary font-bold uppercase">06:30 AM &bull; Harvest</div>
              <h4 className="text-headline-sm font-headline-sm text-primary mt-1">Farm Gate Pluck</h4>
              <p className="text-body-sm text-on-surface-variant mt-2">
                GPS logged: 19.9975° N, 73.7898° E at Dindori orchard. Digital weight recorded.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/60 text-[10px] text-outline font-mono flex items-center justify-between">
              <span>SHA-256 Link 1</span>
              <span className="text-secondary font-bold">PASS &bull; 400kg</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/70 shadow-elevation-1 relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-label-md mb-3 shadow-sm">
                02
              </div>
              <div className="text-label-sm text-secondary font-bold uppercase">08:15 AM &bull; Assay</div>
              <h4 className="text-headline-sm font-headline-sm text-primary mt-1">AI Quality QC</h4>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Multi-spectral camera scans brix, firmness, and skin blemishes. Grade-A sealed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/60 text-[10px] text-outline font-mono flex items-center justify-between">
              <span>Assay: 96.4%</span>
              <span className="text-secondary font-bold">Grade-A Sealed</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/70 shadow-elevation-1 relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-label-md mb-3 shadow-sm">
                03
              </div>
              <div className="text-label-sm text-secondary font-bold uppercase">10:00 AM &bull; Reefer</div>
              <h4 className="text-headline-sm font-headline-sm text-primary mt-1">Pre-Cool Transit</h4>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Produce cooled to 4.2°C inside EV reefer truck. Eliminates field heat degradation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/60 text-[10px] text-outline font-mono flex items-center justify-between">
              <span>Sensor: 4.2°C</span>
              <span className="text-secondary font-bold">Cold Lock OK</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/70 shadow-elevation-1 relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-label-md mb-3 shadow-sm">
                04
              </div>
              <div className="text-label-sm text-secondary font-bold uppercase">02:00 PM &bull; Sorting</div>
              <h4 className="text-headline-sm font-headline-sm text-primary mt-1">Micro-Hub QR Pack</h4>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Consolidated at urban edge hub. QR labels stamped onto breathable recycled packs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/60 text-[10px] text-outline font-mono flex items-center justify-between">
              <span>Batch #B-NASHIK-99</span>
              <span className="text-secondary font-bold">Advance 30% Sent</span>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-secondary shadow-elevation-2 relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-secondary text-surface-container-lowest flex items-center justify-center font-bold text-label-md mb-3 shadow-sm">
                05
              </div>
              <div className="text-label-sm text-secondary font-bold uppercase">&lt; 24 Hrs &bull; Delivery</div>
              <h4 className="text-headline-sm font-headline-sm text-primary mt-1">Grahak Doorstep</h4>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Delivered fresh to consumer kitchen or HoReCa kitchen. Instant UPI farmer payout triggered.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/60 text-[10px] text-secondary font-bold font-mono flex items-center justify-between">
              <span>UPI Settlement: T+0</span>
              <span className="bg-secondary-container px-1.5 py-0.5 rounded text-on-secondary-container">100% PAID</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
