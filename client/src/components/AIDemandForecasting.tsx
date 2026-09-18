import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTranslation } from '../context/useTranslation';

export const AIDemandForecasting: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState<'Tomato' | 'Onion' | 'Alphonso Mango'>('Tomato');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Nashik');
  const [loading, setLoading] = useState<boolean>(false);

  // Time series state with rich initial values matching Stitch
  const [timeSeries, setTimeSeries] = useState([
    { date: '10 Oct', arrival: '40%', demand: '52%', surge: false, label: '' },
    { date: '12 Oct', arrival: '48%', demand: '65%', surge: false, label: '' },
    { date: '14 Oct', arrival: '55%', demand: '88%', surge: true, label: 'Surge +34%' },
    { date: '16 Oct', arrival: '70%', demand: '92%', surge: false, label: '' },
    { date: '18 Oct', arrival: '60%', demand: '75%', surge: false, label: '' },
    { date: '20 Oct', arrival: '45%', demand: '58%', surge: false, label: '' },
  ]);

  const [advisory, setAdvisory] = useState<{
    optimal_harvest_window: string;
    recommendation: string;
    deficit_alert: boolean;
    deficit_surge_percentage?: number;
  }>({
    optimal_harvest_window: '14 Oct – 17 Oct',
    recommendation: 'Harvest before Thursday for +18% realization.',
    deficit_alert: true,
    deficit_surge_percentage: 34,
  });

  const [telemetry, setTelemetry] = useState({
    temperature_celsius: 28,
    condition: 'Partly Cloudy',
    relative_humidity_pct: 68,
    soil_moisture_index: 0.42,
    precipitation_forecast_summary: '0.0 mm (72h Clear)',
    precool_storage_celsius: 14,
  });

  // Fetch forecast and telemetry from server
  useEffect(() => {
    let isMounted = true;
    async function loadForecast() {
      setLoading(true);
      try {
        const [forecastRes, telemetryRes] = await Promise.allSettled([
          api.getForecast(selectedCrop, selectedDistrict),
          api.getTelemetry(selectedDistrict),
        ]);

        if (!isMounted) return;

        if (forecastRes.status === 'fulfilled' && forecastRes.value?.data) {
          const { time_series, advisory: adv } = forecastRes.value.data;
          setTimeSeries(
            time_series.map((pt) => ({
              date: pt.date,
              arrival: pt.arrival_pct,
              demand: pt.demand_pct,
              surge: pt.surge,
              label: pt.label || '',
            }))
          );
          setAdvisory(adv);
        }

        if (telemetryRes.status === 'fulfilled' && telemetryRes.value?.data) {
          const t = telemetryRes.value.data;
          setTelemetry({
            temperature_celsius: t.temperature_celsius,
            condition: t.condition,
            relative_humidity_pct: t.relative_humidity_pct,
            soil_moisture_index: t.soil_moisture_index,
            precipitation_forecast_summary: t.precipitation_forecast_summary,
            precool_storage_celsius: t.precool_storage_celsius,
          });
        }
      } catch (err) {
        console.warn('Using local forecast model cache:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadForecast();
    return () => {
      isMounted = false;
    };
  }, [selectedCrop, selectedDistrict]);

  return (
    <section className="section-container section-padding" id="demand-forecast">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="px-3 py-1 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm font-bold uppercase tracking-wider">
          {t('forecast.badge')}
        </span>
        <h2 className="text-headline-xl font-headline-xl text-primary mt-2">
          {t('forecast.title')}
        </h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          {t('forecast.subtitle')}
        </p>

        {/* Commodity and District Quick Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-5">
          {(['Tomato', 'Onion', 'Alphonso Mango'] as const).map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-label-sm font-bold transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] ${
                selectedCrop === crop
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container'
              }`}
            >
              {crop}
            </button>
          ))}
          <span className="text-outline/40 mx-1 hidden sm:inline">|</span>
          {(['Nashik', 'Lasalgaon', 'Pune'] as const).map((dist) => (
            <button
              key={dist}
              onClick={() => setSelectedDistrict(dist)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-label-sm font-bold transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:scale-[0.98] ${
                selectedDistrict === dist
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container'
              }`}
            >
              {dist} Hub
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bento 1: 30-Day Demand vs Supply Predictive Curve (8 Cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-5 sm:p-7 rounded-2xl border border-outline-variant/70 shadow-elevation-1 flex flex-col justify-between relative min-w-0">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs rounded-xl flex items-center justify-center z-20">
              <span className="text-xs font-bold text-primary animate-pulse">Running Neural Forecast Model...</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-headline-sm font-headline-sm text-primary">
                  {selectedCrop} Regional Supply Equilibrium
                </h3>
                <p className="text-xs sm:text-body-sm text-outline">
                  {selectedDistrict} Agro-Cluster &bull; Western Maharashtra Corridor
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-label-sm">
                <span className="inline-flex items-center gap-1.5 font-bold text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Projected Demand
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-outline">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline"></span> Mandi Arrival
                </span>
              </div>
            </div>

            {/* Stylized Predictive Curve Bar Chart with Responsive Overflow Container */}
            <div className="overflow-x-auto no-scrollbar w-full">
              <div className="h-56 min-w-[280px] w-full relative flex items-end justify-between pt-6 px-1 sm:px-2 border-b border-l border-outline-variant">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-outline w-full"></div>
                  <div className="border-b border-outline w-full"></div>
                  <div className="border-b border-outline w-full"></div>
                  <div className="border-b border-outline w-full"></div>
                </div>

                {timeSeries.map((point) => (
                  <div key={point.date} className="flex-1 min-w-[36px] max-w-[56px] flex flex-col items-center gap-1 h-full justify-end z-10 relative">
                    {point.surge && point.label && (
                      <span className="absolute -top-4 px-1.5 py-0.5 rounded bg-on-tertiary-container text-surface-container-lowest text-[9px] font-bold whitespace-nowrap shadow-xs">
                        {point.label}
                      </span>
                    )}
                    <div
                      style={{ height: point.arrival }}
                      className="w-3.5 sm:w-4 bg-outline-variant/60 rounded-t transition-all duration-500"
                    ></div>
                    <div
                      style={{ height: point.demand }}
                      className="w-3.5 sm:w-4 bg-secondary rounded-t -mt-4 opacity-90 shadow-xs transition-all duration-500"
                    ></div>
                    <span className="text-[10px] font-mono mt-2 text-primary font-bold">{point.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Callout Footer */}
          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex flex-wrap items-center justify-between text-xs sm:text-label-sm gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-secondary font-bold">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">verified</span>
              <span>Optimal Harvest Window: {advisory.optimal_harvest_window}</span>
            </div>
            <span className="text-on-surface-variant">{advisory.recommendation}</span>
          </div>
        </div>

        {/* Bento 2: Early Warning & Weather Telemetry (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          {/* Deficit Alert Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border-l-4 border-on-tertiary-container border-y border-r border-outline-variant/70 shadow-elevation-1 space-y-2">
            <div className="flex items-center gap-2 text-on-tertiary-container font-bold text-label-md">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span>{advisory.deficit_alert ? `High Deficit Alert: ${selectedDistrict} Hub` : `Normal Flow: ${selectedDistrict} Hub`}</span>
            </div>
            <p className="text-body-sm text-on-surface">
              {advisory.deficit_surge_percentage ? (
                <>Expected urban demand surge of <strong className="text-primary font-bold">+{advisory.deficit_surge_percentage}%</strong> in the next 48 hours.</>
              ) : (
                <>Balanced wholesale distribution. Arrival meets terminal consumption rates.</>
              )}
            </p>
            <div className="text-label-sm text-secondary font-bold pt-1 flex items-center gap-1">
              <span>FPO Dispatch Orders Auto-Priority: ENABLED</span>
            </div>
          </div>

          {/* Weather Telemetry Widget */}
          <div className="bg-primary text-on-primary p-6 rounded-2xl space-y-4 shadow-elevation-2">
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-primary-fixed uppercase tracking-wider font-bold">
                Micro-Climate Telemetry
              </span>
              <span className="material-symbols-outlined text-secondary-fixed">wb_cloudy</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-metric-number font-metric-number font-bold text-surface-container-lowest">
                {telemetry.temperature_celsius}°C
              </span>
              <span className="text-body-sm text-primary-fixed">{selectedDistrict} Agro Belt</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-label-sm pt-2 border-t border-primary-container">
              <div>
                <span className="text-outline-variant text-[11px] block">Relative Humidity</span>
                <span className="font-bold text-surface-container-lowest font-mono">{telemetry.relative_humidity_pct}% (Ideal)</span>
              </div>
              <div>
                <span className="text-outline-variant text-[11px] block">Soil Moisture Index</span>
                <span className="font-bold text-secondary-fixed font-mono">{telemetry.soil_moisture_index} m³/m³</span>
              </div>
              <div>
                <span className="text-outline-variant text-[11px] block">Precipitation Radar</span>
                <span className="font-bold text-surface-container-lowest font-mono">{telemetry.precipitation_forecast_summary}</span>
              </div>
              <div>
                <span className="text-outline-variant text-[11px] block">Pre-Cool Storage</span>
                <span className="font-bold text-secondary-fixed font-mono">{telemetry.precool_storage_celsius}°C Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
