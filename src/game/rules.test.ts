import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateMove,
  calculateProgress,
  checkCompletion,
  findHintRegion,
  calculateFinalScore,
  updateScore,
  SCORING,
} from './rules.ts';
import { createSwatch } from './colorMath.ts';
import type { RegionData } from '../types/game.ts';

const mockRegion = (id: number, targetHex: string, isCorrect = false, pixelCount = 100): RegionData => ({
  id,
  label: `Region ${id}`,
  targetColorIndex: 0,
  targetColorHex: targetHex,
  filledColorHex: isCorrect ? targetHex : null,
  isCorrect,
  pixelCount,
  centerX: 50,
  centerY: 50,
  bbox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
});

test('evaluateMove rewards exact match and penalizes incorrect color', () => {
  const redHex = '#FF0000';
  const blueHex = '#0000FF';
  const region = mockRegion(1, redHex);
  const palette = [createSwatch({ r: 255, g: 0, b: 0 }, '1'), createSwatch({ r: 0, g: 0, b: 255 }, '2')];

  // Exact match
  const correctRes = evaluateMove(region, redHex, palette, 'original');
  assert.equal(correctRes.status, 'correct');
  assert.equal(correctRes.pointsDelta, SCORING.CORRECT);

  // Mismatch
  const incorrectRes = evaluateMove(region, blueHex, palette, 'original');
  assert.equal(incorrectRes.status, 'incorrect');
  assert.equal(incorrectRes.pointsDelta, -SCORING.INCORRECT_PENALTY);
});

test('evaluateMove detects scheme-compatible alternative in warm/cool modes', () => {
  const warmTargetHex = '#FF3300'; // Warm Red-Orange
  const warmAlternativeHex = '#FFAA00'; // Warm Amber
  const coolTargetHex = '#0066FF'; // Cool Azure
  const coolAlternativeHex = '#00CC88'; // Cool Emerald

  const warmRegion = mockRegion(2, warmTargetHex);
  const coolRegion = mockRegion(3, coolTargetHex);

  const warmRes = evaluateMove(warmRegion, warmAlternativeHex, [], 'warm');
  assert.equal(warmRes.status, 'compatible');
  assert.equal(warmRes.pointsDelta, SCORING.COMPATIBLE);

  const coolRes = evaluateMove(coolRegion, coolAlternativeHex, [], 'cool');
  assert.equal(coolRes.status, 'compatible');
  assert.equal(coolRes.pointsDelta, SCORING.COMPATIBLE);
});

test('calculateProgress tracks completion percentage', () => {
  const regions: RegionData[] = [
    mockRegion(1, '#FF0000', true),
    mockRegion(2, '#00FF00', true),
    mockRegion(3, '#0000FF', false),
    mockRegion(4, '#FFFF00', false),
  ];
  assert.equal(calculateProgress(regions), 50);

  regions[2].isCorrect = true;
  assert.equal(calculateProgress(regions), 75);

  regions[3].isCorrect = true;
  assert.equal(calculateProgress(regions), 100);
});

test('checkCompletion triggers only when all regions are correct', () => {
  const regions: RegionData[] = [
    mockRegion(1, '#FF0000', true),
    mockRegion(2, '#00FF00', false),
  ];
  assert.equal(checkCompletion(regions), false);

  regions[1].isCorrect = true;
  assert.equal(checkCompletion(regions), true);
});

test('findHintRegion prioritizes largest unfilled region', () => {
  const regions: RegionData[] = [
    mockRegion(1, '#FF0000', true, 500),
    mockRegion(2, '#00FF00', false, 120),
    mockRegion(3, '#0000FF', false, 450), // Largest unfilled
  ];

  const hint = findHintRegion(regions);
  assert.ok(hint);
  assert.equal(hint.id, 3);
});

test('calculateFinalScore awards bonuses for completion and perfection', () => {
  // Incomplete
  assert.equal(calculateFinalScore({ baseScore: 400, mistakes: 0, hintsUsed: 0, isCompleted: false }), 400);

  // Completed with mistakes
  assert.equal(calculateFinalScore({ baseScore: 400, mistakes: 2, hintsUsed: 1, isCompleted: true }), 400 + SCORING.COMPLETION_BONUS);

  // Perfect completion
  assert.equal(calculateFinalScore({ baseScore: 400, mistakes: 0, hintsUsed: 0, isCompleted: true }), 400 + SCORING.COMPLETION_BONUS + SCORING.PERFECT_BONUS);
});

test('updateScore avoids accidental negative scores', () => {
  assert.equal(updateScore(0, -10), 0);
  assert.equal(updateScore(5, -10), 0);
  assert.equal(updateScore(20, -10), 10);
  assert.equal(updateScore(100, 100), 200);
});
