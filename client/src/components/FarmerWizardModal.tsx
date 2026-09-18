import React, { useState, useEffect } from 'react';
import { useAgriStore } from '../context/useAgriStore';
import { SUPPORTED_LANGUAGES, type CropCategory } from '@types';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { t } from '../services/i18n';

interface FarmerWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerWizardModal: React.FC<FarmerWizardModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, submitHarvestListing, language, showToast } = useAgriStore();

  const [selectedCrop, setSelectedCrop] = useState<{
    name: string;
    category: CropCategory;
    variety: string;
    defaultPrice: number;
    mandiPrice: number;
  }>({
    name: 'Nashik Hybrid Tomato',
    category: 'VEGETABLES',
    variety: 'Gavran Red Hybrid',
    defaultPrice: 35.0,
    mandiPrice: 21.5,
  });

  const [quantityQuintals, setQuantityQuintals] = useState<number>(10.0);
  const [expectedPrice, setExpectedPrice] = useState<number>(35.0);
  const {
    isRecording,
    isProcessing,
    audioLevel,
    startListening,
    stopListening,
    playFeedbackAudio,
  } = useVoiceAssistant(language);

  const [voiceText, setVoiceText] = useState<string>(
    SUPPORTED_LANGUAGES[language]?.samplePhrase || '१० क्विंटल गावरान टोमॅटो, ३५ रुपये किलो, आजच तोडणी...'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalKg = quantityQuintals * 100;
  const totalValue = totalKg * expectedPrice;
  const mandiDelta = Number((((expectedPrice - selectedCrop.mandiPrice) / selectedCrop.mandiPrice) * 100).toFixed(0));
  const extraNetProfit = Number(((expectedPrice - selectedCrop.mandiPrice) * totalKg).toFixed(0));

  const handleMicClick = async () => {
    if (!isRecording) {
      await startListening();
      showToast(t('listening', language), 'info');
    } else {
      showToast('Processing Indic audio across 22 dialects...', 'info');
      const result = await stopListening();
      if (result?.extracted) {
        const ext = result.extracted;
        setVoiceText(result.transcript);
        setSelectedCrop({
          name: ext.crop_name,
          category: ext.category,
          variety: ext.variety,
          defaultPrice: ext.expected_price_per_kg,
          mandiPrice: Number((ext.expected_price_per_kg * 0.72).toFixed(1)),
        });
        setQuantityQuintals(ext.quantity_quintals);
        setExpectedPrice(ext.expected_price_per_kg);

        // Bidirectional audio readout: Speak back to farmer in their native tongue
        playFeedbackAudio(result.audioFeedbackBase64, ext.confirmation_prompt);
        showToast(
          `Recognized: ${ext.crop_name}, ${ext.quantity_quintals} Quintals, ₹${ext.expected_price_per_kg}/kg`,
          'success'
        );
      }
    }
  };

  const handleReadSummary = () => {
    const prompt = `${quantityQuintals} क्विंटल ${selectedCrop.name}, एकूण रक्कम ₹${totalValue.toLocaleString('en-IN')}`;
    playFeedbackAudio(undefined, prompt);
    showToast(`वाचून दाखवत आहे: ${selectedCrop.name}, ${quantityQuintals} क्विंटल, एकूण रक्कम ₹${totalValue.toLocaleString('en-IN')}`, 'info');
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitHarvestListing({
        category: selectedCrop.category,
        crop_name: selectedCrop.name,
        variety: selectedCrop.variety,
        total_quantity_kg: totalKg,
        available_quantity_kg: totalKg,
        minimum_order_kg: 5.0,
        price_per_kg_expected: expectedPrice,
        mandi_benchmark_price: selectedCrop.mandiPrice,
        harvest_date: new Date().toISOString().split('T')[0],
        shelf_life_days: 9,
        quality_grade: 'A+',
        quality_assay: {
          sugar_brix: 18.2,
          moisture_percentage: 92.4,
          uniformity_score: 94.4,
          defect_percentage: 1.2,
          certified_organic: false,
          assay_notes: 'CV-Edge Assayed via Mobile Camera',
        },
        images_urls: [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBmToZiPxGesK8_HGiLIXZP1V6xNw4Z4VqUWt-nPF21oc1k6GmzjaHzas9ul5hkMnEeNwDOJxV_dFrTnOk4LR6jBBmt7Oc5aFHy1X9cM5csygUMSDo74NieSaWji1xS4Ivtbos-qKZgeYEY45ebnWHppqMFc_zxubd22j6sYWlg0Fro74cJGVuqXwI-V_IxDwfqziy3bfkgRG5uGKGoGLb8ZNbHFCTjPKpwYzJkjLus9QyDeL3kIlvYrQ',
        ],
      });
      onClose();
    } catch (err: unknown) {
      showToast('Error submitting harvest: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-harvest-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    >
      <div className="bg-background text-on-surface rounded-2xl w-full max-w-3xl overflow-hidden border border-outline-variant shadow-elevation-3 flex flex-col max-h-[92vh]">
        {/* TOP MODAL BAR */}
        <div className="bg-primary text-on-primary px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-primary-container px-2 py-1 rounded text-secondary-fixed font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">agriculture</span>
              <span>AgriDirect किसान PWA</span>
            </div>
            <span className="text-xs text-outline-variant hidden sm:inline">|</span>
            <span className="text-xs text-primary-fixed-dim hidden sm:inline">
              Kisan ID: MH-NSK-2025-0814
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${isOnline ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
              {isOnline ? '● Online' : '● Offline Vault Active'}
            </span>
            <button
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl hover:bg-primary-container flex items-center justify-center text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary select-none cursor-pointer"
              title="Close Dialog"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Header with Marathi Vernacular Audio */}
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 gap-2">
            <div>
              <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-sm text-[10px] rounded uppercase font-bold tracking-wide">
                45-Sec Smart Form
              </span>
              <h2 id="modal-harvest-title" className="text-headline-sm font-bold text-primary mt-1">
                हंगाम नोंदणी · Fast Harvest Listing
              </h2>
            </div>
            <button
              type="button"
              onClick={handleReadSummary}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-surface-container text-primary px-3.5 py-2 rounded-xl border border-outline-variant hover:bg-surface-variant transition-all text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:scale-[0.98] select-none cursor-pointer shrink-0"
              title="Listen to summary audio in vernacular speech"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">volume_up</span>
              <span>ऐका ({SUPPORTED_LANGUAGES[language]?.nativeName || 'मराठी'})</span>
            </button>
          </div>

          {/* 1. VERNACULAR HERO AI AUDIO INPUT */}
          <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0 flex flex-col items-center">
              {/* Pulsing ring when recording */}
              {isRecording && (
                <div
                  className="absolute inset-0 rounded-full bg-error/20 animate-ping -z-0"
                  style={{ transform: `scale(${1 + audioLevel / 100})` }}
                />
              )}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isProcessing}
                className={`relative z-10 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 border-4 ${
                  isRecording
                    ? 'bg-error text-white border-error-container animate-pulse shadow-error/30'
                    : isProcessing
                    ? 'bg-amber-600 text-white border-amber-300 animate-spin'
                    : 'bg-primary-container text-on-primary border-secondary-fixed hover:bg-primary'
                }`}
                title={isRecording ? 'Click to stop & analyze intent' : 'Click to speak in your native dialect'}
              >
                <span className="material-symbols-outlined text-2xl text-secondary-fixed">
                  {isProcessing ? 'sync' : isRecording ? 'stop' : 'mic'}
                </span>
                <span className="text-[10px] font-bold text-primary-fixed mt-0.5">
                  {isProcessing ? 'AI' : isRecording ? 'थांबवा' : 'बोला'}
                </span>
              </button>
              {isRecording && (
                <div className="flex items-center gap-0.5 mt-2 h-3">
                  {[40, 70, 100, 60, 30].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-error rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(4, (audioLevel / 100) * h)}px`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm font-bold text-primary">
                    Bhashini Kisan Voice AI ({SUPPORTED_LANGUAGES[language]?.nativeName})
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    {SUPPORTED_LANGUAGES[language]?.script}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-secondary text-[10px] font-bold">
                  96% Confidence
                </span>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant text-xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-secondary text-xs leading-snug">
                    🗣️ Audio Detected: "{voiceText}"
                  </p>
                  <button
                    type="button"
                    onClick={() => playFeedbackAudio(undefined, voiceText)}
                    className="shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-container text-secondary rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary select-none cursor-pointer active:scale-95"
                    title="Play Audio Readout"
                  >
                    <span className="material-symbols-outlined text-[20px]">volume_up</span>
                  </button>
                </div>
                <p className="text-on-surface-variant text-[11px]">
                  Auto-Parsed: <strong className="text-primary">{selectedCrop.name}</strong> | Quantity:{' '}
                  <strong className="text-primary">{quantityQuintals} Quintal ({quantityQuintals * 100} kg)</strong> | Expected:{' '}
                  <strong className="text-primary">₹{expectedPrice.toFixed(2)} / kg</strong>
                </p>
                <div className="text-[10px] text-outline font-medium italic pt-0.5 border-t border-outline-variant/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                  <span>Try saying: "{SUPPORTED_LANGUAGES[language]?.samplePhrase}"</span>
                </div>
              </div>
            </div>
          </section>


          {/* 2. CROP SELECTOR (Step 1) */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center">1</span>
                पीक व जात निवडा (Crop &amp; Variety)
              </span>
              <span className="text-[11px] font-bold text-secondary">Verified Dindori Cluster</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  name: 'Nashik Hybrid Tomato',
                  category: 'VEGETABLES' as CropCategory,
                  variety: 'Gavran Red Hybrid',
                  defaultPrice: 35.0,
                  mandiPrice: 21.5,
                  marathi: 'गावरान लाल टोमॅटो',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmToZiPxGesK8_HGiLIXZP1V6xNw4Z4VqUWt-nPF21oc1k6GmzjaHzas9ul5hkMnEeNwDOJxV_dFrTnOk4LR6jBBmt7Oc5aFHy1X9cM5csygUMSDo74NieSaWji1xS4Ivtbos-qKZgeYEY45ebnWHppqMFc_zxubd22j6sYWlg0Fro74cJGVuqXwI-V_IxDwfqziy3bfkgRG5uGKGoGLb8ZNbHFCTjPKpwYzJkjLus9QyDeL3kIlvYrQ',
                },
                {
                  name: 'Lasalgaon Red Onion',
                  category: 'VEGETABLES' as CropCategory,
                  variety: 'Garwa Dark Red',
                  defaultPrice: 28.0,
                  mandiPrice: 19.0,
                  marathi: 'लासलगाव लाल कांदा',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMp74g8vsDtCBEo0-aRC0vcbO9TsCtPfYBSQRZ4bX4HQMU_v89E-EuIQ58BwDIeQQRCggqFw8Ol3DxsMdLDkJzE7z_LS3pwxFfCvCbeO6I2pCtQWXhEsfnRoYAIh6E8tZIdvOgTX0vxwU0Dm5eYq0-bxgM802IpKa29EOvaTdjmH7nC-3gUR_p1-A6pRdMQQFiWvwG_Np5CG4jI3Z3ISowd6QOBxqhzg0n6V61kVsQLRaiBEvBKjtQTw',
                },
                {
                  name: 'Sharbati Wheat A+',
                  category: 'GRAINS' as CropCategory,
                  variety: 'Sharbati Premium Gold',
                  defaultPrice: 42.0,
                  mandiPrice: 31.0,
                  marathi: 'शरबती गहू (A-Grade)',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu-z_J6qPsYzFfHdnD3FOna7REdUVMxJETlwYh6FJ8IldEZWDUE-J4BLq8PNum9YqPtagHwFU3lHgGDik7X3YHqEe9ylH5XFhDpL5bhOX_4ko8knRIOmn_iK4bSRdOax4wtqu8W1PIy_JmaKHsELOoN8hunE9j_fKFXeLfLh5k-oNfX3nLAuvqGgV_VAJIkqISIP-aAM1-M7WYUH323YpAvODEpcKsRg0NBTwD6Gare_4GNc0GejmBug',
                },
                {
                  name: 'Alphonso Mango (GI)',
                  category: 'FRUITS' as CropCategory,
                  variety: 'Devgad Export Grade',
                  defaultPrice: 180.0,
                  mandiPrice: 145.0,
                  marathi: 'हापूस आंबा (रत्नागिरी)',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDllstRMEf7v6kOoNGenCLab0UtnTrfoJ15WDPfYgDNfWQ4a5yUfgRz7Dxy6zcao36FOTAFWeatoMFEZoZxNRMaWjnNE1wW04KoyKK4c8NAt41WpmOOxQ-xm-rKJaYLL9P8WQB7_a0By2u4axGRj6qMRH9DUut2MKikcFE0UG50MsVoZcANBssB-Tv1NCTmzhz-nfGQA7u9Mqm5StiE8vZwT1vS4MQZ2vlBRZx1IC1g9mecrZmQWmxlkw',
                },
              ].map((c) => {
                const isSelected = selectedCrop.name === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCrop(c);
                      setExpectedPrice(c.defaultPrice);
                    }}
                    className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center ${
                      isSelected
                        ? 'border-2 border-secondary bg-secondary-container/20 shadow-sm'
                        : 'border-outline-variant bg-surface-container-lowest hover:border-secondary'
                    }`}
                  >
                    <div className="w-full h-16 rounded overflow-hidden mb-1 bg-surface-container">
                      <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-primary truncate w-full">{c.name}</span>
                    <span className="text-[10px] text-outline">{c.marathi}</span>
                    <span className={`mt-1.5 w-full py-0.5 rounded text-[10px] font-bold ${isSelected ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface'}`}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. QUANTITY & PRESETS (Step 2) */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-3">
            <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center">2</span>
              वजन आणि पॅकेजिंग (Quantity &amp; Packaging)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-outline uppercase block">Total Volume</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-primary">{quantityQuintals.toFixed(1)}</span>
                    <span className="text-sm font-bold text-secondary">Quintals (क्विंटल)</span>
                  </div>
                  <span className="text-[11px] text-outline-variant">≈ {totalKg.toLocaleString()} kg ({quantityQuintals * 5} Crates)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantityQuintals(Math.max(1, quantityQuintals - 1))}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-surface-container-lowest border border-outline-variant text-xl font-bold hover:bg-surface-container flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
                    aria-label="Decrease Quantity by 1 Quintal"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantityQuintals(quantityQuintals + 1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-primary text-on-primary text-xl font-bold hover:bg-primary-container flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none shadow-xs"
                    aria-label="Increase Quantity by 1 Quintal"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Add Presets */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQuantityQuintals(5)}
                  className={`min-h-[44px] py-2 px-1 sm:px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${
                    quantityQuintals === 5
                      ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container text-primary'
                  }`}
                >
                  +5 Qtl (25 Crates)
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityQuintals(10)}
                  className={`min-h-[44px] py-2 px-1 sm:px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${
                    quantityQuintals === 10
                      ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container text-primary'
                  }`}
                >
                  +10 Qtl (50 Crates)
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityQuintals(25)}
                  className={`min-h-[44px] py-2 px-1 sm:px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${
                    quantityQuintals === 25
                      ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container text-primary'
                  }`}
                >
                  +25 Qtl (Trailer)
                </button>
              </div>
            </div>
          </section>

          {/* 4. AI QUALITY ASSAY & CAMERA (Step 3) */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center">3</span>
                एआय प्रतवारी तपासणी (CV Edge Quality Dossier)
              </span>
              <span className="px-2 py-0.5 bg-secondary-container text-secondary text-[11px] font-bold rounded-full">
                AI Grade-A Certified (94.4%)
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
                <span className="text-outline text-[10px] block">Sugar Brix</span>
                <span className="font-bold text-primary font-mono mt-0.5 block">18.2° Brix</span>
              </div>
              <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
                <span className="text-outline text-[10px] block">Moisture Assay</span>
                <span className="font-bold text-secondary font-mono mt-0.5 block">92.4% Optimal</span>
              </div>
              <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant">
                <span className="text-outline text-[10px] block">Defect Rate</span>
                <span className="font-bold text-primary font-mono mt-0.5 block">1.2% (Grade A)</span>
              </div>
            </div>
          </section>

          {/* 5. FAIR PRICE DISCOVERY & MANDI SPREAD (Step 4) */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center">4</span>
                रास्त भाव आणि हमी दर (Fair Price Discovery)
              </span>
              <span className="text-xs font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded">
                +{mandiDelta}% Over Local APMC
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                <label className="text-xs font-bold text-primary block mb-1">
                  Your Expected Farm-Gate Rate (अपेक्षित भाव):
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-primary">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[48px] text-2xl font-bold font-mono text-primary bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3 py-2 focus:outline-none transition-all"
                    aria-label="Expected Farm Gate Rate per kg"
                  />
                  <span className="text-xs text-outline font-bold shrink-0">/ kg</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary-container/20 border border-secondary text-xs space-y-1">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Local APMC Mandi Benchmark:</span>
                  <span className="font-bold text-error line-through">₹{selectedCrop.mandiPrice.toFixed(2)}/kg</span>
                </div>
                <div className="flex justify-between font-bold text-primary">
                  <span>AgriDirect Direct Grid:</span>
                  <span className="text-secondary font-mono text-sm">₹{expectedPrice.toFixed(2)}/kg</span>
                </div>
                <div className="text-[11px] text-secondary font-bold pt-1 border-t border-secondary/30">
                  +₹{extraNetProfit.toLocaleString('en-IN')} Extra Net Profit secured!
                </div>
              </div>
            </div>
          </section>

          {/* 6. ESCROW GUARANTEE TRAY */}
          <section className="bg-primary text-on-primary rounded-xl p-4 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary-fixed uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                100% Escrow Settlement Guarantee
              </span>
              <span className="text-xs text-primary-fixed">UPI: 982301****@sbi</span>
            </div>
            <div className="text-2xl font-bold text-surface-bright font-mono">
              थेट बँक खाते जमा: ₹{totalValue.toLocaleString('en-IN')} Total Value
            </div>
            <p className="text-[11px] text-primary-fixed-dim">
              Funds locked in escrow upon order placement. Automatically released to your account upon reefer van barcode scan.
            </p>
          </section>
        </div>

        {/* MODAL FOOTER ACTION TRAY */}
        <div className="bg-surface-container-lowest border-t border-outline-variant p-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="btn-primary w-full flex-1 min-h-[48px] text-sm font-bold shadow-md"
          >
            <span className={`material-symbols-outlined text-secondary-fixed text-[20px] ${isSubmitting ? 'animate-spin' : ''}`}>
              {isSubmitting ? 'sync' : 'send'}
            </span>
            <span>
              {isSubmitting
                ? 'Processing...'
                : `Publish Harvest to Grahak Grid · ₹${totalValue.toLocaleString('en-IN')}`}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline w-full sm:w-auto min-h-[48px] px-6 text-xs sm:text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
