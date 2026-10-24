import React from 'react';
import { Check, Sliders } from 'lucide-react';
import type { ColorSwatch, ColorModelMode, ColorSchemeType, RegionData } from '../types/game.ts';
import { sounds } from '../services/soundEffects.ts';

interface PaletteDockProps {
  palette: ColorSwatch[];
  selectedSwatchIndex: number;
  onSelectSwatch: (index: number) => void;
  colorModel: ColorModelMode;
  onToggleModel: (model: ColorModelMode) => void;
  colorScheme: ColorSchemeType;
  onChangeScheme: (scheme: ColorSchemeType) => void;
  regions: RegionData[];
  onToggleInspector: () => void;
  isInspectorOpen: boolean;
  highlightedSwatchIndex?: number | null;
}

const SCHEMES: { id: ColorSchemeType; label: string; desc: string }[] = [
  { id: 'original', label: 'Original', desc: 'Preserves the extracted natural colours of the image.' },
  { id: 'monochromatic', label: 'Monochromatic', desc: 'One base hue with nuanced saturation and value tints.' },
  { id: 'complementary', label: 'Complementary', desc: 'Two opposite wheel hues creating bold optical contrast.' },
  { id: 'analogous', label: 'Analogous', desc: 'Three neighbouring hues creating natural harmonic warmth.' },
  { id: 'warm', label: 'Warm Spectrum', desc: 'Radiant reds, oranges, and amber yellows (Hues 330°-80°).' },
  { id: 'cool', label: 'Cool Spectrum', desc: 'Tranquil emeralds, cyans, and cobalt blues (Hues 90°-270°).' },
];

export const PaletteDock: React.FC<PaletteDockProps> = ({
  palette,
  selectedSwatchIndex,
  onSelectSwatch,
  colorModel,
  onToggleModel,
  colorScheme,
  onChangeScheme,
  regions,
  onToggleInspector,
  isInspectorOpen,
  highlightedSwatchIndex,
}) => {
  const swatchProgress = React.useMemo(() => {
    return palette.map((swatch, idx) => {
      const associatedRegions = regions.filter(r => r.targetColorIndex === idx);
      const filledCount = associatedRegions.filter(r => r.isCorrect).length;
      const total = associatedRegions.length;
      return {
        total,
        filled: filledCount,
        isComplete: total > 0 && filledCount === total,
      };
    });
  }, [palette, regions]);

  const activeSchemeObj = SCHEMES.find(s => s.id === colorScheme) || SCHEMES[0];

  return (
    <aside
      aria-label="Color Palette and Theory Controls"
      className="w-full bg-[#181715] border-t border-[#2C2924] p-3 sm:p-4 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Top Control Strip: Scheme selector & Model Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#2C2924]">
          {/* Scheme Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar" role="tablist">
            <span className="text-[11px] font-medium tracking-wide text-[#8C867B] mr-1 hidden md:inline">
              Harmonic Scheme:
            </span>
            {SCHEMES.map(s => {
              const isActive = s.id === colorScheme;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onChangeScheme(s.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2A2723] text-[#F5F2EB] border border-[#443E36] shadow-xs'
                      : 'text-[#9C9588] hover:text-[#F5F2EB] hover:bg-[#22201D]'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                  title={s.desc}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Model Switch & Auto-Pick & Inspector */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Color Model Switch */}
            <div className="flex items-center rounded-lg bg-[#141312] p-0.5 border border-[#2D2A26]">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onToggleModel('rgb');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  colorModel === 'rgb'
                    ? 'bg-[#2A2723] text-[#F5F2EB] shadow-xs'
                    : 'text-[#8C867B] hover:text-[#D6D0C2]'
                }`}
                title="Additive RGB Light Model"
              >
                RGB Light
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onToggleModel('cmyk');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  colorModel === 'cmyk'
                    ? 'bg-[#2A2723] text-[#D49A5B] shadow-xs'
                    : 'text-[#8C867B] hover:text-[#D6D0C2]'
                }`}
                title="Subtractive CMYK Pigment Model"
              >
                CMYK Ink
              </button>
            </div>

            {/* Inspector Toggle Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onToggleInspector();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isInspectorOpen
                  ? 'bg-[#2A2723] border-[#574E43] text-[#F5F2EB]'
                  : 'bg-transparent border-[#2D2A26] text-[#8C867B] hover:text-[#D6D0C2]'
              }`}
              aria-label="Toggle Color Inspector"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspect</span>
            </button>
          </div>
        </div>

        {/* Swatches Rail */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar" role="radiogroup" aria-label="Palette Swatches">
          {palette.map((swatch, idx) => {
            const isSelected = idx === selectedSwatchIndex;
            const isHoverTarget = idx === highlightedSwatchIndex;
            const progress = swatchProgress[idx] || { total: 0, filled: 0, isComplete: false };

            return (
              <button
                key={swatch.id || idx}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectSwatch(idx);
                }}
                className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#24211E] border-[#D49A5B]/80 shadow-md ring-1 ring-[#D49A5B]/30'
                    : isHoverTarget
                      ? 'bg-[#25221E] border-[#D49A5B] ring-2 ring-[#D49A5B]/50 shadow-md scale-[1.02]'
                      : 'bg-[#141312] border-[#2A2723] hover:border-[#38332B]'
                }`}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Swatch ${idx + 1}: ${swatch.name}, ${swatch.hex}`}
              >
                {/* Swatch chip */}
                <div
                  className="relative w-8 h-8 rounded-lg shadow-inner border border-white/15 shrink-0 flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: swatch.hex }}
                >
                  {progress.isComplete ? (
                    <div className="w-4 h-4 rounded-full bg-[#141312]/80 text-[#6E9484] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-black/50 text-[#F5F2EB] text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Swatch labels */}
                <div className="flex flex-col pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#F5F2EB] truncate max-w-[110px]">
                      {swatch.name}
                    </span>
                    {isHoverTarget && !isSelected && (
                      <span className="text-[9px] font-medium text-[#D49A5B] bg-[#D49A5B]/15 px-1 py-0.2 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8C867B]">
                    <span>{swatch.hex}</span>
                    {progress.total > 0 && (
                      <span className="text-[#A8A296] tabular-nums">
                        ({progress.filled}/{progress.total})
                      </span>
                    )}
                  </div>
                </div>

                {/* Keyboard Shortcut badge */}
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1C1A18] text-[#8C867B] border border-[#2D2A26]">
                  {idx + 1}
                </kbd>
              </button>
            );
          })}
        </div>

        {/* Scheme description footer */}
        <div className="text-[11px] text-[#8C867B] flex items-center justify-between">
          <span className="truncate">
            <strong className="text-[#D49A5B] font-medium">{activeSchemeObj.label}: </strong>
            {activeSchemeObj.desc}
          </span>
          <span className="text-[10px] text-[#6E685E] font-mono hidden md:inline shrink-0">
            Harmonic palette mapping · 1 click per partition
          </span>
        </div>
      </div>
    </aside>
  );
};
