import React, { useState } from 'react';
import { X, BookOpen, Sun, Droplets, Compass } from 'lucide-react';
import { sounds } from '../services/soundEffects.ts';

interface ColorTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorTheoryModal: React.FC<ColorTheoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'schemes' | 'rules'>('models');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theory-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-[#1C1A18] border border-[#38332B] rounded-2xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col text-[#F5F2EB]">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-[#282521] text-[#8C867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          aria-label="Close theory guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-[#D49A5B]" />
          <h2 id="theory-modal-title" className="font-editorial text-lg font-bold text-[#F5F2EB]">
            Color Theory Field Guide
          </h2>
        </div>
        <p className="text-xs text-[#8C867B] mb-5">
          Optical foundations of additive light, subtractive pigments, and harmonic intervals.
        </p>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2C2924] mb-5 gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('models');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'border-[#D49A5B] text-[#D49A5B]'
                : 'border-transparent text-[#8C867B] hover:text-[#D6D0C2]'
            }`}
          >
            Light vs. Pigment
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('schemes');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'schemes'
                ? 'border-[#D49A5B] text-[#D49A5B]'
                : 'border-transparent text-[#8C867B] hover:text-[#D6D0C2]'
            }`}
          >
            Harmonic Schemes
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('rules');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-[#D49A5B] text-[#D49A5B]'
                : 'border-transparent text-[#8C867B] hover:text-[#D6D0C2]'
            }`}
          >
            Rules & Mechanics
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs leading-relaxed text-[#D6D0C2]">
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141312] border border-[#262420]">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F2EB] mb-2">
                  <Sun className="w-4 h-4 text-[#D49A5B]" />
                  <span>Additive Color Model (RGB Light)</span>
                </div>
                <p className="mb-2">
                  Used by screens, projectors, and digital cameras. In this model, light waves are superimposed.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#A8A296]">
                  <li><strong>Primaries:</strong> Red, Green, Blue.</li>
                  <li><strong>Convergence:</strong> Red + Green + Blue at maximum intensity (255, 255, 255) creates pure white light.</li>
                  <li><strong>Absence:</strong> Zero intensity (0, 0, 0) yields absolute darkness / black.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#141312] border border-[#262420]">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F2EB] mb-2">
                  <Droplets className="w-4 h-4 text-[#5B7B9A]" />
                  <span>Subtractive Color Model (CMYK Pigment)</span>
                </div>
                <p className="mb-2">
                  Used by printmaking, inks, dyes, and painter's oil pigments. Pigments absorb certain wavelengths of ambient light while reflecting others.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#A8A296]">
                  <li><strong>Primaries:</strong> Cyan, Magenta, Yellow, plus Key (Black).</li>
                  <li><strong>Convergence:</strong> Mixing all inks subtracts wavelengths, creating rich black.</li>
                  <li><strong>Substrate:</strong> Clean white paper provides the base luminance.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'schemes' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420]">
                <h4 className="font-semibold text-sm text-[#F5F2EB] mb-1">Monochromatic</h4>
                <p className="text-[#A8A296]">
                  Variations of a single root hue with differing saturation and brightness values. Delivers serene, cohesive, unified atmosphere.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420]">
                <h4 className="font-semibold text-sm text-[#F5F2EB] mb-1">Complementary Contrast</h4>
                <p className="text-[#A8A296]">
                  Pairs hues located exactly opposite each other on the color wheel (180° apart, like Amber and Ultramarine). Creates maximum visual vibration.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420]">
                <h4 className="font-semibold text-sm text-[#F5F2EB] mb-1">Analogous Harmony</h4>
                <p className="text-[#A8A296]">
                  Adjacent hues situated within 30° to 60° of one another on the wheel. Mimics organic lighting and natural transitions found in flora.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420]">
                <h4 className="font-semibold text-sm text-[#F5F2EB] mb-1">Thermal Spectrums (Warm vs. Cool)</h4>
                <p className="text-[#A8A296]">
                  Warm tones (330° to 80°: Vermilion, Terracotta, Ochre) evoke sunlight and passion. Cool tones (90° to 270°: Celadon, Cyan, Indigo) evoke water and quiet shadow.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420]">
                <h4 className="font-semibold text-sm text-[#F5F2EB] mb-1">Scoring & Multipliers</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[#A8A296]">
                  <li><strong>Exact Harmonic Match:</strong> +100 points.</li>
                  <li><strong>Compatible Scheme Alternative:</strong> +40 points (awarded when using an adjacent harmonious tone).</li>
                  <li><strong>Hint Clue:</strong> -25 points.</li>
                  <li><strong>Masterpiece Completion Bonus:</strong> +500 points (+1,000 flawless run bonus).</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141312] border border-[#262420]">
                <h4 className="font-semibold text-sm text-[#F5F2EB] mb-1">Smart Fill & Touch Accuracy</h4>
                <p className="text-[#A8A296]">
                  Tap any number badge directly on the canvas to fill it with pinpoint accuracy. On mobile, multi-touch is reserved for fluid pan and pinch-zoom without accidental misfires.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
