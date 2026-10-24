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
  Download,
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
  timerMode: 'countdown' | 'stopwatch';
  onToggleTimerMode: () => void;
  timeDelta?: { text: string; type: 'bonus' | 'penalty' } | null;
  difficulty: GameDifficulty;
  colorScheme: ColorSchemeType;
  colorModel: ColorModelMode;
  artworkName: string;
  canUndo: boolean;
  onUndo: () => void;
  onHint: () => void;
  onReset: () => void;
  onOpenUpload: () => void;
  onOpenHelp: () => void;
  onOpenExport: () => void;
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
  timerMode,
  onToggleTimerMode,
  timeDelta,
  difficulty,
  colorScheme,
  colorModel,
  artworkName,
  canUndo,
  onUndo,
  onHint,
  onReset,
  onOpenUpload,
  onOpenHelp,
  onOpenExport,
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

  const isUrgent = timerMode === 'countdown' && timerSeconds <= 30;

  return (
    <header className="w-full bg-[#181715] border-b border-[#2C2924] px-4 py-2.5 select-none z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Cluster: Title / Nav & Editorial Metadata */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onReturnToTitle();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-xs font-medium text-[#D6D0C2] transition-colors cursor-pointer"
            aria-label="Return to Title Screen"
          >
            <Home className="w-3.5 h-3.5 text-[#D49A5B]" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-editorial text-sm font-bold tracking-tight text-[#F5F2EB] hidden md:inline">
              ColorQuest
            </span>
            <span className="text-xs text-[#8C867B] hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-xs text-[#A8A296] font-medium hidden sm:inline">
              {artworkName}
            </span>
            <span className="text-xs text-[#8C867B] hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-[11px] font-medium text-[#D49A5B] capitalize">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Center Cluster: Progress & Competitive Timer */}
        <div className="flex items-center gap-4 flex-1 max-w-md justify-center">
          <div className="flex-1 max-w-[180px] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8C867B]">
              <span>Progress</span>
              <span className="text-[#F5F2EB] tabular-nums">
                {filledCount}/{totalRegions} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#22201D] rounded-full overflow-hidden border border-[#2D2A26]">
              <div
                className="h-full bg-[#D49A5B] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Competitive Timer with Urgency Pulse and Time Delta */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onToggleTimerMode();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                isUrgent
                  ? 'bg-[#3A1412] border-[#EF4444] text-[#FCA5A5] ring-2 ring-red-500/40 animate-pulse'
                  : 'bg-[#22201D] border-[#38332B] hover:border-[#4E473D] text-[#D6D0C2]'
              }`}
              title={`Click to switch between Countdown Rush and Speedrun modes. Current: ${
                timerMode === 'countdown' ? 'Countdown Challenge' : 'Speedrun Stopwatch'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-[#EF4444]' : 'text-[#D49A5B]'}`} />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="tabular-nums font-bold tracking-wide">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-[10px] text-[#8C867B] font-sans uppercase tracking-wider">
                  {timerMode === 'countdown' ? 'Rush' : 'Run'}
                </span>
              </div>
            </button>

            {/* Time Delta Pill Animation (+3s bonus / -5s penalty) */}
            {timeDelta && (
              <div
                className={`absolute -top-7 right-0 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg animate-bounce z-40 ${
                  timeDelta.type === 'bonus'
                    ? 'bg-[#183125] text-[#4ADE80] border border-[#22C55E]/40'
                    : 'bg-[#3B1515] text-[#F87171] border border-[#EF4444]/40'
                }`}
              >
                {timeDelta.text}
              </div>
            )}
          </div>
        </div>

        {/* Right Cluster: Score, Export & Actions */}
        <div className="flex items-center gap-2">
          {/* Score Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22201D] border border-[#38332B] text-[#D49A5B] text-xs font-medium font-mono">
            <Award className="w-3.5 h-3.5" />
            <span className="tabular-nums font-bold text-sm">{score}</span>
          </div>

          {/* Download Colour Block Artwork */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenExport();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2A2723] hover:bg-[#34302A] border border-[#443E36] text-xs font-medium text-[#F5F2EB] transition-colors cursor-pointer shadow-xs"
            aria-label="Download Colour Block Image"
            title="Download Colour Block Image & Poster"
          >
            <Download className="w-3.5 h-3.5 text-[#D49A5B]" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onHint();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-xs font-medium text-[#D49A5B] transition-colors cursor-pointer"
            aria-label="Use Hint"
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
                ? 'bg-[#22201D] hover:bg-[#2A2723] border-[#38332B] text-[#D6D0C2]'
                : 'bg-[#181715] border-[#24221E] text-[#555047] cursor-not-allowed'
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
            className="p-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-[#D6D0C2] transition-colors cursor-pointer"
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
            className="p-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-[#D6D0C2] transition-colors cursor-pointer"
            aria-label="Regenerate Segmentation"
            title="Regenerate Segmentation"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-[#D49A5B]' : ''}`} />
          </button>

          {/* Upload New Image */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenUpload();
            }}
            className="p-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-[#D6D0C2] transition-colors cursor-pointer"
            aria-label="Upload Custom Artwork"
            title="Upload Custom Artwork"
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
            className="p-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-[#D6D0C2] transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            title="Toggle Sound [M]"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#C87A54]" /> : <Volume2 className="w-4 h-4 text-[#6E9484]" />}
          </button>

          {/* Theory Help Modal */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenHelp();
            }}
            className="p-1.5 rounded-lg bg-[#22201D] hover:bg-[#2A2723] border border-[#38332B] text-[#D49A5B] transition-colors cursor-pointer"
            aria-label="Color Theory Guide"
            title="Color Theory Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
