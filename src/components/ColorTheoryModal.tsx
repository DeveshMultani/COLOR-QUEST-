import React, { useState } from 'react';
import { X, BookOpen, Sun, Droplets, Compass, Award, HelpCircle } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          aria-label="Close theory guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 id="theory-modal-title" className="text-lg font-bold text-slate-100">
            Color Theory Field Guide
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Master the optical principles of additive light, subtractive pigments, and chromatic harmonies.
        </p>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-4 gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('models');
            }}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            RGB vs CMYK Models
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('schemes');
            }}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'schemes'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            The 5 Harmonic Schemes
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('rules');
            }}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Scoring & Rules
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'models' && (
            <>
              {/* Additive RGB */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40">
                <div className="flex items-center gap-2 mb-2 font-bold text-blue-400 text-sm">
                  <Sun className="w-4 h-4" />
                  <span>Additive RGB (Light Emission)</span>
                </div>
                <p className="mb-2 text-slate-300">
                  Used by screens, monitors, and stage lighting. Begins with a black void and superimposes wavelengths of
                  <strong> Red, Green, and Blue light</strong>. Adding colors increases luminosity, combining toward pure White (255, 255, 255).
                </p>
                <div className="flex gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50">Red (700nm)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">Green (530nm)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">Blue (450nm)</span>
                </div>
              </div>

              {/* Subtractive CMYK */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40">
                <div className="flex items-center gap-2 mb-2 font-bold text-amber-400 text-sm">
                  <Droplets className="w-4 h-4" />
                  <span>Subtractive CMYK (Ink & Pigment Absorption)</span>
                </div>
                <p className="mb-2 text-slate-300">
                  Used by physical print presses, fine art paints, and color printers. Begins with reflective white paper. Inks absorb (subtract) specific light wavelengths.
                  Combining <strong>Cyan, Magenta, and Yellow</strong> subtracts reflected light toward darkness, with <strong>Key/Black (K)</strong> added for pure depth and contrast.
                </p>
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-amber-300">Important Note: </strong>
                  Computer displays are physical RGB emitters. When you inspect CMYK values in ColorQuest, the screen mathematically converts the subtractive ink percentages into RGB gamuts for visual preview.
                </div>
              </div>

              {/* HSV Note */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-purple-300 text-sm">
                  <Compass className="w-4 h-4" />
                  <span>HSV Cylindrical Representation</span>
                </div>
                <p className="text-slate-300">
                  HSV maps colors geometrically: <strong>Hue (0-360°)</strong> around the color wheel, <strong>Saturation (0-100%)</strong> from gray to pure vibrancy, and <strong>Value (0-100%)</strong> brightness.
                  HSV is a human-friendly cylindrical representation of RGB rather than a physical mixing model.
                </p>
              </div>
            </>
          )}

          {activeTab === 'schemes' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1">1. Monochromatic</h4>
                <p>Uses a single anchor hue and creates depth purely through variations in saturation (tint) and value (shade). Creates elegant, cohesive, and serene compositions.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1">2. Complementary</h4>
                <p>Combines two hues exactly opposite each other on the 360° color wheel (180° separation). Offers maximum visual contrast, vibrancy, and energetic tension.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1">3. Analogous</h4>
                <p>Pairs three hues sitting adjacent to one another on the color wheel (separated by ~30°-35°). Emulates natural phenomena like sunsets and oceanic depths.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1">4. Warm Spectrum</h4>
                <p>Documented classification: Hues between 330° and 80° (crimson, scarlet, cadmium orange, amber gold). Invokes solar warmth, physical proximity, and energy.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1">5. Cool Spectrum</h4>
                <p>Documented classification: Hues between 90° and 270° (emerald green, seafoam cyan, azure sky, cobalt blue). Invokes tranquility, depth, and atmospheric distance.</p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-emerald-400 text-xs mb-1">Scoring Breakdown</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Correct Target Color:</strong> +100 points</li>
                  <li><strong>Harmonious Scheme Alternative:</strong> +40 points</li>
                  <li><strong>Incorrect Selection:</strong> -10 points (score never drops below 0)</li>
                  <li><strong>Hint Used:</strong> -25 points</li>
                  <li><strong>Completion Bonus:</strong> +500 points</li>
                  <li><strong>Perfect Bonus (0 mistakes & 0 hints):</strong> +1,000 points</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">1 - 9</kbd> Select Swatch</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">H</kbd> Use Hint</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Z</kbd> Undo Paint</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">M</kbd> Toggle Audio</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
