import React from 'react';
import { useAgriStore } from '../context/useAgriStore';

export const OfflineSyncConsole: React.FC = () => {
  const { isOnline, setOnlineStatus, syncLog, flushOfflineQueue } = useAgriStore();

  return (
    <section className="section-container section-padding" id="offline-pwa">
      <div className="bg-primary text-on-primary rounded-2xl p-6 md:p-10 border border-primary-container relative overflow-hidden shadow-elevation-3">
        {/* Ambient Circuit Accent */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-secondary/15 blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-6 space-y-4">
            <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary-fixed text-label-sm font-label-sm font-bold uppercase tracking-wider border border-secondary-fixed/20">
              Open Web Architecture
            </span>
            <h2 className="text-headline-xl font-headline-xl text-surface-container-lowest leading-tight">
              Engineered for Offline-First Resilience
            </h2>
            <p className="text-body-md text-surface-dim leading-relaxed">
              The AgriDirect grid operates on an edge-first philosophy. When rural telecom towers fail, our Workbox Service Worker takes over, recording weighing scales, farmer contracts, and truck manifests into browser IndexedDB.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 text-label-sm">
              <div className="p-3 rounded-xl bg-primary-container border border-outline/30">
                <span className="material-symbols-outlined text-secondary-fixed text-[20px]">storage</span>
                <div className="font-bold text-surface-container-lowest mt-1">IndexedDB Vault</div>
                <p className="text-[11px] text-outline-variant mt-0.5">
                  Encrypted client-side storage for offline crop lot manifests.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-container border border-outline/30">
                <span className="material-symbols-outlined text-secondary-fixed text-[20px]">sync</span>
                <div className="font-bold text-surface-container-lowest mt-1">BackgroundSync API</div>
                <p className="text-[11px] text-outline-variant mt-0.5">
                  Auto-replay queued mutations when telemetry senses 2G connection recovery.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Offline Simulation Box */}
          <div className="lg:col-span-6 bg-surface-container-lowest text-on-surface p-6 rounded-2xl border border-outline-variant/70 shadow-elevation-2 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">terminal</span>
                <span className="font-mono font-bold text-label-md text-primary">
                  IndexedDB Mutation Pipeline
                </span>
              </div>
              {/* Interactive Toggle Simulator */}
              <button
                onClick={() => setOnlineStatus(!isOnline)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-label-sm font-bold flex items-center gap-2 transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:scale-[0.98] ${
                  isOnline
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'bg-error-container text-on-error-container shadow-sm'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-secondary' : 'bg-error animate-ping'}`}></span>
                <span>{isOnline ? 'Status: Online (24 Mbps)' : 'Status: Offline (Simulated)'}</span>
              </button>
            </div>

            {/* Sync Console Stream */}
            <div className="bg-primary text-primary-fixed p-4 rounded-xl font-mono text-[11px] space-y-1.5 h-44 overflow-y-auto no-scrollbar border border-primary-container">
              {syncLog.map((log, idx) => (
                <div
                  key={idx}
                  className={
                    log.includes('SyncEngine')
                      ? 'text-secondary-fixed font-bold'
                      : log.includes('IndexedDB')
                      ? 'text-on-tertiary-container'
                      : 'text-surface-container-lowest'
                  }
                >
                  {log}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-label-sm text-on-surface-variant pt-1">
              <span>Client Payload: <strong>38.4 KB</strong> (Zero bloat)</span>
              <button
                onClick={() => flushOfflineQueue()}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-secondary font-bold hover:bg-secondary/10 flex items-center gap-1.5 transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Force Queue Flush</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
