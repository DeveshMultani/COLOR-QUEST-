/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GameDifficulty,
  ColorModelMode,
  ColorSchemeType,
  PresetImage,
  ColorSwatch,
  RegionData,
  PaintAction,
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

  // Gameplay Metrics State
  const [score, setScore] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [history, setHistory] = useState<PaintAction[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Feedback banner & UI toggles
  const [lastFeedback, setLastFeedback] = useState<{
    message: string;
    type: 'correct' | 'compatible' | 'incorrect';
  } | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

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

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (phase === 'playing' && isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, isTimerRunning]);

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
        // 1. Offscreen canvas to extract raw dominant colors
        const off = document.createElement('canvas');
        off.width = 300;
        off.height = 300;
        const ctx = off.getContext('2d');
        if (ctx) {
          ctx.drawImage(imgElement, 0, 0, 300, 300);
          const dominant = extractDominantColors(ctx, 300, 300, 6);
          setRawDominantSwatches(dominant);

          // 2. Build harmonic palette based on selected scheme
          const harmonic = generateHarmonicPalette(dominant, scheme, 6);
          setActivePalette(harmonic);

          // 3. Segment image into regions
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

        // Update target colors of regions based on new palette
        setRegions(prevRegions =>
          prevRegions.map(r => {
            const swatchIdx = r.targetColorIndex % newPalette.length;
            const swatch = newPalette[swatchIdx];
            return {
              ...r,
              targetColorHex: swatch.hex,
              // If already filled, re-evaluate correctness
              isCorrect: r.filledColorHex ? evaluateMove(r, r.filledColorHex, newPalette, newScheme).status === 'correct' : false,
            };
          })
        );
      }
    },
    [rawDominantSwatches, segmentation]
  );

  // Start game from title screen
  const handleStartGame = useCallback(
    async (preset: PresetImage | null, diff: GameDifficulty, model: ColorModelMode) => {
      setDifficulty(diff);
      setColorModel(model);
      setScore(0);
      setMistakes(0);
      setHintsUsed(0);
      setTimerSeconds(0);
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
    [activePreset, colorScheme, initializePuzzle]
  );

  // Handle user uploaded image
  const handleImageReady = useCallback(
    async (img: HTMLImageElement, diff: GameDifficulty) => {
      setCustomImage(img);
      setDifficulty(diff);
      setScore(0);
      setMistakes(0);
      setHintsUsed(0);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setLastFeedback(null);

      await initializePuzzle(img, diff, colorScheme, colorModel);
      setPhase('playing');
    },
    [colorScheme, colorModel, initializePuzzle]
  );

  // Interactive Region Click handler
  const handleRegionClick = useCallback(
    (regionId: number) => {
      const regionIndex = regions.findIndex(r => r.id === regionId);
      if (regionIndex === -1) return;

      const region = regions[regionIndex];
      const selectedSwatch = activePalette[selectedSwatchIndex];
      if (!selectedSwatch) return;

      // If region is already correct, provide friendly notice
      if (region.isCorrect) {
        sounds.playClick();
        setLastFeedback({
          message: `Region #${regionId} is already harmoniously painted!`,
          type: 'correct',
        });
        return;
      }

      // Evaluate the player's move
      const evalResult = evaluateMove(region, selectedSwatch.hex, activePalette, colorScheme);

      if (evalResult.status === 'correct') {
        sounds.playCorrect();
        const updatedRegion: RegionData = {
          ...region,
          filledColorHex: selectedSwatch.hex,
          isCorrect: true,
        };
        const nextRegions = [...regions];
        nextRegions[regionIndex] = updatedRegion;
        setRegions(nextRegions);

        setScore(s => updateScore(s, evalResult.pointsDelta));
        setHistory(prev => [
          ...prev,
          {
            regionId,
            previousColorHex: region.filledColorHex,
            newColorHex: selectedSwatch.hex,
            wasCorrect: true,
            pointsEarned: evalResult.pointsDelta,
          },
        ]);
        setLastFeedback({ message: evalResult.message, type: 'correct' });

        // Clear hint if this was the hint region
        if (hintRegionId === regionId) {
          setHintRegionId(null);
        }

        // Check if puzzle is complete
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
          filledColorHex: selectedSwatch.hex,
          isCorrect: true,
        };
        const nextRegions = [...regions];
        nextRegions[regionIndex] = updatedRegion;
        setRegions(nextRegions);

        setScore(s => updateScore(s, evalResult.pointsDelta));
        setHistory(prev => [
          ...prev,
          {
            regionId,
            previousColorHex: region.filledColorHex,
            newColorHex: selectedSwatch.hex,
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
        // Incorrect color choice
        sounds.playIncorrect();
        setMistakes(m => m + 1);
        setScore(s => updateScore(s, evalResult.pointsDelta));
        setLastFeedback({ message: evalResult.message, type: 'incorrect' });
      }
    },
    [regions, activePalette, selectedSwatchIndex, colorScheme, hintRegionId, score, mistakes, hintsUsed]
  );

  // Hint button handler
  const handleHint = useCallback(() => {
    const hintRegion = findHintRegion(regions);
    if (!hintRegion) return;

    sounds.playHint();
    setHintsUsed(h => h + 1);
    setScore(s => updateScore(s, -SCORING.HINT_PENALTY));
    setHintRegionId(hintRegion.id);

    // Automatically select the required target swatch for player
    if (hintRegion.targetColorIndex < activePalette.length) {
      setSelectedSwatchIndex(hintRegion.targetColorIndex);
    }

    setLastFeedback({
      message: `Hint used (-25 pts): Region #${hintRegion.id} needs Swatch #${hintRegion.targetColorIndex + 1}!`,
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
    setLastFeedback({ message: 'Puzzle reset. All regions cleared.', type: 'compatible' });
  }, []);

  // Regenerate segmentation
  const handleRegenerate = useCallback(async () => {
    const currentImg = customImage || (await loadImage(activePreset.svgDataUri));
    await initializePuzzle(currentImg, difficulty, colorScheme, colorModel);
    setLastFeedback({ message: 'Puzzle regenerated with fresh boundaries.', type: 'compatible' });
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

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
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
            difficulty={difficulty}
            colorScheme={colorScheme}
            colorModel={colorModel}
            canUndo={history.length > 0}
            onUndo={handleUndo}
            onHint={handleHint}
            onReset={handleResetPuzzle}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onReturnToTitle={() => {
              setPhase('title');
              setIsTimerRunning(false);
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />

          {/* Feedback Banner */}
          {lastFeedback && (
            <div
              className={`w-full py-1.5 px-4 text-center text-xs font-semibold tracking-wide transition-all ${
                lastFeedback.type === 'correct'
                  ? 'bg-amber-500/20 text-amber-300 border-b border-amber-500/30'
                  : lastFeedback.type === 'compatible'
                  ? 'bg-blue-500/20 text-blue-300 border-b border-blue-500/30'
                  : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
              }`}
            >
              {lastFeedback.message}
            </div>
          )}

          {/* Center Playfield: Puzzle Canvas & Optional Color Inspector */}
          <div className="relative flex-1 flex flex-col md:flex-row min-h-0 w-full overflow-hidden">
            <main
              aria-label="Coloring Canvas Area"
              className="flex-1 h-full min-h-0 relative"
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
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                  Loading puzzle matrix...
                </div>
              )}
            </main>

            {/* Sliding Color Inspector Panel */}
            {isInspectorOpen && (
              <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 p-4 bg-slate-950 overflow-y-auto shrink-0">
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
          />
        </>
      )}

      {/* Paused Modal */}
      {phase === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <h2 id="pause-title" className="text-xl font-bold text-slate-100 mb-2">
              Game Paused
            </h2>
            <p className="text-xs text-slate-400 mb-6">Take your time to study the chromatic harmonies.</p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setPhase('playing');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
              >
                Resume Quest
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  handleResetPuzzle();
                  setPhase('playing');
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer"
              >
                Restart Current Puzzle
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setPhase('title');
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer"
              >
                Exit to Title
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
          elapsedSeconds={timerSeconds}
          difficulty={difficulty}
          colorScheme={colorScheme}
          onReplay={() => {
            handleResetPuzzle();
            setScore(0);
            setMistakes(0);
            setHintsUsed(0);
            setTimerSeconds(0);
            setIsTimerRunning(true);
            setPhase('playing');
          }}
          onNextPreset={handleNextPreset}
          onReturnToTitle={() => {
            setPhase('title');
          }}
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
