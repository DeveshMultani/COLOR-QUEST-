import React from 'react';
import { Info, X } from 'lucide-react';
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
  onClose,
}) => {
  if (!swatch) {
    return (
      <div className="bg-[#1C1A18] border border-[#2A2723] rounded-xl p-4 text-[#8C867B] text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-[#8C867B] shrink-0" />
        <span>Select any palette swatch to inspect its optical channels and coordinates.</span>
      </div>
    );
  }

  const { rgb, cmyk, hsv, isWarm, name, hex, description } = swatch;

  return (
    <div className="bg-[#1C1A18] border border-[#2A2723] rounded-2xl p-4 text-[#F5F2EB] shadow-xl relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#282521] text-[#8C867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          aria-label="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header swatch presentation */}
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className="w-12 h-12 rounded-xl shadow-inner border border-white/20 shrink-0"
          style={{ backgroundColor: hex }}
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#F5F2EB]">{name}</h3>
            <span className="text-[11px] text-[#A8A296]">
              {isWarm ? 'Warm Spectrum' : 'Cool Spectrum'}
            </span>
          </div>
          <div className="text-xs font-mono text-[#D49A5B] mt-0.5">{hex}</div>
        </div>
      </div>

      {/* Model Channel Matrices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* RGB Additive Panel */}
        <div
          className={`p-3 rounded-xl border ${
            activeModel === 'rgb'
              ? 'bg-[#22201D] border-[#443E36]'
              : 'bg-[#141312] border-[#24221E]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[#8C867B] mb-2">
            <span>Additive Light (RGB)</span>
            <span className="text-[10px] text-[#6E685E]">0-255</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#E07A5F] font-medium">Red</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#141312] rounded-full overflow-hidden border border-[#2D2A26]">
                  <div className="h-full bg-[#E07A5F]" style={{ width: `${(rgb.r / 255) * 100}%` }} />
                </div>
                <span className="tabular-nums text-[#D6D0C2] w-8 text-right">{rgb.r}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6E9484] font-medium">Green</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#141312] rounded-full overflow-hidden border border-[#2D2A26]">
                  <div className="h-full bg-[#6E9484]" style={{ width: `${(rgb.g / 255) * 100}%` }} />
                </div>
                <span className="tabular-nums text-[#D6D0C2] w-8 text-right">{rgb.g}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5B7B9A] font-medium">Blue</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#141312] rounded-full overflow-hidden border border-[#2D2A26]">
                  <div className="h-full bg-[#5B7B9A]" style={{ width: `${(rgb.b / 255) * 100}%` }} />
                </div>
                <span className="tabular-nums text-[#D6D0C2] w-8 text-right">{rgb.b}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CMYK Subtractive Panel */}
        <div
          className={`p-3 rounded-xl border ${
            activeModel === 'cmyk'
              ? 'bg-[#22201D] border-[#443E36]'
              : 'bg-[#141312] border-[#24221E]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[#8C867B] mb-2">
            <span>Subtractive Pigment (CMYK)</span>
            <span className="text-[10px] text-[#6E685E]">0-100%</span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#38BDF8]">Cyan</span>
              <span className="tabular-nums text-[#D6D0C2]">{cmyk.c}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#F472B6]">Magenta</span>
              <span className="tabular-nums text-[#D6D0C2]">{cmyk.m}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#FBBF24]">Yellow</span>
              <span className="tabular-nums text-[#D6D0C2]">{cmyk.y}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">Key (Black)</span>
              <span className="tabular-nums text-[#D6D0C2]">{cmyk.k}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* HSV Wheel Coordinate Footnote */}
      <div className="p-2.5 bg-[#141312] border border-[#24221E] rounded-xl flex items-center justify-between text-xs font-mono text-[#8C867B]">
        <span>Hue: <strong className="text-[#F5F2EB]">{Math.round(hsv.h)}°</strong></span>
        <span>Saturation: <strong className="text-[#F5F2EB]">{Math.round(hsv.s)}%</strong></span>
        <span>Brightness: <strong className="text-[#F5F2EB]">{Math.round(hsv.v)}%</strong></span>
      </div>

      {description && (
        <p className="text-xs text-[#8C867B] mt-2.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
