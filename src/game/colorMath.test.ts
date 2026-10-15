import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rgbToHex,
  hexToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToCmyk,
  cmykToRgb,
  isWarmHue,
  isCoolHue,
  colorDistance,
  areColorsEqual,
  generateHarmonicPalette,
  createSwatch,
} from './colorMath.ts';

test('rgbToHex and hexToRgb conversions are bidirectional', () => {
  const red = { r: 255, g: 0, b: 0 };
  assert.equal(rgbToHex(red), '#FF0000');
  assert.deepEqual(hexToRgb('#FF0000'), red);

  const mixed = { r: 42, g: 157, b: 244 };
  assert.equal(rgbToHex(mixed), '#2A9DF4');
  assert.deepEqual(hexToRgb('#2A9DF4'), mixed);

  const white = { r: 255, g: 255, b: 255 };
  assert.equal(rgbToHex(white), '#FFFFFF');
  assert.deepEqual(hexToRgb('#FFFFFF'), white);

  const black = { r: 0, g: 0, b: 0 };
  assert.equal(rgbToHex(black), '#000000');
  assert.deepEqual(hexToRgb('#000000'), black);
});

test('rgbToHsv and hsvToRgb handle primary hues and hue wraparound', () => {
  // Pure Red: Hue 0
  const hsvRed = rgbToHsv({ r: 255, g: 0, b: 0 });
  assert.equal(hsvRed.h, 0);
  assert.equal(hsvRed.s, 100);
  assert.equal(hsvRed.v, 100);
  const rgbBackRed = hsvToRgb(hsvRed);
  assert.deepEqual(rgbBackRed, { r: 255, g: 0, b: 0 });

  // Pure Green: Hue 120
  const hsvGreen = rgbToHsv({ r: 0, g: 255, b: 0 });
  assert.equal(hsvGreen.h, 120);

  // Pure Blue: Hue 240
  const hsvBlue = rgbToHsv({ r: 0, g: 0, b: 255 });
  assert.equal(hsvBlue.h, 240);

  // Hue Wraparound check: 370 degrees should map to 10 degrees
  const wrappedRgb = hsvToRgb({ h: 370, s: 100, v: 100 });
  const standardRgb = hsvToRgb({ h: 10, s: 100, v: 100 });
  assert.deepEqual(wrappedRgb, standardRgb);
});

test('rgbToCmyk and cmykToRgb handle black and primary pigments', () => {
  // Pure Black -> K: 100%
  const blackCmyk = rgbToCmyk({ r: 0, g: 0, b: 0 });
  assert.equal(blackCmyk.k, 100);
  assert.equal(blackCmyk.c, 0);
  assert.equal(blackCmyk.m, 0);
  assert.equal(blackCmyk.y, 0);
  const blackRgb = cmykToRgb(blackCmyk);
  assert.deepEqual(blackRgb, { r: 0, g: 0, b: 0 });

  // Pure White -> C: 0, M: 0, Y: 0, K: 0
  const whiteCmyk = rgbToCmyk({ r: 255, g: 255, b: 255 });
  assert.equal(whiteCmyk.k, 0);
  assert.equal(whiteCmyk.c, 0);
  assert.equal(whiteCmyk.m, 0);
  assert.equal(whiteCmyk.y, 0);
  const whiteRgb = cmykToRgb(whiteCmyk);
  assert.deepEqual(whiteRgb, { r: 255, g: 255, b: 255 });

  // Pure Cyan (0, 255, 255) -> C: 100%, M: 0%, Y: 0%, K: 0%
  const cyanCmyk = rgbToCmyk({ r: 0, g: 255, b: 255 });
  assert.equal(cyanCmyk.c, 100);
  assert.equal(cyanCmyk.m, 0);
  assert.equal(cyanCmyk.y, 0);
  assert.equal(cyanCmyk.k, 0);

  // Pure Magenta (255, 0, 255) -> C: 0%, M: 100%, Y: 0%, K: 0%
  const magentaCmyk = rgbToCmyk({ r: 255, g: 0, b: 255 });
  assert.equal(magentaCmyk.m, 100);

  // Pure Yellow (255, 255, 0) -> C: 0%, M: 0%, Y: 100%, K: 0%
  const yellowCmyk = rgbToCmyk({ r: 255, g: 255, b: 0 });
  assert.equal(yellowCmyk.y, 100);
});

test('Warm and Cool hue classifications are mathematically consistent', () => {
  // Warm hues: [330, 360] U [0, 80]
  assert.equal(isWarmHue(0), true);    // Red
  assert.equal(isWarmHue(30), true);   // Orange
  assert.equal(isWarmHue(60), true);   // Yellow
  assert.equal(isWarmHue(345), true);  // Crimson / Ruby
  assert.equal(isWarmHue(720), true);  // Wraparound check

  // Cool hues: [90, 270]
  assert.equal(isCoolHue(120), true);  // Green
  assert.equal(isCoolHue(180), true);  // Cyan
  assert.equal(isCoolHue(220), true);  // Azure
  assert.equal(isCoolHue(240), true);  // Cobalt Blue

  // Mutually exclusive clear boundaries
  assert.equal(isWarmHue(180), false);
  assert.equal(isCoolHue(30), false);
});

test('Perceptual color distance distinguishes near vs far colors', () => {
  const red1 = { r: 255, g: 0, b: 0 };
  const red2 = { r: 250, g: 4, b: 4 };
  const blue = { r: 0, g: 0, b: 255 };

  assert.equal(areColorsEqual(red1, red2, 18), true);
  assert.equal(areColorsEqual(red1, blue, 18), false);
  assert.ok(colorDistance(red1, red2) < colorDistance(red1, blue));
});

test('Harmonic palette generation supports all 5 schemes', () => {
  const baseSwatch = createSwatch({ r: 220, g: 50, b: 50 }, 'base'); // Red hue ~0

  // 1. Monochromatic (constant hue, varied S & V)
  const mono = generateHarmonicPalette([baseSwatch], 'monochromatic', 5);
  assert.equal(mono.length, 5);
  for (const s of mono) {
    const diff = Math.min(Math.abs(s.hsv.h - baseSwatch.hsv.h), 360 - Math.abs(s.hsv.h - baseSwatch.hsv.h));
    assert.ok(diff <= 5, `Expected hue near ${baseSwatch.hsv.h}, got ${s.hsv.h}`);
  }

  // 2. Complementary (contains opposite hue ~ 180 deg)
  const comp = generateHarmonicPalette([baseSwatch], 'complementary', 4);
  assert.equal(comp.length, 4);
  const compHues = comp.map(s => s.hsv.h);
  const hasComplement = compHues.some(h => Math.abs(h - 180) < 15);
  assert.ok(hasComplement, 'Expected complementary palette to include opposite hue');

  // 3. Analogous (contains neighboring hues +/- 35 deg)
  const ana = generateHarmonicPalette([baseSwatch], 'analogous', 4);
  assert.equal(ana.length, 4);

  // 4. Warm scheme (all hues are warm)
  const warm = generateHarmonicPalette([baseSwatch], 'warm', 5);
  assert.equal(warm.length, 5);
  for (const s of warm) {
    assert.equal(isWarmHue(s.hsv.h), true, `Expected warm hue, got ${s.hsv.h}`);
  }

  // 5. Cool scheme (all hues are cool)
  const cool = generateHarmonicPalette([baseSwatch], 'cool', 5);
  assert.equal(cool.length, 5);
  for (const s of cool) {
    assert.equal(isCoolHue(s.hsv.h), true, `Expected cool hue, got ${s.hsv.h}`);
  }
});
