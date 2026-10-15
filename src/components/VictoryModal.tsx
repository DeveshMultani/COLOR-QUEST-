import React, { useEffect } from 'react';
import { Trophy, Award, CheckCircle2, RotateCcw, ArrowRight, Home, Sparkles, Star } from 'lucide-react';
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
  onReplay: () => void;
  onNextPreset: () => void;
  onReturnToTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  mistakes,
  hintsUsed,
  elapsedSeconds,
  difficulty,
  colorScheme,
  onReplay,
  onNextPreset,
  onReturnToTitle,
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
    Math.max(0, 100 - (mistakes * 12) - (hintsUsed * 5))
  );

  const getSchemeMasteryTitle = (scheme: ColorSchemeType) => {
    switch (scheme) {
      case 'monochromatic':
        return 'Monochromatic Value Maestro';
      case 'complementary':
        return 'Complementary Contrast Master';
      case 'analogous':
        return 'Analogous Harmony Virtuoso';
      case 'warm':
        return 'Thermal Radiance Specialist';
      case 'cool':
        return 'Atmospheric Cyan Scholar';
      default:
        return 'Chromatic Reconstructionist';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Amber glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy emblem */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 mb-4 shadow-lg">
          <Trophy className="w-10 h-10 fill-amber-400/20 stroke-amber-400" />
          {isPerfect && (
            <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
              <Star className="w-4 h-4 fill-slate-950" />
            </div>
          )}
        </div>

        <h2 id="victory-title" className="text-2xl sm:text-3xl font-black text-slate-100 tracking-wide mb-1">
          PUZZLE COMPLETED!
        </h2>
        <p className="text-sm font-semibold text-amber-400 mb-6">
          {getSchemeMasteryTitle(colorScheme)}
        </p>

        {/* Big Score Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Total Score
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-tight">
            {score.toLocaleString()}
          </div>
          {isPerfect && (
            <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perfect Run Bonus (+{SCORING.PERFECT_BONUS} pts)</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-left">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Clear Time</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{formatTime(elapsedSeconds)}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{accuracy}%</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Mistakes / Hints</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{mistakes} / {hintsUsed}</div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playClick();
              onNextPreset();
            }}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onReplay();
            }}
            className="w-full sm:w-auto py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onReturnToTitle();
            }}
            className="w-full sm:w-auto py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Title</span>
          </button>
        </div>
      </div>
    </div>
  );
};
