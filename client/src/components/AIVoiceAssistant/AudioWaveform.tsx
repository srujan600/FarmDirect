import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  audioLevel?: number; // 0 to 100
  barCount?: number;
  className?: string;
  colorClass?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  audioLevel = 0,
  barCount = 9,
  className = '',
  colorClass = 'bg-primary',
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className={`flex items-center justify-center gap-1 h-6 ${className}`} aria-hidden="true">
      {bars.map((i) => {
        // Calculate dynamic height based on audioLevel and wave offset
        const offset = Math.sin((i / barCount) * Math.PI);
        const dynamicFactor = isActive ? Math.max(0.2, (audioLevel / 100) * offset * 1.5) : 0.15;
        const heightPx = Math.min(24, Math.max(4, Math.round(dynamicFactor * 24)));

        return (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${colorClass} ${
              isActive ? 'opacity-100' : 'opacity-40'
            }`}
            style={{
              height: `${heightPx}px`,
              transitionProperty: 'height, opacity',
            }}
          />
        );
      })}
    </div>
  );
};
