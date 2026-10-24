import React, { useEffect } from 'react';
import { Trophy, ArrowRight, RotateCcw, Home, Download, Sparkles } from 'lucide-react';
import type { GameDifficulty, ColorSchemeType } from '../types/game.ts';
import { SCORING } from '../game/rules.ts';
import { sounds } from '../services/soundEffects.ts';

interface VictoryModalProps {
  score: number;
  mistakes: number;
  hintsUsed: number;
  elapsedSeconds: number;
  difficulty: GameDifficulty;
  colorScheme: ColorSchemeType;
  artworkName: string;
  onReplay: () => void;
  onNextPreset: () => void;
  onReturnToTitle: () => void;
  onOpenExport?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  mistakes,
  hintsUsed,
  elapsedSeconds,
  difficulty,
  colorScheme,
  artworkName,
  onReplay,
  onNextPreset,
  onReturnToTitle,
  onOpenExport,
}) => {
  useEffect(() => {
    sounds.playVictory();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const isPerfect = mistakes === 0 && hintsUsed === 0;
  const accuracy = Math.round(
    Math.max(0, 100 - (mistakes * 10) - (hintsUsed * 4))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-[#1C1A18] border border-[#3E382E] rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Soft atelier bronze glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D49A5B]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Emblem */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#26231F] border border-[#443E34] text-[#D49A5B] mb-4 shadow-sm">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 id="victory-title" className="font-editorial text-2xl sm:text-3xl font-bold text-[#F5F2EB] tracking-tight mb-1">
          Masterpiece Completed
        </h2>
        <p className="text-xs text-[#A8A296] mb-6">
          {artworkName} · {colorScheme.toUpperCase()} Harmonic Reconstruction
        </p>

        {/* Big Score Box */}
        <div className="bg-[#141312] border border-[#2A2723] rounded-2xl p-4 mb-6">
          <div className="text-[11px] font-medium tracking-wide text-[#8C867B] mb-1">
            Total Score
          </div>
          <div className="text-4xl sm:text-5xl font-bold font-mono text-[#D49A5B] tracking-tight">
            {score.toLocaleString()}
          </div>
          {isPerfect && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6E9484] bg-[#1E2522] border border-[#2E3C36] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flawless Execution (+{SCORING.PERFECT_BONUS} bonus)</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-left">
          <div className="bg-[#181715] border border-[#2A2723] rounded-xl p-3">
            <div className="text-[10px] font-medium text-[#8C867B]">Clear Time</div>
            <div className="text-sm font-semibold font-mono text-[#F5F2EB] mt-0.5">{formatTime(elapsedSeconds)}</div>
          </div>
          <div className="bg-[#181715] border border-[#2A2723] rounded-xl p-3">
            <div className="text-[10px] font-medium text-[#8C867B]">Accuracy</div>
            <div className="text-sm font-semibold font-mono text-[#F5F2EB] mt-0.5">{accuracy}%</div>
          </div>
          <div className="bg-[#181715] border border-[#2A2723] rounded-xl p-3">
            <div className="text-[10px] font-medium text-[#8C867B]">Mistakes / Hints</div>
            <div className="text-sm font-semibold font-mono text-[#F5F2EB] mt-0.5">{mistakes} / {hintsUsed}</div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={() => {
                sounds.playClick();
                onNextPreset();
              }}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-[#D49A5B] hover:bg-[#C2894A] text-[#141312] flex items-center justify-center gap-2 shadow-lg shadow-[#D49A5B]/15 cursor-pointer transition-all"
            >
              <span>Next Artwork</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenExport && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenExport();
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-xl font-semibold text-xs bg-[#24211D] hover:bg-[#2C2924] border border-[#3E382E] text-[#F5F2EB] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#D49A5B]" />
                <span>Download Print</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onReplay();
              }}
              className="text-xs text-[#A8A296] hover:text-[#F5F2EB] flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Paint Again</span>
            </button>

            <span className="text-[#38332B]" aria-hidden="true">·</span>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onReturnToTitle();
              }}
              className="text-xs text-[#A8A296] hover:text-[#F5F2EB] flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Exhibition Gallery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
