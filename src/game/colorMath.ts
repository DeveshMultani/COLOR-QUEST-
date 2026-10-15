import type { ColorRGB, ColorCMYK, ColorHSV, ColorSwatch, ColorSchemeType } from '../types/game.ts';

export function rgbToHex(rgb: ColorRGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const r = clamp(rgb.r).toString(16).padStart(2, '0');
  const g = clamp(rgb.g).toString(16).padStart(2, '0');
  const b = clamp(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

export function hexToRgb(hex: string): ColorRGB {
  let cleanHex = hex.replace(/^#/, '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const intVal = parseInt(cleanHex, 16);
  if (isNaN(intVal) || cleanHex.length !== 6) {
    return { r: 128, g: 128, b: 128 };
  }
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

export function rgbToHsv(rgb: ColorRGB): ColorHSV {
  const rNorm = Math.max(0, Math.min(255, rgb.r)) / 255;
  const gNorm = Math.max(0, Math.min(255, rgb.g)) / 255;
  const bNorm = Math.max(0, Math.min(255, rgb.b)) / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta > 0.00001) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

export function hsvToRgb(hsv: ColorHSV): ColorRGB {
  const h = ((hsv.h % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, hsv.s)) / 100;
  const v = Math.max(0, Math.min(100, hsv.v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/**
 * Standard Additive RGB to Subtractive CMYK conversion.
 * Cyan, Magenta, Yellow, blacK (0 to 100%).
 * Accurately handles black (K=100) and ink balance.
 */
export function rgbToCmyk(rgb: ColorRGB): ColorCMYK {
  const rNorm = Math.max(0, Math.min(255, rgb.r)) / 255;
  const gNorm = Math.max(0, Math.min(255, rgb.g)) / 255;
  const bNorm = Math.max(0, Math.min(255, rgb.b)) / 255;

  const kNorm = 1 - Math.max(rNorm, gNorm, bNorm);
  if (kNorm >= 0.9999) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rNorm - kNorm) / (1 - kNorm)) * 100);
  const m = Math.round(((1 - gNorm - kNorm) / (1 - kNorm)) * 100);
  const y = Math.round(((1 - bNorm - kNorm) / (1 - kNorm)) * 100);
  const k = Math.round(kNorm * 100);

  return {
    c: Math.max(0, Math.min(100, c)),
    m: Math.max(0, Math.min(100, m)),
    y: Math.max(0, Math.min(100, y)),
    k: Math.max(0, Math.min(100, k)),
  };
}

/**
 * Subtractive CMYK to Additive RGB conversion.
 */
export function cmykToRgb(cmyk: ColorCMYK): ColorRGB {
  const cNorm = Math.max(0, Math.min(100, cmyk.c)) / 100;
  const mNorm = Math.max(0, Math.min(100, cmyk.m)) / 100;
  const yNorm = Math.max(0, Math.min(100, cmyk.y)) / 100;
  const kNorm = Math.max(0, Math.min(100, cmyk.k)) / 100;

  const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
  const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
  const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
  };
}

/**
 * Documented Warm classification:
 * Hues in [330, 360] or [0, 80] (Crimson, Red, Orange, Amber, Warm Yellow).
 */
export function isWarmHue(hue: number): boolean {
  const h = ((hue % 360) + 360) % 360;
  return h >= 330 || h <= 80;
}

/**
 * Documented Cool classification:
 * Hues in [90, 270] (Emerald, Green, Cyan, Azure, Cobalt, Deep Blue).
 */
export function isCoolHue(hue: number): boolean {
  const h = ((hue % 360) + 360) % 360;
  return h >= 90 && h <= 270;
}

/**
 * Redmean perceptual color distance metric.
 * Excellent approximation of human vision color discrimination without heavy CIEDE2000 matrices.
 */
export function colorDistance(c1: ColorRGB, c2: ColorRGB): number {
  const rMean = (c1.r + c2.r) / 2;
  const dR = c1.r - c2.r;
  const dG = c1.g - c2.g;
  const dB = c1.b - c2.b;
  const weightR = 2 + rMean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rMean) / 256;
  return Math.sqrt(weightR * dR * dR + weightG * dG * dG + weightB * dB * dB);
}

/**
 * Checks if two colors are perceptually equivalent within a tolerance.
 */
export function areColorsEqual(c1: string | ColorRGB, c2: string | ColorRGB, tolerance = 18): boolean {
  const rgb1 = typeof c1 === 'string' ? hexToRgb(c1) : c1;
  const rgb2 = typeof c2 === 'string' ? hexToRgb(c2) : c2;
  return colorDistance(rgb1, rgb2) <= tolerance;
}

/**
 * Assigns an intuitive educational name to a color based on HSV values.
 */
export function getColorName(rgb: ColorRGB): string {
  const hsv = rgbToHsv(rgb);
  const { h, s, v } = hsv;

  if (v < 12) return 'Obsidian Black';
  if (s < 10) {
    if (v > 90) return 'Pure Alabaster';
    if (v > 70) return 'Silver Mist';
    if (v > 40) return 'Neutral Slate';
    return 'Deep Charcoal';
  }

  // Hue naming
  if (h >= 345 || h < 12) {
    if (v < 45) return 'Crimson Shadow';
    if (s < 50) return 'Rose Quartz';
    return 'Ruby Vermilion';
  }
  if (h >= 12 && h < 42) {
    if (v < 50) return 'Burnt Sienna';
    if (s < 60) return 'Warm Terracotta';
    return 'Solar Tangerine';
  }
  if (h >= 42 && h < 68) {
    if (s < 50) return 'Champagne Gold';
    return 'Sunlit Amber';
  }
  if (h >= 68 && h < 155) {
    if (v < 45) return 'Forest Pine';
    if (s < 45) return 'Sage Mint';
    return 'Emerald Oasis';
  }
  if (h >= 155 && h < 205) {
    if (s < 45) return 'Glacier Teal';
    return 'Vibrant Cyan';
  }
  if (h >= 205 && h < 255) {
    if (v < 45) return 'Midnight Abyss';
    if (s < 50) return 'Steel Cobalt';
    return 'Azure Horizon';
  }
  if (h >= 255 && h < 290) {
    if (v < 45) return 'Imperial Indigo';
    return 'Royal Violet';
  }
  if (h >= 290 && h < 345) {
    if (v < 45) return 'Deep Mulberry';
    return 'Prismatic Magenta';
  }
  return 'Prismatic Tint';
}

export function createSwatch(rgb: ColorRGB, id: string): ColorSwatch {
  const hex = rgbToHex(rgb);
  const cmyk = rgbToCmyk(rgb);
  const hsv = rgbToHsv(rgb);
  const isWarm = isWarmHue(hsv.h);
  const name = getColorName(rgb);
  
  const tempDesc = isWarm ? 'Warm radiant tone' : 'Cool serene tone';
  const desc = `${name} (${tempDesc}) · Hue ${hsv.h}° at ${hsv.s}% saturation.`;

  return {
    id,
    name,
    hex,
    rgb,
    cmyk,
    hsv,
    isWarm,
    description: desc,
  };
}

/**
 * Generates an educational palette according to one of the 5 requested colour schemes.
 * 1. Monochromatic: One base hue with variations in saturation and value.
 * 2. Complementary: Two hues opposite each other on the 360° colour wheel.
 * 3. Analogous: Three neighboring hues around the selected dominant hue (+/- 30°).
 * 4. Warm: Palette mapped to warm hue spectrum [330°-360°] U [0°-80°].
 * 5. Cool: Palette mapped to cool hue spectrum [90°-270°].
 * Plus preserves original natural palette.
 */
export function generateHarmonicPalette(
  dominantSwatches: ColorSwatch[],
  scheme: ColorSchemeType,
  targetCount = 6
): ColorSwatch[] {
  if (dominantSwatches.length === 0) {
    return [
      createSwatch({ r: 239, g: 68, b: 68 }, 'swatch-1'),
      createSwatch({ r: 59, g: 130, b: 246 }, 'swatch-2'),
      createSwatch({ r: 34, g: 197, b: 94 }, 'swatch-3'),
      createSwatch({ r: 234, g: 179, b: 8 }, 'swatch-4'),
    ];
  }

  if (scheme === 'original') {
    return dominantSwatches.slice(0, targetCount);
  }

  const primary = dominantSwatches[0];
  const baseH = primary.hsv.h;
  const baseS = primary.hsv.s > 20 ? primary.hsv.s : 75;
  const baseV = primary.hsv.v > 30 ? primary.hsv.v : 80;

  const result: ColorSwatch[] = [];

  switch (scheme) {
    case 'monochromatic': {
      // 1 base hue with variations in saturation and value
      const steps = [
        { s: Math.max(15, baseS - 35), v: Math.min(95, baseV + 20) }, // highlight/tint
        { s: baseS, v: baseV },                                       // pure base
        { s: Math.min(95, baseS + 15), v: Math.max(30, baseV - 25) }, // tone
        { s: Math.max(40, baseS - 10), v: Math.max(20, baseV - 45) }, // shadow/shade
        { s: Math.max(10, baseS - 45), v: Math.min(98, baseV + 30) }, // pale tint
        { s: Math.min(100, baseS + 20), v: Math.max(15, baseV - 60) },// deep shade
      ];
      for (let i = 0; i < Math.min(targetCount, steps.length); i++) {
        const rgb = hsvToRgb({ h: baseH, s: steps[i].s, v: steps[i].v });
        result.push(createSwatch(rgb, `mono-${i + 1}`));
      }
      break;
    }

    case 'complementary': {
      // 2 hues opposite each other on the colour wheel: baseH & (baseH + 180)%360
      const compH = (baseH + 180) % 360;
      const hues = [baseH, compH];
      const variations = [
        { hueIdx: 0, s: baseS, v: baseV },
        { hueIdx: 1, s: baseS, v: baseV },
        { hueIdx: 0, s: Math.max(20, baseS - 30), v: Math.min(95, baseV + 15) },
        { hueIdx: 1, s: Math.max(20, baseS - 30), v: Math.min(95, baseV + 15) },
        { hueIdx: 0, s: Math.min(95, baseS + 10), v: Math.max(30, baseV - 30) },
        { hueIdx: 1, s: Math.min(95, baseS + 10), v: Math.max(30, baseV - 30) },
      ];
      for (let i = 0; i < Math.min(targetCount, variations.length); i++) {
        const v = variations[i];
        const rgb = hsvToRgb({ h: hues[v.hueIdx], s: v.s, v: v.v });
        result.push(createSwatch(rgb, `comp-${i + 1}`));
      }
      break;
    }

    case 'analogous': {
      // 3 neighbouring hues around selected dominant hue: (H - 35), H, (H + 35)
      const hLeft = ((baseH - 35) + 360) % 360;
      const hCenter = baseH;
      const hRight = (baseH + 35) % 360;
      const triplets = [
        { h: hLeft, s: baseS, v: baseV },
        { h: hCenter, s: baseS, v: baseV },
        { h: hRight, s: baseS, v: baseV },
        { h: hLeft, s: Math.max(25, baseS - 25), v: Math.min(95, baseV + 15) },
        { h: hCenter, s: Math.min(95, baseS + 10), v: Math.max(35, baseV - 25) },
        { h: hRight, s: Math.max(30, baseS - 15), v: Math.min(90, baseV + 10) },
      ];
      for (let i = 0; i < Math.min(targetCount, triplets.length); i++) {
        const t = triplets[i];
        const rgb = hsvToRgb({ h: t.h, s: t.s, v: t.v });
        result.push(createSwatch(rgb, `ana-${i + 1}`));
      }
      break;
    }

    case 'warm': {
      // Warm spectrum: [330-360] or [0-80] (reds, oranges, warm yellows, golds)
      const warmHues = [355, 18, 38, 52, 10, 338];
      for (let i = 0; i < Math.min(targetCount, warmHues.length); i++) {
        const h = warmHues[i];
        const s = Math.min(95, Math.max(45, baseS + (i % 2 === 0 ? 5 : -15)));
        const v = Math.min(95, Math.max(50, baseV + (i % 2 === 0 ? -10 : 15)));
        const rgb = hsvToRgb({ h, s, v });
        result.push(createSwatch(rgb, `warm-${i + 1}`));
      }
      break;
    }

    case 'cool': {
      // Cool spectrum: [90-270] (emerald green, teal, sky cyan, sapphire blue, cobalt)
      const coolHues = [140, 175, 198, 220, 245, 120];
      for (let i = 0; i < Math.min(targetCount, coolHues.length); i++) {
        const h = coolHues[i];
        const s = Math.min(95, Math.max(45, baseS + (i % 2 === 0 ? 5 : -15)));
        const v = Math.min(95, Math.max(50, baseV + (i % 2 === 0 ? -10 : 15)));
        const rgb = hsvToRgb({ h, s, v });
        result.push(createSwatch(rgb, `cool-${i + 1}`));
      }
      break;
    }
  }

  return result;
}
