import type { RegionData, ColorSwatch, ColorSchemeType, PaintAction, GameStats } from '../types/game.ts';
import { areColorsEqual, isWarmHue, isCoolHue, rgbToHsv, hexToRgb } from './colorMath.ts';

export const SCORING = {
  CORRECT: 100,
  COMPATIBLE: 40,
  INCORRECT_PENALTY: 10,
  HINT_PENALTY: 25,
  COMPLETION_BONUS: 500,
  PERFECT_BONUS: 1000,
};

export interface EvaluationResult {
  status: 'correct' | 'compatible' | 'incorrect';
  pointsDelta: number;
  message: string;
}

/**
 * Evaluates a player's painting move against the target region and active color scheme.
 */
export function evaluateMove(
  region: RegionData,
  selectedColorHex: string,
  palette: ColorSwatch[],
  scheme: ColorSchemeType
): EvaluationResult {
  const targetHex = region.targetColorHex;

  // 1. Exact or near-identical color match
  if (areColorsEqual(selectedColorHex, targetHex, 20)) {
    return {
      status: 'correct',
      pointsDelta: SCORING.CORRECT,
      message: 'Spot on! Correct harmonic color placed.',
    };
  }

  // 2. Scheme-compatible alternative check
  const selectedRgb = hexToRgb(selectedColorHex);
  const selectedHsv = rgbToHsv(selectedRgb);
  const targetRgb = hexToRgb(targetHex);
  const targetHsv = rgbToHsv(targetRgb);

  if (scheme === 'warm' && isWarmHue(selectedHsv.h) && isWarmHue(targetHsv.h)) {
    return {
      status: 'compatible',
      pointsDelta: SCORING.COMPATIBLE,
      message: 'Harmonious warm tone! Matches the warm scheme palette.',
    };
  }

  if (scheme === 'cool' && isCoolHue(selectedHsv.h) && isCoolHue(targetHsv.h)) {
    return {
      status: 'compatible',
      pointsDelta: SCORING.COMPATIBLE,
      message: 'Harmonious cool tone! Matches the cool scheme palette.',
    };
  }

  if (scheme === 'monochromatic') {
    const hueDiff = Math.abs(selectedHsv.h - targetHsv.h);
    const circularHueDiff = Math.min(hueDiff, 360 - hueDiff);
    if (circularHueDiff < 20) {
      return {
        status: 'compatible',
        pointsDelta: SCORING.COMPATIBLE,
        message: 'Valid monochromatic shade! Fits the base hue family.',
      };
    }
  }

  // 3. Incorrect color selection
  let guidance = 'Incorrect color choice for this region.';
  if (scheme === 'warm' && !isWarmHue(selectedHsv.h)) {
    guidance = 'Notice: This is a cool hue, but the active puzzle uses a Warm harmony scheme!';
  } else if (scheme === 'cool' && !isCoolHue(selectedHsv.h)) {
    guidance = 'Notice: This is a warm hue, but the active puzzle uses a Cool harmony scheme!';
  } else if (scheme === 'complementary') {
    guidance = `Try the complementary opposite color on the color wheel for Region #${region.id}.`;
  }

  return {
    status: 'incorrect',
    pointsDelta: -SCORING.INCORRECT_PENALTY,
    message: guidance,
  };
}

/**
 * Calculates current progress percentage (0 - 100).
 */
export function calculateProgress(regions: RegionData[]): number {
  if (regions.length === 0) return 0;
  const filled = regions.filter(r => r.isCorrect).length;
  return Math.round((filled / regions.length) * 100);
}

/**
 * Checks if the entire puzzle has been successfully completed.
 */
export function checkCompletion(regions: RegionData[]): boolean {
  if (regions.length === 0) return false;
  return regions.every(r => r.isCorrect);
}

/**
 * Provides an uncompleted region hint, prioritizing the largest unfilled regions.
 */
export function findHintRegion(regions: RegionData[]): RegionData | null {
  const unfilled = regions.filter(r => !r.isCorrect);
  if (unfilled.length === 0) return null;
  // Pick the unfilled region with highest pixel count (prominent area)
  return [...unfilled].sort((a, b) => b.pixelCount - a.pixelCount)[0];
}

/**
 * Calculates final score including bonuses.
 */
export function calculateFinalScore(stats: {
  baseScore: number;
  mistakes: number;
  hintsUsed: number;
  isCompleted: boolean;
}): number {
  if (!stats.isCompleted) {
    return Math.max(0, stats.baseScore);
  }

  let final = stats.baseScore + SCORING.COMPLETION_BONUS;
  if (stats.mistakes === 0 && stats.hintsUsed === 0) {
    final += SCORING.PERFECT_BONUS;
  }
  return Math.max(0, final);
}

/**
 * Helper to update game stats safely without negative scores.
 */
export function updateScore(currentScore: number, delta: number): number {
  return Math.max(0, currentScore + delta);
}
