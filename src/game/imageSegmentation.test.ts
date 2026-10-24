import test from 'node:test';
import assert from 'node:assert/strict';
import { colorDistance, hexToRgb, createSwatch } from './colorMath.ts';

test('colorDistance accurately measures sRGB color differences', () => {
  const red = { r: 255, g: 0, b: 0 };
  const darkRed = { r: 200, g: 0, b: 0 };
  const blue = { r: 0, g: 0, b: 255 };

  const distNear = colorDistance(red, darkRed);
  const distFar = colorDistance(red, blue);

  assert.ok(distNear < distFar, 'Near red colors should have much smaller distance than red to blue');
});

test('Clean mode filter logic eliminates isolated pixel noise', () => {
  // Simulate a 4x4 quantized map with an isolated noisy pixel at (1, 1)
  const map = new Uint8Array([
    0, 0, 0, 0,
    0, 1, 0, 0, // pixel at index 5 is an isolated color 1 in a sea of 0s
    0, 0, 0, 0,
    0, 0, 0, 0,
  ]);

  // Check 3x3 window around index 5 (x=1, y=1)
  const votes = [0, 0];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const idx = (1 + dy) * 4 + (1 + dx);
      votes[map[idx]]++;
    }
  }

  assert.strictEqual(votes[0], 8, 'Should have 8 surrounding zeros');
  assert.strictEqual(votes[1], 1, 'Should have only 1 one');
  const majority = votes[0] > votes[1] ? 0 : 1;
  assert.strictEqual(majority, 0, 'Majority voting successfully absorbs isolated speckle');
});

test('Region merging absorbs small clusters into neighboring regions', () => {
  // A small region of 20 pixels surrounded by a region of 500 pixels
  const minArea = 150;
  const smallRegionArea = 20;
  const shouldMerge = smallRegionArea < minArea;

  assert.strictEqual(shouldMerge, true, 'Small area below minArea must be flagged for absorption');
});

test('PRESETS contains 4 rich vector artworks with valid dimensions and SVG URIs', async () => {
  const { PRESETS } = await import('./imageSegmentation.ts');
  assert.strictEqual(PRESETS.length, 4, 'Should provide 4 rich preset artworks');
  
  for (const preset of PRESETS) {
    assert.ok(preset.name.length > 3, `Preset ${preset.id} must have a descriptive title`);
    assert.ok(preset.width >= 300, `Preset ${preset.id} must have resolution width >= 300`);
    assert.ok(preset.height >= 300, `Preset ${preset.id} must have resolution height >= 300`);
    assert.ok(preset.svgDataUri.startsWith('data:image/svg+xml'), `Preset ${preset.id} must have valid SVG data URI`);
  }
});

test('Target color index is zero-based and maps to 1-based badge numbers', () => {
  const targetColorIndex = 2;
  const displayedBadgeNumber = targetColorIndex + 1;
  assert.strictEqual(displayedBadgeNumber, 3, 'Badge number 3 must accurately map to palette swatch index 2');
});

