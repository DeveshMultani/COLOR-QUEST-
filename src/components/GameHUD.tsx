import React from 'react';
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Volume2,
  VolumeX,
  HelpCircle,
  Home,
  Clock,
  Award,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import type { GameDifficulty, ColorSchemeType, ColorModelMode } from '../types/game.ts';
import { sounds } from '../services/soundEffects.ts';

interface GameHUDProps {
  score: number;
  progressPercent: number;
  filledCount: number;
  totalRegions: number;
  mistakes: number;
  hintsUsed: number;
  timerSeconds: number;
  difficulty: GameDifficulty;
  colorScheme: ColorSchemeType;
  colorModel: ColorModelMode;
  canUndo: boolean;
  onUndo: () => void;
  onHint: () => void;
  onReset: () => void;
  onOpenUpload: () => void;
  onOpenHelp: () => void;
  onReturnToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  progressPercent,
  filledCount,
  totalRegions,
  mistakes,
  hintsUsed,
  timerSeconds,
  difficulty,
  colorScheme,
  colorModel,
  canUndo,
  onUndo,
  onHint,
  onReset,
  onOpenUpload,
  onOpenHelp,
  onReturnToTitle,
  isMuted,
  onToggleMute,
  onRegenerate,
  isRegenerating = false,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 select-none z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Cluster: Title / Nav & Badges */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onReturnToTitle();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            aria-label="Return to Title Screen"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Title</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-wider text-slate-100 hidden md:inline">
              COLOR<span className="text-amber-400">QUEST</span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">
              {difficulty}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 capitalize hidden sm:inline">
              {colorScheme}
            </span>
          </div>
        </div>

        {/* Center Cluster: Progress & Stats */}
        <div className="flex items-center gap-4 flex-1 max-w-md justify-center">
          {/* Progress Bar */}
          <div className="flex-1 max-w-[200px] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Progress</span>
              <span className="text-slate-200 tabular-nums">
                {filledCount}/{totalRegions} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums">{formatTime(timerSeconds)}</span>
          </div>
        </div>

        {/* Right Cluster: Score & Gameplay Controls */}
        <div className="flex items-center gap-2">
          {/* Score Pip */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-500/50 text-amber-400 text-xs font-bold font-mono">
            <Award className="w-3.5 h-3.5" />
            <span className="tabular-nums text-sm">{score}</span>
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onHint();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
            aria-label="Use Hint (-25 points)"
            title="Highlight an unfilled region (-25 pts) [H]"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          {/* Undo Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onUndo();
            }}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              canUndo
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Undo Last Move [Z]"
            title="Undo Last Move [Z]"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onReset();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Reset Puzzle"
            title="Reset Puzzle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Regenerate Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onRegenerate();
            }}
            disabled={isRegenerating}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Regenerate Segmentation"
            title="Regenerate Segmentation"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Upload New Image */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenUpload();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Upload New Image"
            title="Upload New Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            title="Toggle Sound [M]"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Theory Help Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenHelp();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Theory Guide"
            title="Color Theory Guide"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
