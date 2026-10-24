import React, { useEffect, useState } from 'react';
import { Play, Image as ImageIcon, Volume2, VolumeX, HelpCircle, Palette, Sparkles, Sliders } from 'lucide-react';
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
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);

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
    <div className="relative min-h-screen w-full bg-[#141312] text-[#F5F2EB] flex flex-col justify-between overflow-x-hidden selection:bg-[#D49A5B] selection:text-[#141312]">
      {/* Subtle architectural linen vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,154,91,0.08),rgba(20,19,18,0))]" />

      {/* Top Navigation Bar: Strict 3-zone contract */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#262420]">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-xl font-bold tracking-tight text-[#F5F2EB]">
            ColorQuest
          </span>
          <span className="text-xs text-[#8C867B] hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-xs text-[#A8A296] hidden sm:inline">Color Theory Atelier</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs text-[#A8A296]">
          <span>RGB Light</span>
          <span aria-hidden="true">·</span>
          <span>CMYK Pigment</span>
          <span aria-hidden="true">·</span>
          <span>Harmonic Segmentation</span>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenHelp();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1F1D1A] hover:bg-[#282521] border border-[#38332B] text-[#D6D0C2] transition-colors cursor-pointer"
            aria-label="Color Theory Field Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#D49A5B]" />
            <span>Field Guide</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            className="p-2 rounded-lg bg-[#1F1D1A] hover:bg-[#282521] border border-[#38332B] text-[#A8A296] hover:text-[#F5F2EB] transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#C87A54]" /> : <Volume2 className="w-4 h-4 text-[#6E9484]" />}
          </button>
        </div>
      </header>

      {/* Main Showcase */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 flex-1 flex flex-col justify-center">
        {/* Title Intro */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-[#D49A5B] font-medium mb-2.5">
            Interactive Chromatic Reconstruction
          </p>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F2EB] mb-3 text-balance">
            Master the Nuance of Harmonic Color
          </h1>
          <p className="text-sm text-[#A8A296] leading-relaxed">
            Paint stained-glass masterpieces and geometric compositions. Learn additive RGB light, subtractive CMYK pigment, and complementary color wheels through tactile puzzle play.
          </p>
        </div>

        {/* Preset Gallery Selector Grid */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3 text-xs text-[#8C867B]">
            <span className="font-medium">Curated Exhibition Pieces</span>
            <span>{PRESETS.length} Artworks Available</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESETS.map(preset => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPresetId(preset.id);
                  }}
                  className={`group flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#22201D] border-[#D49A5B] shadow-md ring-1 ring-[#D49A5B]/30'
                      : 'bg-[#181715] border-[#2A2723] hover:border-[#3E3A33]'
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#100F0E] mb-2.5 border border-[#262420] p-1 flex items-center justify-center">
                    <img
                      src={preset.svgDataUri}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-102 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#F5F2EB] truncate mb-0.5">
                    {preset.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C867B]">
                    <span className="capitalize">{preset.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>Vector Lead</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Row: Difficulty & Color Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full mb-8">
          {/* Difficulty Segmented Control */}
          <div className="flex flex-col gap-1.5 bg-[#181715] p-3 rounded-xl border border-[#2A2723]">
            <span className="text-xs font-medium text-[#8C867B]">Partition Density:</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#141312] rounded-lg border border-[#262420]">
              {(['easy', 'medium', 'hard'] as GameDifficulty[]).map(diff => {
                const isActive = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onSelectDifficulty(diff);
                    }}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#282521] text-[#F5F2EB] shadow-xs border border-[#3E3A33]'
                        : 'text-[#8C867B] hover:text-[#D6D0C2]'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Model Segmented Control */}
          <div className="flex flex-col gap-1.5 bg-[#181715] p-3 rounded-xl border border-[#2A2723]">
            <span className="text-xs font-medium text-[#8C867B]">Color Theory Physics:</span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#141312] rounded-lg border border-[#262420]">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectModel('rgb');
                }}
                className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedModel === 'rgb'
                    ? 'bg-[#282521] text-[#F5F2EB] shadow-xs border border-[#3E3A33]'
                    : 'text-[#8C867B] hover:text-[#D6D0C2]'
                }`}
              >
                RGB (Light)
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectModel('cmyk');
                }}
                className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedModel === 'cmyk'
                    ? 'bg-[#282521] text-[#D49A5B] shadow-xs border border-[#3E3A33]'
                    : 'text-[#8C867B] hover:text-[#D6D0C2]'
                }`}
              >
                CMYK (Pigment)
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto w-full">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playClick();
              onStart(activePreset, selectedDifficulty, selectedModel);
            }}
            className="w-full sm:flex-1 py-3 px-6 rounded-xl font-semibold text-sm bg-[#D49A5B] hover:bg-[#C2894A] text-[#141312] flex items-center justify-center gap-2 shadow-lg shadow-[#D49A5B]/15 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Enter Atelier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenUpload();
            }}
            className="w-full sm:w-auto py-3 px-5 rounded-xl font-medium text-xs bg-[#1F1D1A] hover:bg-[#282521] border border-[#38332B] text-[#D6D0C2] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-[#8C867B]" />
            <span>Upload Image</span>
          </button>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-[#6E685E] border-t border-[#262420]">
        <span>ColorQuest Atelier · Additive & Subtractive Harmonic Studies</span>
        <span className="font-mono text-[11px]">Press Space / Enter to Begin</span>
      </footer>
    </div>
  );
};
