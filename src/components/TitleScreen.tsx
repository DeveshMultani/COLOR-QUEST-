import React, { useEffect } from 'react';
import { Play, Sparkles, Image as ImageIcon, Volume2, VolumeX, Shield, HelpCircle } from 'lucide-react';
import type { GameDifficulty, ColorModelMode, PresetImage } from '../types/game.ts';
import { PRESETS } from '../game/imageSegmentation.ts';
import { sounds } from '../services/soundEffects.ts';

interface TitleScreenProps {
  onStart: (preset: PresetImage | null, difficulty: GameDifficulty, model: ColorModelMode) => void;
  onOpenUpload: () => void;
  onOpenHelp: () => void;
  selectedDifficulty: GameDifficulty;
  onSelectDifficulty: (d: GameDifficulty) => void;
  selectedModel: ColorModelMode;
  onSelectModel: (m: ColorModelMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenUpload,
  onOpenHelp,
  selectedDifficulty,
  onSelectDifficulty,
  selectedModel,
  onSelectModel,
  isMuted,
  onToggleMute,
}) => {
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>(PRESETS[0].id);

  // Keyboard listener: Enter / Space starts the game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const preset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];
        sounds.playClick();
        onStart(preset, selectedDifficulty, selectedModel);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPresetId, selectedDifficulty, selectedModel, onStart]);

  const activePreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Subtle chromatic ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-600 blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-cyan-600 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-500 blur-3xl" />
      </div>

      {/* Top Utility Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-amber-400">
            Color Theory Puzzle
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            RGB Light · CMYK Pigment · Harmonic Segmentation
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenHelp();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Color Theory Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Theory Guide</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Hero Showcase Centerpiece */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
        {/* Custom Inline SVG Title Lockup */}
        <div className="mb-4 flex flex-col items-center">
          <svg
            viewBox="0 0 540 100"
            className="w-full max-w-lg h-auto filter drop-shadow-md select-none"
            aria-label="ColorQuest Logo"
          >
            <defs>
              <linearGradient id="prismLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="20%" stopColor="#F97316" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="60%" stopColor="#10B981" />
                <stop offset="80%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            {/* Prism Icon */}
            <polygon points="40,80 75,18 110,80" fill="none" stroke="url(#prismLight)" strokeWidth="4" />
            <line x1="75" y1="20" x2="140" y2="70" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
            
            {/* Title Lettering */}
            <text
              x="130"
              y="68"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="52"
              fontWeight="900"
              letterSpacing="3"
              fill="#FFFFFF"
            >
              COLOR
            </text>
            <text
              x="345"
              y="68"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="52"
              fontWeight="900"
              letterSpacing="3"
              fill="url(#prismLight)"
            >
              QUEST
            </text>
          </svg>

          <p className="max-w-xl text-sm sm:text-base text-slate-300 font-light mt-1">
            An interactive colour-theory puzzle. Analyze palettes, master additive light & subtractive inks, and solve numbered segment puzzles.
          </p>
        </div>

        {/* Configuration Matrix: Color Model & Difficulty */}
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4 shadow-2xl text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Model Mode Selection */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                1. Select Colour Model
              </label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Color Model">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onSelectModel('rgb');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedModel === 'rgb'
                      ? 'bg-blue-950/70 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                  }`}
                  role="radio"
                  aria-checked={selectedModel === 'rgb'}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-blue-400">Additive RGB</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Light emissions (R, G, B) combine to White.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onSelectModel('cmyk');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedModel === 'cmyk'
                      ? 'bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                  }`}
                  role="radio"
                  aria-checked={selectedModel === 'cmyk'}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-amber-400">Subtractive CMYK</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Inks (C, M, Y, K) absorb light to Black.
                  </p>
                </button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                2. Region Complexity
              </label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Puzzle Complexity">
                {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onSelectDifficulty(diff);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedDifficulty === diff
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300 font-medium'
                    }`}
                    role="radio"
                    aria-checked={selectedDifficulty === diff}
                  >
                    <div className="text-xs uppercase tracking-wider capitalize">{diff}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {diff === 'easy' ? '~10 regions' : diff === 'medium' ? '~22 regions' : '~40 regions'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preset Images Selection */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
              3. Choose Canvas Subject
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedPresetId(preset.id);
                    }}
                    className={`group relative p-2 rounded-xl border text-left transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40'
                        : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-slate-950 flex items-center justify-center border border-slate-700/50">
                      <img
                        src={preset.svgDataUri}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="font-semibold text-xs text-slate-200 truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{preset.difficulty}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playClick();
              onStart(activePreset, selectedDifficulty, selectedModel);
            }}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-base bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer focus:ring-4 focus:ring-amber-500/50 focus:outline-none"
            aria-label="Start Puzzle Quest"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Play Puzzle</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenUpload();
            }}
            className="w-full sm:w-auto py-3.5 px-5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer focus:ring-4 focus:ring-slate-600/50 focus:outline-none"
            aria-label="Upload Custom Image"
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Upload My Image</span>
          </button>
        </div>
      </main>

      {/* Flat Control Hints Footer as required by Game Craft */}
      <footer className="relative z-10 w-full py-4 text-center border-t border-slate-900 bg-slate-950/80">
        <p className="text-xs text-slate-400 font-mono tracking-wide">
          Enter/Space Start · Click Region to Paint · 1-9 Swatch Shortcuts · H Hint · Z Undo · Esc Pause
        </p>
      </footer>
    </div>
  );
};
