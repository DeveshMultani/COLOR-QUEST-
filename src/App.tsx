/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  GameDifficulty,
  ColorModelMode,
  ColorSchemeType,
  PresetImage,
  ColorSwatch,
  RegionData,
  PaintAction,
  TimerMode,
} from './types/game.ts';
import {
  PRESETS,
  loadImage,
  extractDominantColors,
  segmentImageIntoRegions,
  SegmentationResult,
} from './game/imageSegmentation.ts';
import { generateHarmonicPalette } from './game/colorMath.ts';
import {
  evaluateMove,
  calculateProgress,
  checkCompletion,
  findHintRegion,
  calculateFinalScore,
  updateScore,
  SCORING,
} from './game/rules.ts';
import { sounds } from './services/soundEffects.ts';

// UI Components
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { PuzzleCanvas } from './components/PuzzleCanvas.tsx';
import { PaletteDock } from './components/PaletteDock.tsx';
import { ColorInspector } from './components/ColorInspector.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { ImageUploadModal } from './components/ImageUploadModal.tsx';
import { ColorTheoryModal } from './components/ColorTheoryModal.tsx';
import { ExportArtworkModal } from './components/ExportArtworkModal.tsx';

export default function App() {
  // Game Phase State
  const [phase, setPhase] = useState<'title' | 'playing' | 'paused' | 'victory'>('title');

  // Game Configuration State
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [colorModel, setColorModel] = useState<ColorModelMode>('rgb');
  const [colorScheme, setColorScheme] = useState<ColorSchemeType>('original');
  const [activePreset, setActivePreset] = useState<PresetImage>(PRESETS[0]);
  const [customImage, setCustomImage] = useState<HTMLImageElement | null>(null);

  // Segmentation & Puzzle State
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [activePalette, setActivePalette] = useState<ColorSwatch[]>([]);
  const [rawDominantSwatches, setRawDominantSwatches] = useState<ColorSwatch[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState<number>(0);
  const [hintRegionId, setHintRegionId] = useState<number | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);

  // Identify which swatch in the palette is designated for the hovered region
  const hoveredTargetSwatchIndex = useMemo(() => {
    if (hoveredRegionId === null) return null;
    const r = regions.find(item => item.id === hoveredRegionId);
    return r && !r.isCorrect ? r.targetColorIndex : null;
  }, [hoveredRegionId, regions]);

  // Gameplay Metrics & Competitive Timer State
  const [score, setScore] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [history, setHistory] = useState<PaintAction[]>([]);
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [timerSeconds, setTimerSeconds] = useState<number>(180);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [timeDelta, setTimeDelta] = useState<{ text: string; type: 'bonus' | 'penalty' } | null>(null);
  const timeDeltaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get initial timer seconds by difficulty
  const getInitialSeconds = useCallback((diff: GameDifficulty, mode: TimerMode): number => {
    if (mode === 'stopwatch') return 0;
    switch (diff) {
      case 'easy':
        return 180;
      case 'medium':
        return 270;
      case 'hard':
        return 360;
      default:
        return 180;
    }
  }, []);

  // Trigger floating visual time bonus / penalty badge
  const triggerTimeDelta = useCallback((deltaText: string, type: 'bonus' | 'penalty') => {
    setTimeDelta({ text: deltaText, type });
    if (timeDeltaTimeoutRef.current) clearTimeout(timeDeltaTimeoutRef.current);
    timeDeltaTimeoutRef.current = setTimeout(() => {
      setTimeDelta(null);
    }, 1200);
  }, []);

  // Feedback banner & UI toggles
  const [lastFeedback, setLastFeedback] = useState<{
    message: string;
    type: 'correct' | 'compatible' | 'incorrect';
  } | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const actionLockRef = useRef<boolean>(false);

  // Mirror game state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = phase === 'victory' ? 'gameover' : phase;
  }, [phase]);

  // Autostart URL parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      handleStartGame(PRESETS[0], 'easy', 'rgb');
    }
  }, []);

  // Timer loop with Countdown Rush vs Stopwatch Speedrun modes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (phase === 'playing' && isTimerRunning && !isTimedOut) {
      interval = setInterval(() => {
        if (timerMode === 'countdown') {
          setTimerSeconds(prev => {
            if (prev <= 1) {
              setIsTimerRunning(false);
              setIsTimedOut(true);
              sounds.playIncorrect();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setTimerSeconds(s => s + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, isTimerRunning, isTimedOut, timerMode]);

  // Core Puzzle Initializer
  const initializePuzzle = useCallback(
    async (
      imgElement: HTMLImageElement,
      diff: GameDifficulty,
      scheme: ColorSchemeType,
      model: ColorModelMode
    ) => {
      setIsRegenerating(true);
      try {
        const off = document.createElement('canvas');
        off.width = 320;
        off.height = 320;
        const ctx = off.getContext('2d');
        if (ctx) {
          ctx.drawImage(imgElement, 0, 0, 320, 320);
          const dominant = extractDominantColors(ctx, 320, 320, 6);
          setRawDominantSwatches(dominant);

          const harmonic = generateHarmonicPalette(dominant, scheme, 6);
          setActivePalette(harmonic);

          const segResult = segmentImageIntoRegions(imgElement, diff, harmonic);
          setSegmentation(segResult);
          setRegions(segResult.regions);
          setSelectedSwatchIndex(0);
          setHintRegionId(null);
          setHistory([]);
        }
      } catch (err) {
        console.error('Failed to initialize puzzle:', err);
      } finally {
        setIsRegenerating(false);
      }
    },
    []
  );

  // Handle scheme change on the fly
  const handleChangeScheme = useCallback(
    (newScheme: ColorSchemeType) => {
      setColorScheme(newScheme);
      if (rawDominantSwatches.length > 0 && segmentation) {
        const newPalette = generateHarmonicPalette(rawDominantSwatches, newScheme, 6);
        setActivePalette(newPalette);

        setRegions(prevRegions =>
          prevRegions.map(r => {
            const swatchIdx = r.targetColorIndex % newPalette.length;
            const swatch = newPalette[swatchIdx];
            return {
              ...r,
              targetColorHex: swatch.hex,
              isCorrect: r.filledColorHex
                ? evaluateMove(r, r.filledColorHex, newPalette, newScheme).status === 'correct'
                : false,
            };
          })
        );
      }
    },
    [rawDominantSwatches, segmentation]
  );

  // Toggle between Countdown Rush and Stopwatch Speedrun modes
  const handleToggleTimerMode = useCallback(() => {
    sounds.playClick();
    setTimerMode(prev => {
      const next: TimerMode = prev === 'countdown' ? 'stopwatch' : 'countdown';
      if (next === 'countdown') {
        setTimerSeconds(getInitialSeconds(difficulty, 'countdown'));
        setIsTimedOut(false);
      } else {
        setTimerSeconds(0);
        setIsTimedOut(false);
      }
      return next;
    });
  }, [difficulty, getInitialSeconds]);

  // Start game from title screen
  const handleStartGame = useCallback(
    async (preset: PresetImage | null, diff: GameDifficulty, model: ColorModelMode) => {
      setDifficulty(diff);
      setColorModel(model);
      setScore(0);
      setMistakes(0);
      setHintsUsed(0);
      setTimerSeconds(getInitialSeconds(diff, timerMode));
      setIsTimedOut(false);
      setIsTimerRunning(true);
      setLastFeedback(null);

      const targetPreset = preset || activePreset;
      setActivePreset(targetPreset);
      setCustomImage(null);

      try {
        const img = await loadImage(targetPreset.svgDataUri);
        await initializePuzzle(img, diff, colorScheme, model);
        setPhase('playing');
      } catch (err) {
        console.error('Failed to load preset image:', err);
      }
    },
    [activePreset, colorScheme, initializePuzzle, timerMode, getInitialSeconds]
  );

  // Handle user uploaded image
  const handleImageReady = useCallback(
    async (img: HTMLImageElement, diff: GameDifficulty) => {
      setCustomImage(img);
      setDifficulty(diff);
      setScore(0);
      setMistakes(0);
      setHintsUsed(0);
      setTimerSeconds(getInitialSeconds(diff, timerMode));
      setIsTimedOut(false);
      setIsTimerRunning(true);
      setLastFeedback(null);

      await initializePuzzle(img, diff, colorScheme, colorModel);
      setPhase('playing');
    },
    [colorScheme, colorModel, initializePuzzle, timerMode, getInitialSeconds]
  );

  // Interactive Region Click handler: Player must deliberately select swatch
  const handleRegionClick = useCallback(
    (regionId: number) => {
      if (actionLockRef.current) return;
      actionLockRef.current = true;
      setTimeout(() => {
        actionLockRef.current = false;
      }, 250);

      const regionIndex = regions.findIndex(r => r.id === regionId);
      if (regionIndex === -1) return;

      const region = regions[regionIndex];

      // If region is already correctly painted
      if (region.isCorrect) {
        sounds.playClick();
        setLastFeedback({
          message: `Partition #${regionId} is already harmoniously painted!`,
          type: 'correct',
        });
        return;
      }

      // Deliberate Swatch Selection: NO auto-switch!
      // The player must select the swatch in the dock themselves.
      const swatchToApply = activePalette[selectedSwatchIndex];
      if (!swatchToApply) return;

      // Evaluate the player's move
      const evalResult = evaluateMove(region, swatchToApply.hex, activePalette, colorScheme);

      if (evalResult.status === 'correct') {
        sounds.playCorrect();
        const updatedRegion: RegionData = {
          ...region,
          filledColorHex: swatchToApply.hex,
          isCorrect: true,
        };
        const nextRegions = [...regions];
        nextRegions[regionIndex] = updatedRegion;
        setRegions(nextRegions);

        setScore(s => updateScore(s, evalResult.pointsDelta));
        if (timerMode === 'countdown') {
          setTimerSeconds(s => s + 3);
          triggerTimeDelta('+3s', 'bonus');
        }
        setHistory(prev => [
          ...prev,
          {
            regionId,
            previousColorHex: region.filledColorHex,
            newColorHex: swatchToApply.hex,
            wasCorrect: true,
            pointsEarned: evalResult.pointsDelta,
          },
        ]);
        setLastFeedback({ message: evalResult.message, type: 'correct' });

        if (hintRegionId === regionId) {
          setHintRegionId(null);
        }

        if (checkCompletion(nextRegions)) {
          setIsTimerRunning(false);
          const finalScore = calculateFinalScore({
            baseScore: updateScore(score, evalResult.pointsDelta),
            mistakes,
            hintsUsed,
            isCompleted: true,
          });
          setScore(finalScore);
          setTimeout(() => {
            setPhase('victory');
          }, 450);
        }
      } else if (evalResult.status === 'compatible') {
        sounds.playCompatible();
        const updatedRegion: RegionData = {
          ...region,
          filledColorHex: swatchToApply.hex,
          isCorrect: true,
        };
        const nextRegions = [...regions];
        nextRegions[regionIndex] = updatedRegion;
        setRegions(nextRegions);

        setScore(s => updateScore(s, evalResult.pointsDelta));
        if (timerMode === 'countdown') {
          setTimerSeconds(s => s + 2);
          triggerTimeDelta('+2s', 'bonus');
        }
        setHistory(prev => [
          ...prev,
          {
            regionId,
            previousColorHex: region.filledColorHex,
            newColorHex: swatchToApply.hex,
            wasCorrect: true,
            pointsEarned: evalResult.pointsDelta,
          },
        ]);
        setLastFeedback({ message: evalResult.message, type: 'compatible' });

        if (checkCompletion(nextRegions)) {
          setIsTimerRunning(false);
          const finalScore = calculateFinalScore({
            baseScore: updateScore(score, evalResult.pointsDelta),
            mistakes,
            hintsUsed,
            isCompleted: true,
          });
          setScore(finalScore);
          setTimeout(() => {
            setPhase('victory');
          }, 450);
        }
      } else {
        // Mismatched / Wrong color chosen: Deduct points and apply countdown penalty!
        sounds.playIncorrect();
        setMistakes(m => m + 1);
        setScore(s => updateScore(s, evalResult.pointsDelta));
        if (timerMode === 'countdown') {
          setTimerSeconds(s => Math.max(0, s - 5));
          triggerTimeDelta('-5s', 'penalty');
        }
        setLastFeedback({
          message: `Incorrect! Partition #${regionId} requires Swatch #${region.targetColorIndex + 1} (${region.targetColorHex.toUpperCase()}). You used Swatch #${selectedSwatchIndex + 1}.`,
          type: 'incorrect',
        });
      }
    },
    [
      regions,
      activePalette,
      selectedSwatchIndex,
      colorScheme,
      hintRegionId,
      score,
      mistakes,
      hintsUsed,
      timerMode,
      triggerTimeDelta,
    ]
  );

  // Sync state to window for automated testing and verification
  useEffect(() => {
    (window as any).__CQ__ = {
      regions,
      activePalette,
      selectedSwatchIndex,
      handleRegionClick,
      colorScheme,
    };
  }, [regions, activePalette, selectedSwatchIndex, handleRegionClick, colorScheme]);

  // Hint button handler
  const handleHint = useCallback(() => {
    const hintRegion = findHintRegion(regions);
    if (!hintRegion) return;

    sounds.playHint();
    setHintsUsed(h => h + 1);
    setScore(s => updateScore(s, -SCORING.HINT_PENALTY));
    setHintRegionId(hintRegion.id);

    if (hintRegion.targetColorIndex < activePalette.length) {
      setSelectedSwatchIndex(hintRegion.targetColorIndex);
    }

    setLastFeedback({
      message: `Hint: Partition #${hintRegion.id} needs Swatch #${hintRegion.targetColorIndex + 1}!`,
      type: 'compatible',
    });
  }, [regions, activePalette]);

  // Undo button handler
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    sounds.playClick();

    setRegions(prevRegions =>
      prevRegions.map(r => {
        if (r.id === lastAction.regionId) {
          return {
            ...r,
            filledColorHex: lastAction.previousColorHex,
            isCorrect: false,
          };
        }
        return r;
      })
    );

    setScore(s => updateScore(s, -lastAction.pointsEarned));
    setHistory(prev => prev.slice(0, -1));
    setLastFeedback({ message: 'Last paint move undone.', type: 'compatible' });
  }, [history]);

  // Reset current puzzle
  const handleResetPuzzle = useCallback(() => {
    sounds.playClick();
    setRegions(prev =>
      prev.map(r => ({
        ...r,
        filledColorHex: null,
        isCorrect: false,
      }))
    );
    setHistory([]);
    setHintRegionId(null);
    setTimerSeconds(getInitialSeconds(difficulty, timerMode));
    setIsTimedOut(false);
    setIsTimerRunning(true);
    setLastFeedback({ message: 'Canvas reset. All partitions cleared.', type: 'compatible' });
  }, [difficulty, timerMode, getInitialSeconds]);

  // Add overtime when countdown expires in Rush mode
  const handleAddOvertime = useCallback(() => {
    sounds.playClick();
    setTimerSeconds(60);
    setIsTimedOut(false);
    setIsTimerRunning(true);
    setScore(s => Math.max(0, s - 50));
    setLastFeedback({ message: '+60s Rush Overtime added (-50 pts)! Keep going!', type: 'compatible' });
  }, []);

  // Regenerate segmentation
  const handleRegenerate = useCallback(async () => {
    const currentImg = customImage || (await loadImage(activePreset.svgDataUri));
    await initializePuzzle(currentImg, difficulty, colorScheme, colorModel);
    setLastFeedback({ message: 'Puzzle re-segmented with fresh boundaries.', type: 'compatible' });
  }, [customImage, activePreset, difficulty, colorScheme, colorModel, initializePuzzle]);

  // Next Preset in line
  const handleNextPreset = useCallback(async () => {
    const currentIdx = PRESETS.findIndex(p => p.id === activePreset.id);
    const nextIdx = (currentIdx + 1) % PRESETS.length;
    const nextPreset = PRESETS[nextIdx];
    await handleStartGame(nextPreset, difficulty, colorModel);
  }, [activePreset, difficulty, colorModel, handleStartGame]);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    sounds.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted]);

  // Keyboard shortcut listeners (1-9 swatches, H hint, Z undo, M mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key, 10) - 1;
        if (num < activePalette.length) {
          sounds.playClick();
          setSelectedSwatchIndex(num);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (phase === 'playing') handleHint();
      } else if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (phase === 'playing') handleUndo();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (phase === 'playing') {
          setPhase('paused');
        } else if (phase === 'paused') {
          setPhase('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, activePalette.length, handleHint, handleUndo, handleToggleMute]);

  const progressPercent = calculateProgress(regions);
  const filledCount = regions.filter(r => r.isCorrect).length;
  const selectedSwatch = activePalette[selectedSwatchIndex] || null;
  const currentArtworkTitle = customImage ? 'Custom Masterpiece' : activePreset.name;

  return (
    <div className="relative w-full h-screen bg-[#141312] text-[#F5F2EB] flex flex-col overflow-hidden select-none">
      {/* 1. Title Screen */}
      {phase === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          selectedDifficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          selectedModel={colorModel}
          onSelectModel={setColorModel}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Active Game Playing Interface */}
      {(phase === 'playing' || phase === 'paused' || phase === 'victory') && (
        <>
          {/* Header Perimeter HUD */}
          <GameHUD
            score={score}
            progressPercent={progressPercent}
            filledCount={filledCount}
            totalRegions={regions.length}
            mistakes={mistakes}
            hintsUsed={hintsUsed}
            timerSeconds={timerSeconds}
            timerMode={timerMode}
            onToggleTimerMode={handleToggleTimerMode}
            timeDelta={timeDelta}
            difficulty={difficulty}
            colorScheme={colorScheme}
            colorModel={colorModel}
            artworkName={currentArtworkTitle}
            canUndo={history.length > 0}
            onUndo={handleUndo}
            onHint={handleHint}
            onReset={handleResetPuzzle}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onReturnToTitle={() => {
              setPhase('title');
              setIsTimerRunning(false);
              setIsTimedOut(false);
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />

          {/* Feedback Banner */}
          {lastFeedback && (
            <div
              className={`w-full py-1.5 px-4 text-center text-xs font-medium tracking-wide transition-all border-b ${
                lastFeedback.type === 'correct'
                  ? 'bg-[#1E2620] text-[#7DB99A] border-[#2A3B30]'
                  : lastFeedback.type === 'compatible'
                  ? 'bg-[#26211A] text-[#D49A5B] border-[#44382A]'
                  : 'bg-[#2A1D1A] text-[#E07A5F] border-[#4A2D26]'
              }`}
            >
              {lastFeedback.message}
            </div>
          )}

          {/* Center Playfield: Puzzle Canvas & Sliding Color Inspector */}
          <div className="relative flex-1 flex flex-col md:flex-row min-h-0 w-full overflow-hidden">
            <main
              aria-label="Coloring Canvas Area"
              className="flex-1 h-full min-h-0 relative bg-[#141312]"
            >
              {segmentation ? (
                <PuzzleCanvas
                  width={segmentation.width}
                  height={segmentation.height}
                  regions={regions}
                  regionMap={segmentation.regionMap}
                  boundaryMap={segmentation.boundaryMap}
                  palette={activePalette}
                  selectedSwatch={selectedSwatch}
                  hintRegionId={hintRegionId}
                  onRegionClick={handleRegionClick}
                  lastFeedback={lastFeedback}
                  onOpenExport={() => setIsExportOpen(true)}
                  onHoverRegionChange={setHoveredRegionId}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8C867B] text-xs">
                  Preparing partitions and harmonic matrix...
                </div>
              )}
            </main>

            {/* Sliding Color Inspector Panel */}
            {isInspectorOpen && (
              <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-[#2C2924] p-4 bg-[#181715] overflow-y-auto shrink-0">
                <ColorInspector
                  swatch={selectedSwatch}
                  activeModel={colorModel}
                  activeScheme={colorScheme}
                  onClose={() => setIsInspectorOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Bottom Palette Dock */}
          <PaletteDock
            palette={activePalette}
            selectedSwatchIndex={selectedSwatchIndex}
            onSelectSwatch={setSelectedSwatchIndex}
            colorModel={colorModel}
            onToggleModel={setColorModel}
            colorScheme={colorScheme}
            onChangeScheme={handleChangeScheme}
            regions={regions}
            onToggleInspector={() => setIsInspectorOpen(open => !open)}
            isInspectorOpen={isInspectorOpen}
            highlightedSwatchIndex={hoveredTargetSwatchIndex}
          />
        </>
      )}

      {/* Paused Modal */}
      {phase === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-[#1C1A18] border border-[#38332B] rounded-2xl p-6 text-center shadow-2xl">
            <h2 id="pause-title" className="font-editorial text-xl font-bold text-[#F5F2EB] mb-2">
              Atelier Paused
            </h2>
            <p className="text-xs text-[#8C867B] mb-6">Take your time to study the chromatic harmonies.</p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setPhase('playing');
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#D49A5B] hover:bg-[#C2894A] text-[#141312] cursor-pointer transition-all"
              >
                Resume Painting
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  handleResetPuzzle();
                  setPhase('playing');
                }}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#24211D] hover:bg-[#2C2924] border border-[#38332B] text-[#D6D0C2] cursor-pointer transition-colors"
              >
                Restart Current Artwork
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setPhase('title');
                }}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#24211D] hover:bg-[#2C2924] border border-[#38332B] text-[#D6D0C2] cursor-pointer transition-colors"
              >
                Exit to Exhibition Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Rush Timeout Modal */}
      {isTimedOut && phase === 'playing' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="timeout-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-[#1C1A18] border border-[#E07A5F]/40 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E07A5F]/15 border border-[#E07A5F]/30 flex items-center justify-center text-[#E07A5F]">
              <span className="text-xl font-bold">⏱</span>
            </div>
            <h2 id="timeout-title" className="font-editorial text-xl font-bold text-[#F5F2EB] mb-1">
              Time Expired!
            </h2>
            <p className="text-xs text-[#8C867B] mb-5">
              Countdown Rush ran out of time! You completed {filledCount} of {regions.length} partitions ({Math.round(progressPercent)}%).
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAddOvertime}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#D49A5B] hover:bg-[#C2894A] text-[#141312] cursor-pointer transition-all shadow-md"
              >
                +60s Rush Overtime (-50 pts)
              </button>
              <button
                type="button"
                onClick={handleResetPuzzle}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#24211D] hover:bg-[#2C2924] border border-[#38332B] text-[#D6D0C2] cursor-pointer transition-colors"
              >
                Restart Current Artwork
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsTimedOut(false);
                  setPhase('title');
                }}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#24211D] hover:bg-[#2C2924] border border-[#38332B] text-[#D6D0C2] cursor-pointer transition-colors"
              >
                Exit to Exhibition Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {phase === 'victory' && (
        <VictoryModal
          score={score}
          mistakes={mistakes}
          hintsUsed={hintsUsed}
          elapsedSeconds={
            timerMode === 'countdown'
              ? Math.max(1, getInitialSeconds(difficulty, 'countdown') - timerSeconds)
              : timerSeconds
          }
          difficulty={difficulty}
          colorScheme={colorScheme}
          artworkName={currentArtworkTitle}
          onReplay={() => {
            handleResetPuzzle();
            setScore(0);
            setMistakes(0);
            setHintsUsed(0);
            setTimerSeconds(getInitialSeconds(difficulty, timerMode));
            setIsTimedOut(false);
            setIsTimerRunning(true);
            setPhase('playing');
          }}
          onNextPreset={handleNextPreset}
          onReturnToTitle={() => {
            setPhase('title');
          }}
          onOpenExport={() => setIsExportOpen(true)}
        />
      )}

      {/* Export / Download Colour Block Image Modal */}
      {segmentation && (
        <ExportArtworkModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          puzzleWidth={segmentation.width}
          puzzleHeight={segmentation.height}
          regions={regions}
          regionMap={segmentation.regionMap}
          boundaryMap={segmentation.boundaryMap}
          palette={activePalette}
          colorScheme={colorScheme}
          colorModel={colorModel}
          artworkName={currentArtworkTitle}
        />
      )}

      {/* Upload Custom Image Modal */}
      <ImageUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImageReady={handleImageReady}
        initialDifficulty={difficulty}
      />

      {/* Educational Color Theory Field Guide Modal */}
      <ColorTheoryModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
