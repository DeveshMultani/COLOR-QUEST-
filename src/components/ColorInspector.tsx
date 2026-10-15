import React from 'react';
import { Info, Sparkles, Sun, Droplets, HelpCircle, X } from 'lucide-react';
import type { ColorSwatch, ColorModelMode, ColorSchemeType } from '../types/game.ts';

interface ColorInspectorProps {
  swatch: ColorSwatch | null;
  activeModel: ColorModelMode;
  activeScheme: ColorSchemeType;
  onClose?: () => void;
  isCompact?: boolean;
}

export const ColorInspector: React.FC<ColorInspectorProps> = ({
  swatch,
  activeModel,
  activeScheme,
  onClose,
  isCompact = false,
}) => {
  if (!swatch) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-400 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Select or hover over any palette swatch to inspect its optical properties.</span>
      </div>
    );
  }

  const { rgb, cmyk, hsv, isWarm, name, hex, description } = swatch;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 shadow-xl relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          aria-label="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header swatch presentation */}
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className="w-12 h-12 rounded-xl shadow-inner border border-white/20 shrink-0 ring-2 ring-black/40"
          style={{ backgroundColor: hex }}
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">{name}</h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isWarm
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {isWarm ? 'Warm Tone' : 'Cool Tone'}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">{hex}</div>
        </div>
      </div>

      {/* Model Channel Matrices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* RGB Additive Panel */}
        <div
          className={`p-3 rounded-xl border ${
            activeModel === 'rgb'
              ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/30'
              : 'bg-slate-950/50 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-blue-400 mb-2">
            <span>Additive Light (RGB)</span>
            <span className="text-[10px] text-slate-400">Emitted</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-semibold">Red</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(rgb.r / 255) * 100}%` }} />
                </div>
                <span className="tabular-nums text-slate-300 w-8 text-right">{rgb.r}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-semibold">Green</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(rgb.g / 255) * 100}%` }} />
                </div>
                <span className="tabular-nums text-slate-300 w-8 text-right">{rgb.g}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-semibold">Blue</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(rgb.b / 255) * 100}%` }} />
                </div>
                <span className="tabular-nums text-slate-300 w-8 text-right">{rgb.b}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CMYK Subtractive Panel */}
        <div
          className={`p-3 rounded-xl border ${
            activeModel === 'cmyk'
              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
              : 'bg-slate-950/50 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-2">
            <span>Subtractive Pigment (CMYK)</span>
            <span className="text-[10px] text-slate-400">Absorbed</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-semibold">Cyan</span>
              <span className="tabular-nums text-slate-300">{cmyk.c}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pink-400 font-semibold">Magenta</span>
              <span className="tabular-nums text-slate-300">{cmyk.m}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 font-semibold">Yellow</span>
              <span className="tabular-nums text-slate-300">{cmyk.y}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Key/Black</span>
              <span className="tabular-nums text-slate-300">{cmyk.k}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* HSV Coordinates breakdown */}
      <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl mb-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-purple-400 mb-2">
          <span>HSV Cylindrical Coordinates</span>
          <span className="text-[10px] text-slate-400">Geometry</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Hue</div>
            <div className="text-xs font-bold text-purple-300">{hsv.h}°</div>
          </div>
          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Saturation</div>
            <div className="text-xs font-bold text-purple-300">{hsv.s}%</div>
          </div>
          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Value / Light</div>
            <div className="text-xs font-bold text-purple-300">{hsv.v}%</div>
          </div>
        </div>
      </div>

      {/* Educational Note */}
      <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <span className="font-semibold text-slate-300">Theory Note: </span>
        HSV is a cylindrical transformation of RGB coordinates designed for human perception, not a separate physical color-mixing model.
      </div>
    </div>
  );
};
