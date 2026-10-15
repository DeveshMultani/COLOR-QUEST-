import React from 'react';
import { Eye, Check, Sparkles, Layers, Sliders } from 'lucide-react';
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
}) => {
  // Compute how many regions are left for each color index
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
      className="w-full bg-slate-900/95 border-t border-slate-800 p-3 sm:p-4 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Control Strip: Scheme selector & Model Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
          {/* Scheme Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar" role="tablist">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1.5 hidden md:inline">
              Scheme:
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300'
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

          {/* Color Model & Inspector Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Color Model Switch */}
            <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onToggleModel('rgb');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  colorModel === 'rgb'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
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
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  colorModel === 'cmyk'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isInspectorOpen
                  ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              aria-label="Toggle Color Inspector"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspect Swatch</span>
            </button>
          </div>
        </div>

        {/* Swatches Rail */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar" role="radiogroup" aria-label="Palette Swatches">
          {palette.map((swatch, idx) => {
            const isSelected = idx === selectedSwatchIndex;
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
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Swatch ${idx + 1}: ${swatch.name}, ${swatch.hex}`}
              >
                {/* Swatch circle with checkmark or number */}
                <div
                  className="relative w-8 h-8 rounded-lg shadow-inner border border-white/20 shrink-0 flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: swatch.hex }}
                >
                  {progress.isComplete ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Swatch labels */}
                <div className="flex flex-col pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                      {swatch.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span>{swatch.hex}</span>
                    {progress.total > 0 && (
                      <span className="text-slate-400 tabular-nums">
                        ({progress.filled}/{progress.total})
                      </span>
                    )}
                  </div>
                </div>

                {/* Keyboard Shortcut badge */}
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                  {idx + 1}
                </kbd>
              </button>
            );
          })}
        </div>

        {/* Scheme Educational Clarification line */}
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate">
            <strong className="text-amber-400 font-medium">{activeSchemeObj.label}: </strong>
            {activeSchemeObj.desc}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline shrink-0">
            Screen uses Additive RGB to display simulated Subtractive CMYK gamuts.
          </span>
        </div>
      </div>
    </aside>
  );
};
