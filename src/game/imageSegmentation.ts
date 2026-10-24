import type { RegionData, ColorSwatch, GameDifficulty, PresetImage } from '../types/game.ts';
import { createSwatch, colorDistance, hexToRgb } from './colorMath.ts';

export interface SegmentationResult {
  width: number;
  height: number;
  regions: RegionData[];
  regionMap: Int32Array; // Size: width * height. Stores regionId (1..N)
  boundaryMap: Uint8Array; // 1 if boundary edge, 0 otherwise
  dominantSwatches: ColorSwatch[];
}

/**
 * Handcrafted stained-glass and geometric vector compositions designed for rich, optimal partitions.
 * Each artwork features balanced, distinct, enjoyable partitions without clumping or micro-specks.
 */
export const PRESETS: PresetImage[] = [
  {
    id: 'stained-glass-rose',
    name: 'Cathedral Rose Window',
    description: 'A Gothic rose window with layered petals, radial amber facets, emerald foliage, and cobalt spandrels.',
    difficulty: 'easy',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="%231E3A8A"/>
      <!-- Background corner spandrels -->
      <polygon points="0,0 200,0 100,100" fill="%232563EB" stroke="%23000000" stroke-width="4"/>
      <polygon points="200,0 400,0 300,100" fill="%231D4ED8" stroke="%23000000" stroke-width="4"/>
      <polygon points="400,0 400,200 300,100" fill="%232563EB" stroke="%23000000" stroke-width="4"/>
      <polygon points="400,200 400,400 300,300" fill="%231D4ED8" stroke="%23000000" stroke-width="4"/>
      <polygon points="400,400 200,400 300,300" fill="%232563EB" stroke="%23000000" stroke-width="4"/>
      <polygon points="200,400 0,400 100,300" fill="%231D4ED8" stroke="%23000000" stroke-width="4"/>
      <polygon points="0,400 0,200 100,300" fill="%232563EB" stroke="%23000000" stroke-width="4"/>
      <polygon points="0,200 0,0 100,100" fill="%231D4ED8" stroke="%23000000" stroke-width="4"/>

      <!-- Outer Petals Layer -->
      <path d="M 200 40 C 170 80 170 140 200 160 C 230 140 230 80 200 40 Z" fill="%23DC2626" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 160 C 160 170 120 170 80 200 C 120 230 160 230 200 240 C 200 160 200 160 200 160 Z" fill="%23EF4444" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 240 C 240 230 280 230 320 200 C 280 170 240 170 200 160 C 200 240 200 240 200 240 Z" fill="%23B91C1C" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 240 C 170 260 170 320 200 360 C 230 320 230 260 200 240 Z" fill="%23991B1B" stroke="%23111111" stroke-width="3"/>

      <!-- Diagonal Petals -->
      <path d="M 200 200 C 165 160 125 110 85 85 C 110 125 160 165 200 200 Z" fill="%23F87171" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 200 C 235 160 275 110 315 85 C 290 125 240 165 200 200 Z" fill="%23F43F5E" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 200 C 165 240 125 290 85 315 C 110 275 160 235 200 200 Z" fill="%23E11D48" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 200 C 235 240 275 290 315 315 C 290 275 240 235 200 200 Z" fill="%23BE123C" stroke="%23111111" stroke-width="3"/>

      <!-- Foliage Leaf Quadrants -->
      <path d="M 85 85 C 60 45 35 60 45 95 C 60 115 85 85 85 85 Z" fill="%23047857" stroke="%23111111" stroke-width="3"/>
      <path d="M 315 85 C 340 45 365 60 355 95 C 340 115 315 85 315 85 Z" fill="%23059669" stroke="%23111111" stroke-width="3"/>
      <path d="M 85 315 C 60 355 35 340 45 305 C 60 285 85 315 85 315 Z" fill="%2310B981" stroke="%23111111" stroke-width="3"/>
      <path d="M 315 315 C 340 355 365 340 355 305 C 340 285 315 315 315 315 Z" fill="%23065F46" stroke="%23111111" stroke-width="3"/>

      <!-- Inner Rose Petals -->
      <path d="M 200 130 C 180 155 180 185 200 200 C 220 185 220 155 200 130 Z" fill="%23FDA4AF" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 200 C 185 220 155 220 130 200 C 155 180 185 180 200 200 Z" fill="%23FB7185" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 200 C 215 180 245 180 270 200 C 245 220 215 220 200 200 Z" fill="%23F43F5E" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 200 C 180 215 180 245 200 270 C 220 245 220 215 200 200 Z" fill="%23E11D48" stroke="%23111111" stroke-width="3"/>

      <!-- Center Rosette Core Ring -->
      <circle cx="200" cy="200" r="38" fill="%23FBBF24" stroke="%23111111" stroke-width="3"/>
      <path d="M 200 162 A 38 38 0 0 1 238 200 L 200 200 Z" fill="%23F59E0B" stroke="%23111111" stroke-width="2"/>
      <path d="M 238 200 A 38 38 0 0 1 200 238 L 200 200 Z" fill="%23D97706" stroke="%23111111" stroke-width="2"/>
      <path d="M 200 238 A 38 38 0 0 1 162 200 L 200 200 Z" fill="%23B45309" stroke="%23111111" stroke-width="2"/>
      <path d="M 162 200 A 38 38 0 0 1 200 162 L 200 200 Z" fill="%23FBBF24" stroke="%23111111" stroke-width="2"/>
      <!-- Inner Jewel -->
      <circle cx="200" cy="200" r="16" fill="%23FEF08A" stroke="%23111111" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'tropical-toucan',
    name: 'Rainforest Toucan',
    description: 'An exotic avian composition with segmented rainbow beak, emerald canopy, and sunlit sky facets.',
    difficulty: 'medium',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <!-- Sky Background Facets -->
      <polygon points="0,0 200,0 140,120 0,80" fill="%230F172A" stroke="%23111111" stroke-width="3"/>
      <polygon points="200,0 400,0 400,100 270,90 140,120" fill="%231E293B" stroke="%23111111" stroke-width="3"/>
      <polygon points="400,100 400,240 310,210 270,90" fill="%230F172A" stroke="%23111111" stroke-width="3"/>

      <!-- Canopy Leaves Upper -->
      <path d="M 0 0 L 120 0 L 100 90 L 0 60 Z" fill="%23064E3B" stroke="%23111111" stroke-width="3"/>
      <path d="M 400 0 L 310 0 L 330 80 L 400 60 Z" fill="%23065F46" stroke="%23111111" stroke-width="3"/>
      <path d="M 0 80 L 80 120 L 50 180 L 0 150 Z" fill="%23047857" stroke="%23111111" stroke-width="3"/>

      <!-- Toucan Body Anatomy -->
      <path d="M 150 140 C 120 180 110 270 170 300 C 220 300 230 240 210 180 Z" fill="%231E293B" stroke="%23111111" stroke-width="3"/>
      <path d="M 110 270 C 80 320 100 380 130 390 L 150 310 Z" fill="%230F172A" stroke="%23111111" stroke-width="3"/>
      <path d="M 150 310 L 130 390 L 170 390 L 170 300 Z" fill="%23DC2626" stroke="%23111111" stroke-width="3"/>

      <!-- Chest Bib Gradient Layers -->
      <path d="M 150 140 C 180 155 200 175 190 210 C 165 220 145 200 135 170 Z" fill="%23F59E0B" stroke="%23111111" stroke-width="3"/>
      <path d="M 135 170 C 160 200 185 210 175 240 C 150 250 130 225 125 195 Z" fill="%23EA580C" stroke="%23111111" stroke-width="3"/>
      <path d="M 125 195 C 150 225 170 235 160 260 C 140 265 125 245 120 220 Z" fill="%23EF4444" stroke="%23111111" stroke-width="3"/>

      <!-- Head & Eye -->
      <circle cx="165" cy="125" r="30" fill="%230F172A" stroke="%23111111" stroke-width="3"/>
      <circle cx="155" cy="120" r="12" fill="%2338BDF8" stroke="%23111111" stroke-width="2"/>
      <circle cx="155" cy="120" r="6" fill="%230284C7"/>
      <circle cx="155" cy="120" r="2.5" fill="%23FFFFFF"/>

      <!-- Giant Multi-Segment Beak -->
      <path d="M 175 110 C 220 105 260 120 290 140 L 250 150 L 175 125 Z" fill="%23FDE047" stroke="%23111111" stroke-width="3"/>
      <path d="M 290 140 C 330 155 365 185 375 205 L 325 195 L 250 150 Z" fill="%23FACC15" stroke="%23111111" stroke-width="3"/>
      <path d="M 175 125 L 250 150 L 225 175 L 175 145 Z" fill="%23FB923C" stroke="%23111111" stroke-width="3"/>
      <path d="M 250 150 L 325 195 L 290 205 L 225 175 Z" fill="%23F97316" stroke="%23111111" stroke-width="3"/>
      <path d="M 325 195 C 355 205 375 205 375 205 C 350 225 320 215 290 205 Z" fill="%23DC2626" stroke="%23111111" stroke-width="3"/>
      <path d="M 175 145 L 225 175 L 290 205 C 250 215 200 195 175 165 Z" fill="%230284C7" stroke="%23111111" stroke-width="3"/>

      <!-- Tree Branch -->
      <path d="M 0 290 C 120 280 240 280 400 300 L 400 330 C 240 310 120 310 0 320 Z" fill="%2378350F" stroke="%23111111" stroke-width="3"/>
      <path d="M 0 320 L 140 300 L 100 400 L 0 400 Z" fill="%23047857" stroke="%23111111" stroke-width="3"/>
      <path d="M 240 310 L 400 330 L 400 400 L 210 400 Z" fill="%23059669" stroke="%23111111" stroke-width="3"/>
    </svg>`,
  },


  {
    id: 'japanese-koi',
    name: 'Imperial Koi & Lotus',
    description: 'An elegant pond composition with crimson koi fish, aquatic ripple facets, and floating lotus petals.',
    difficulty: 'medium',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <!-- Water Ripples Background -->
      <polygon points="0,0 200,0 120,100 0,70" fill="%230C4A6E"/>
      <polygon points="200,0 400,0 360,110 120,100" fill="%23075985"/>
      <polygon points="400,0 400,200 300,160 360,110" fill="%230369A1"/>
      <polygon points="0,70 120,100 100,240 0,220" fill="%23075985"/>
      <polygon points="0,220 100,240 80,400 0,400" fill="%230C4A6E"/>
      <polygon points="400,200 400,400 270,360 300,160" fill="%230284C7"/>
      <polygon points="80,400 270,360 400,400" fill="%23075985"/>

      <!-- Lotus Blossom Leaves & Petals -->
      <path d="M 60 70 C 90 30 150 40 160 80 C 130 110 80 100 60 70 Z" fill="%23047857"/>
      <path d="M 160 80 C 200 40 260 50 250 100 C 210 120 170 100 160 80 Z" fill="%23059669"/>
      <path d="M 120 90 C 140 60 180 60 190 90 C 170 115 140 115 120 90 Z" fill="%23F472B6"/>
      <path d="M 140 75 C 160 50 180 50 190 75 C 180 95 150 95 140 75 Z" fill="%23FB7185"/>

      <!-- Koi Fish Body & Fins -->
      <path d="M 160 160 C 220 130 280 160 310 220 C 290 280 230 300 180 270 C 140 240 130 190 160 160 Z" fill="%23F97316"/>
      <path d="M 190 170 C 240 150 275 180 285 225 C 255 240 220 215 190 170 Z" fill="%23DC2626"/>
      <path d="M 180 270 C 150 310 130 340 120 370 C 105 340 120 300 150 280 Z" fill="%23F97316"/>
      <!-- Tail fin rays -->
      <path d="M 120 370 C 90 390 60 380 50 360 C 70 345 100 350 120 370 Z" fill="%23FB923C"/>
      <path d="M 120 370 C 130 400 120 420 95 410 C 95 385 110 375 120 370 Z" fill="%23FBBF24"/>

      <!-- Dorsal & Pectoral Fins -->
      <path d="M 280 160 C 330 140 360 160 350 180 C 320 185 290 175 280 160 Z" fill="%23FDBA74"/>
      <path d="M 190 290 C 210 330 200 360 180 350 C 175 325 180 305 190 290 Z" fill="%23FED7AA"/>

      <!-- Fish Scale Highlights -->
      <circle cx="230" cy="210" r="14" fill="%23FEF08A"/>
      <circle cx="260" cy="235" r="10" fill="%23FEF08A"/>
      <circle cx="210" cy="240" r="12" fill="%23FFFFFF"/>
      <circle cx="285" cy="185" r="5" fill="%230F172A"/>
    </svg>`,
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Stellar Nebula',
    description: 'A stellar expanse combining deep space violets, cyan dust filaments, and radiant planetary rings.',
    difficulty: 'hard',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <!-- Deep Space Dark Foundation -->
      <polygon points="0,0 200,0 150,140 0,90" fill="%2309090B"/>
      <polygon points="200,0 400,0 350,110 150,140" fill="%2318181B"/>
      <polygon points="400,0 400,200 320,180 350,110" fill="%2309090B"/>
      <polygon points="0,90 150,140 110,270 0,220" fill="%2318181B"/>
      <polygon points="0,220 110,270 80,400 0,400" fill="%2309090B"/>
      <polygon points="400,200 400,400 270,350 320,180" fill="%2318181B"/>
      <polygon points="80,400 270,350 400,400" fill="%2309090B"/>

      <!-- Outer Nebula Clouds -->
      <path d="M 50 40 C 150 10 280 30 360 80 C 320 160 250 180 160 140 C 90 90 40 80 50 40 Z" fill="%234C1D95"/>
      <path d="M 360 80 C 390 160 380 260 330 330 C 270 290 240 220 270 170 C 300 130 330 100 360 80 Z" fill="%23581C87"/>
      <path d="M 330 330 C 260 380 130 390 60 340 C 90 270 150 260 210 290 C 260 320 300 325 330 330 Z" fill="%231E1B4B"/>
      <path d="M 60 340 C 10 270 20 160 70 100 C 110 160 130 220 100 270 C 80 300 70 320 60 340 Z" fill="%231E3A8A"/>

      <!-- Inner Stardust Spiral Bands -->
      <path d="M 120 160 C 180 120 260 140 280 200 C 230 220 170 210 140 180 Z" fill="%2306B6D4"/>
      <path d="M 140 180 C 180 150 240 160 250 210 C 210 230 170 220 140 180 Z" fill="%233B82F6"/>
      <path d="M 160 200 C 200 180 240 190 240 225 C 210 240 180 230 160 200 Z" fill="%238B5CF6"/>
      <path d="M 180 215 C 210 200 230 205 230 225 C 210 235 190 230 180 215 Z" fill="%23C084FC"/>

      <!-- Planetary Rings -->
      <ellipse cx="200" cy="200" rx="96" ry="34" fill="none" stroke="%23EC4899" stroke-width="16" transform="rotate(-25 200 200)"/>
      <ellipse cx="200" cy="200" rx="60" ry="20" fill="none" stroke="%23F43F5E" stroke-width="10" transform="rotate(-25 200 200)"/>

      <!-- Core Star & Satellites -->
      <circle cx="200" cy="200" r="26" fill="%23FDE047"/>
      <circle cx="200" cy="200" r="14" fill="%23FFFFFF"/>
      <circle cx="95" cy="115" r="9" fill="%2338BDF8"/>
      <circle cx="305" cy="290" r="11" fill="%23F472B6"/>
    </svg>`,
  },
];

/**
 * Loads an image from a Data URL or Image source.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

/**
 * Strong edge-preserving bilateral and median filter.
 * Flattens pixel noise while preserving sharp boundaries.
 */
function prefilterImage(
  srcData: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const intermediate = new Uint8ClampedArray(srcData.length);
  const dst = new Uint8ClampedArray(srcData.length);

  const radius = 2;
  const colorThreshold = 45;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIdx = (y * width + x) * 4;
      const cR = srcData[centerIdx];
      const cG = srcData[centerIdx + 1];
      const cB = srcData[centerIdx + 2];

      let sumR = 0, sumG = 0, sumB = 0, weight = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const nIdx = (ny * width + nx) * 4;
          const nR = srcData[nIdx];
          const nG = srcData[nIdx + 1];
          const nB = srcData[nIdx + 2];

          const dColor = Math.abs(cR - nR) + Math.abs(cG - nG) + Math.abs(cB - nB);
          if (dColor <= colorThreshold) {
            sumR += nR;
            sumG += nG;
            sumB += nB;
            weight++;
          }
        }
      }

      if (weight > 0) {
        intermediate[centerIdx] = Math.round(sumR / weight);
        intermediate[centerIdx + 1] = Math.round(sumG / weight);
        intermediate[centerIdx + 2] = Math.round(sumB / weight);
        intermediate[centerIdx + 3] = srcData[centerIdx + 3];
      } else {
        intermediate[centerIdx] = cR;
        intermediate[centerIdx + 1] = cG;
        intermediate[centerIdx + 2] = cB;
        intermediate[centerIdx + 3] = srcData[centerIdx + 3];
      }
    }
  }

  // Pass 2: Fast 3x3 median filter to eliminate single pixel speckles
  const rBuf: number[] = new Array(9);
  const gBuf: number[] = new Array(9);
  const bBuf: number[] = new Array(9);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIdx = (y * width + x) * 4;
      let count = 0;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const nIdx = (ny * width + nx) * 4;
          rBuf[count] = intermediate[nIdx];
          gBuf[count] = intermediate[nIdx + 1];
          bBuf[count] = intermediate[nIdx + 2];
          count++;
        }
      }

      rBuf.slice(0, count).sort((a, b) => a - b);
      gBuf.slice(0, count).sort((a, b) => a - b);
      bBuf.slice(0, count).sort((a, b) => a - b);
      const mid = Math.floor(count / 2);

      dst[centerIdx] = rBuf[mid];
      dst[centerIdx + 1] = gBuf[mid];
      dst[centerIdx + 2] = bBuf[mid];
      dst[centerIdx + 3] = intermediate[centerIdx + 3];
    }
  }

  return dst;
}

/**
 * Extracts dominant colors using deterministic histogram binning and k-means clustering.
 */
export function extractDominantColors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  clusterCount = 6
): ColorSwatch[] {
  const imgData = ctx.getImageData(0, 0, width, height).data;

  const bins = new Map<number, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < imgData.length; i += 4) {
    if (imgData[i + 3] < 128) continue;
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    // Only skip near-pure black border lines so dark colors in logos/photos are faithfully extracted
    if (r < 15 && g < 15 && b < 15) continue;

    const binKey = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const existing = bins.get(binKey);
    if (existing) {
      existing.count++;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      bins.set(binKey, { r, g, b, count: 1 });
    }
  }

  const colorPoints: { r: number; g: number; b: number; count: number }[] = [];
  for (const b of bins.values()) {
    colorPoints.push({
      r: Math.round(b.r / b.count),
      g: Math.round(b.g / b.count),
      b: Math.round(b.b / b.count),
      count: b.count,
    });
  }
  colorPoints.sort((a, b) => b.count - a.count);

  if (colorPoints.length === 0) {
    return [
      createSwatch({ r: 239, g: 68, b: 68 }, 'dom-1'),
      createSwatch({ r: 59, g: 130, b: 246 }, 'dom-2'),
      createSwatch({ r: 34, g: 197, b: 94 }, 'dom-3'),
      createSwatch({ r: 234, g: 179, b: 8 }, 'dom-4'),
    ];
  }

  const centers: { r: number; g: number; b: number }[] = [];
  centers.push(colorPoints[0]);

  while (centers.length < clusterCount && centers.length < colorPoints.length) {
    let bestPoint = colorPoints[0];
    let maxDistWeight = -1;

    for (let i = 0; i < Math.min(colorPoints.length, 300); i++) {
      const p = colorPoints[i];
      let minDist = Infinity;
      for (const c of centers) {
        const d = colorDistance(p, c);
        if (d < minDist) minDist = d;
      }
      const distWeight = minDist * Math.log10(p.count + 1);
      if (distWeight > maxDistWeight) {
        maxDistWeight = distWeight;
        bestPoint = p;
      }
    }
    centers.push(bestPoint);
  }

  // 8 K-Means iterations for high-precision convergence
  for (let iter = 0; iter < 8; iter++) {
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

    for (const p of colorPoints) {
      let bestIdx = 0;
      let minD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = colorDistance(p, centers[c]);
        if (d < minD) {
          minD = d;
          bestIdx = c;
        }
      }
      sums[bestIdx].r += p.r * p.count;
      sums[bestIdx].g += p.g * p.count;
      sums[bestIdx].b += p.b * p.count;
      sums[bestIdx].count += p.count;
    }

    for (let c = 0; c < centers.length; c++) {
      if (sums[c].count > 0) {
        centers[c] = {
          r: Math.round(sums[c].r / sums[c].count),
          g: Math.round(sums[c].g / sums[c].count),
          b: Math.round(sums[c].b / sums[c].count),
        };
      }
    }
  }

  const swatches = centers.map((c, i) => createSwatch(c, `dom-${i + 1}`));
  return swatches.sort((a, b) => a.hsv.h - b.hsv.h);
}

/**
 * 3x3 Majority Mode Filtering on the quantized map.
 * Absorbs single-pixel and small line clusters before Connected Component Labeling.
 */
function cleanQuantMap(
  quantMap: Uint8Array,
  width: number,
  height: number,
  paletteSize: number
): Uint8Array {
  const cleaned = new Uint8Array(quantMap.length);
  const voteHistogram = new Uint16Array(paletteSize);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerPos = y * width + x;
      voteHistogram.fill(0);

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const colorIdx = quantMap[ny * width + nx];
          voteHistogram[colorIdx]++;
        }
      }

      let majorityColor = quantMap[centerPos];
      let maxVotes = 0;
      for (let c = 0; c < paletteSize; c++) {
        if (voteHistogram[c] > maxVotes) {
          maxVotes = voteHistogram[c];
          majorityColor = c;
        }
      }

      cleaned[centerPos] = maxVotes >= 5 ? majorityColor : quantMap[centerPos];
    }
  }

  return cleaned;
}

/**
 * Disjoint Set Union (DSU) helper.
 */
class DisjointSet {
  parent: Int32Array;

  constructor(size: number) {
    this.parent = new Int32Array(size);
    for (let i = 0; i < size; i++) {
      this.parent[i] = i;
    }
  }

  find(i: number): number {
    let root = i;
    while (root !== this.parent[root]) {
      root = this.parent[root];
    }
    let curr = i;
    while (curr !== root) {
      const next = this.parent[curr];
      this.parent[curr] = root;
      curr = next;
    }
    return root;
  }

  union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
    }
  }
}

/**
 * Optimal Image Segmentation Engine.
 * 
 * Generates an engaging, balanced partition set so the game is neither
 * overly simplistic (too few partitions) nor frustratingly crowded (micro-clusters).
 * 
 * Target partition counts:
 * - Easy: ~26 to 36 partitions (approachable, clear)
 * - Medium: ~40 to 56 partitions (satisfying, detailed)
 * - Hard: ~65 to 90 partitions (rich, rewarding master challenge)
 */
export function segmentImageIntoRegions(
  img: HTMLImageElement,
  difficulty: GameDifficulty,
  palette: ColorSwatch[],
  targetResolution = 360
): SegmentationResult {
  const aspect = img.width / img.height;
  let width = targetResolution;
  let height = targetResolution;
  if (aspect > 1) {
    height = Math.round(targetResolution / aspect);
  } else {
    width = Math.round(targetResolution * aspect);
  }

  width = Math.max(160, Math.min(480, width));
  height = Math.max(160, Math.min(480, height));
  const totalPixels = width * height;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.drawImage(img, 0, 0, width, height);
  const rawImgData = ctx.getImageData(0, 0, width, height).data;

  // 1. Bilateral + Median Pre-filtering
  const smoothedData = prefilterImage(rawImgData, width, height);

  // 2. Identify partition boundaries:
  // For stained glass / vector art: detect dark lead outlines.
  // For uploaded logos / photos without dark lines: detect sharp color gradient edges.
  const isOutline = new Uint8Array(totalPixels);
  let darkPixelCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    if (smoothedData[idx] < 28 && smoothedData[idx + 1] < 28 && smoothedData[idx + 2] < 28) {
      isOutline[i] = 1;
      darkPixelCount++;
    }
  }

  // If artwork has few natural dark outlines (e.g. logos like WhatsApp, flat illustrations, photos):
  // Perform gradient-based edge detection so crisp color transitions become partition boundaries!
  if (darkPixelCount < totalPixels * 0.015) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = y * width + x;
        const idx = pos * 4;
        let maxGrad = 0;

        if (x < width - 1) {
          const rightIdx = (pos + 1) * 4;
          const dr = Math.abs(smoothedData[idx] - smoothedData[rightIdx]);
          const dg = Math.abs(smoothedData[idx + 1] - smoothedData[rightIdx + 1]);
          const db = Math.abs(smoothedData[idx + 2] - smoothedData[rightIdx + 2]);
          maxGrad = Math.max(maxGrad, dr + dg + db);
        }
        if (y < height - 1) {
          const downIdx = (pos + width) * 4;
          const dr = Math.abs(smoothedData[idx] - smoothedData[downIdx]);
          const dg = Math.abs(smoothedData[idx + 1] - smoothedData[downIdx + 1]);
          const db = Math.abs(smoothedData[idx + 2] - smoothedData[downIdx + 2]);
          maxGrad = Math.max(maxGrad, dr + dg + db);
        }

        if (maxGrad > 55) {
          isOutline[pos] = 1;
        }
      }
    }
  }

  // 3. Quantize each pixel to nearest palette swatch index
  let quantMap: Uint8Array = new Uint8Array(totalPixels);
  const rgbPalette = palette.map(p => hexToRgb(p.hex));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const px = { r: smoothedData[idx], g: smoothedData[idx + 1], b: smoothedData[idx + 2] };
      let bestSwatchIdx = 0;
      let minD = Infinity;

      for (let s = 0; s < rgbPalette.length; s++) {
        const d = colorDistance(px, rgbPalette[s]);
        if (d < minD) {
          minD = d;
          bestSwatchIdx = s;
        }
      }
      quantMap[y * width + x] = bestSwatchIdx;
    }
  }

  // 4. Boundary-Aware Connected-Component Labeling (CCL)
  // Preserves distinct partitions across lead lines and color edges
  const labels = new Int32Array(totalPixels);
  const dsu = new DisjointSet(totalPixels + 1);
  let nextLabel = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      if (isOutline[pos]) continue; // Outline & edge pixels act as partition barriers

      const colorVal = quantMap[pos];
      const upPos = (y - 1) * width + x;
      const leftPos = y * width + (x - 1);

      const hasUp = y > 0 && !isOutline[upPos] && quantMap[upPos] === colorVal;
      const hasLeft = x > 0 && !isOutline[leftPos] && quantMap[leftPos] === colorVal;

      if (hasUp && hasLeft) {
        const labelUp = labels[upPos];
        const labelLeft = labels[leftPos];
        labels[pos] = labelUp;
        if (labelUp !== labelLeft) {
          dsu.union(labelUp, labelLeft);
        }
      } else if (hasUp) {
        labels[pos] = labels[upPos];
      } else if (hasLeft) {
        labels[pos] = labels[leftPos];
      } else {
        labels[pos] = nextLabel++;
      }
    }
  }

  // Assign outline pixels to nearest interior component label
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      if (isOutline[pos]) {
        let assigned = 0;
        for (let dist = 1; dist <= 4; dist++) {
          if (x >= dist && !isOutline[pos - dist] && labels[pos - dist] > 0) {
            assigned = labels[pos - dist];
            break;
          }
          if (x + dist < width && !isOutline[pos + dist] && labels[pos + dist] > 0) {
            assigned = labels[pos + dist];
            break;
          }
          if (y >= dist && !isOutline[pos - dist * width] && labels[pos - dist * width] > 0) {
            assigned = labels[pos - dist * width];
            break;
          }
          if (y + dist < height && !isOutline[pos + dist * width] && labels[pos + dist * width] > 0) {
            assigned = labels[pos + dist * width];
            break;
          }
        }
        labels[pos] = assigned > 0 ? assigned : nextLabel;
      }
    }
  }

  for (let i = 0; i < totalPixels; i++) {
    labels[i] = dsu.find(labels[i]);
  }

  // 5. Optimal Partition Thresholds
  let minArea: number;
  let maxTargetRegions: number;

  if (difficulty === 'easy') {
    minArea = Math.max(70, Math.round(totalPixels * 0.0009));
    maxTargetRegions = 38;
  } else if (difficulty === 'medium') {
    minArea = Math.max(45, Math.round(totalPixels * 0.0006));
    maxTargetRegions = 60;
  } else {
    // Hard mode
    minArea = Math.max(25, Math.round(totalPixels * 0.0003));
    maxTargetRegions = 95;
  }

  // Helper to build adjacency map, region pixel counts, and dominant colors
  function getAdjacencyAndCounts() {
    const counts = new Map<number, number>();
    const colorVotes = new Map<number, Map<number, number>>();

    for (let i = 0; i < totalPixels; i++) {
      labels[i] = dsu.find(labels[i]);
      const root = labels[i];
      counts.set(root, (counts.get(root) || 0) + 1);

      const color = quantMap[i];
      if (!colorVotes.has(root)) colorVotes.set(root, new Map());
      const cv = colorVotes.get(root)!;
      cv.set(color, (cv.get(color) || 0) + 1);
    }

    const dominantColors = new Map<number, number>();
    for (const [root, votes] of colorVotes.entries()) {
      let maxV = -1;
      let domC = 0;
      for (const [c, v] of votes.entries()) {
        if (v > maxV) {
          maxV = v;
          domC = c;
        }
      }
      dominantColors.set(root, domC);
    }

    const adjacency = new Map<number, Map<number, number>>();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = y * width + x;
        const l = labels[pos];
        if (x < width - 1) {
          const rightL = labels[pos + 1];
          if (l !== rightL) {
            if (!adjacency.has(l)) adjacency.set(l, new Map());
            if (!adjacency.has(rightL)) adjacency.set(rightL, new Map());
            adjacency.get(l)!.set(rightL, (adjacency.get(l)!.get(rightL) || 0) + 1);
            adjacency.get(rightL)!.set(l, (adjacency.get(rightL)!.get(l) || 0) + 1);
          }
        }
        if (y < height - 1) {
          const downL = labels[pos + width];
          if (l !== downL) {
            if (!adjacency.has(l)) adjacency.set(l, new Map());
            if (!adjacency.has(downL)) adjacency.set(downL, new Map());
            adjacency.get(l)!.set(downL, (adjacency.get(l)!.get(downL) || 0) + 1);
            adjacency.get(downL)!.set(l, (adjacency.get(downL)!.get(l) || 0) + 1);
          }
        }
      }
    }

    return { counts, adjacency, dominantColors };
  }

  // PASS A: Iteratively absorb ONLY micro-regions below minArea into their color-closest neighbor
  for (let pass = 0; pass < 6; pass++) {
    const { counts, adjacency, dominantColors } = getAdjacencyAndCounts();
    let hasMerged = false;

    for (const [compLabel, count] of counts.entries()) {
      if (count < minArea) {
        const neighborsMap = adjacency.get(compLabel);
        if (neighborsMap && neighborsMap.size > 0) {
          const myColor = dominantColors.get(compLabel) ?? 0;
          let bestNeighbor = 0;
          let maxScore = -Infinity;

          for (const [neighborLabel, borderLen] of neighborsMap.entries()) {
            const neighborColor = dominantColors.get(neighborLabel) ?? 0;
            const dist = colorDistance(rgbPalette[myColor], rgbPalette[neighborColor]);
            // Strongly favor neighbors with similar colors so logos and icons preserve their true shapes!
            const score = borderLen * 2.5 - dist * 1.5;
            if (score > maxScore) {
              maxScore = score;
              bestNeighbor = neighborLabel;
            }
          }

          if (bestNeighbor > 0 && dsu.find(compLabel) !== dsu.find(bestNeighbor)) {
            dsu.union(compLabel, bestNeighbor);
            hasMerged = true;
          }
        }
      }
    }

    if (!hasMerged) break;
  }

  for (let i = 0; i < totalPixels; i++) {
    labels[i] = dsu.find(labels[i]);
  }

  // PASS B: Gentle prune ONLY if region count still exceeds maxTargetRegions
  for (let pass = 0; pass < 6; pass++) {
    const { counts, adjacency, dominantColors } = getAdjacencyAndCounts();
    if (counts.size <= maxTargetRegions) break;

    const sortedEntries = Array.from(counts.entries()).sort((a, b) => a[1] - b[1]);

    let mergedInPass = 0;
    for (const [compLabel, count] of sortedEntries) {
      if (counts.size - mergedInPass <= maxTargetRegions) break;
      // Only merge if the partition is relatively small (< 1.6 * minArea)
      if (count > minArea * 1.6) continue;

      const neighborsMap = adjacency.get(compLabel);
      if (neighborsMap && neighborsMap.size > 0) {
        const myColor = dominantColors.get(compLabel) ?? 0;
        let bestNeighbor = 0;
        let maxScore = -Infinity;

        for (const [neighborLabel, borderLen] of neighborsMap.entries()) {
          const neighborColor = dominantColors.get(neighborLabel) ?? 0;
          const dist = colorDistance(rgbPalette[myColor], rgbPalette[neighborColor]);
          const score = borderLen * 2.5 - dist * 1.5;
          if (score > maxScore) {
            maxScore = score;
            bestNeighbor = neighborLabel;
          }
        }

        if (bestNeighbor > 0 && dsu.find(compLabel) !== dsu.find(bestNeighbor)) {
          dsu.union(compLabel, bestNeighbor);
          mergedInPass++;
        }
      }
    }

    if (mergedInPass === 0) break;
  }

  for (let i = 0; i < totalPixels; i++) {
    labels[i] = dsu.find(labels[i]);
  }

  // 6. Assign final sequential 1-based IDs
  const finalRegionMap = new Int32Array(totalPixels);
  const uniqueRoots = new Map<number, number>();
  let assignedId = 1;

  for (let i = 0; i < totalPixels; i++) {
    const root = dsu.find(labels[i]);
    if (!uniqueRoots.has(root)) {
      uniqueRoots.set(root, assignedId++);
    }
    finalRegionMap[i] = uniqueRoots.get(root)!;
  }

  const totalUniqueRegions = uniqueRoots.size;

  // 7. Accumulate region stats and construct boundary map
  const regionStats = Array.from({ length: totalUniqueRegions + 1 }, () => ({
    count: 0,
    sumX: 0,
    sumY: 0,
    minX: width,
    minY: height,
    maxX: 0,
    maxY: 0,
    swatchVotes: new Map<number, number>(),
    points: [] as [number, number][],
  }));

  const boundaryMap = new Uint8Array(totalPixels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const rId = finalRegionMap[pos];
      const stat = regionStats[rId];
      stat.count++;
      stat.sumX += x;
      stat.sumY += y;
      if (x < stat.minX) stat.minX = x;
      if (x > stat.maxX) stat.maxX = x;
      if (y < stat.minY) stat.minY = y;
      if (y > stat.maxY) stat.maxY = y;

      const swIdx = quantMap[pos];
      stat.swatchVotes.set(swIdx, (stat.swatchVotes.get(swIdx) || 0) + 1);

      if (stat.points.length < 500 || stat.count % 3 === 0) {
        stat.points.push([x, y]);
      }

      // Check boundary: 4-connected boundary edge or lead outline line
      if (
        isOutline[pos] === 1 ||
        (x > 0 && finalRegionMap[pos - 1] !== rId) ||
        (x < width - 1 && finalRegionMap[pos + 1] !== rId) ||
        (y > 0 && finalRegionMap[pos - width] !== rId) ||
        (y < height - 1 && finalRegionMap[pos + width] !== rId)
      ) {
        boundaryMap[pos] = 1;
      }
    }
  }

  // 8. Assemble final RegionData list with POLE-OF-INACCESSIBILITY Centroid Placement
  const regions: RegionData[] = [];
  for (let id = 1; id <= totalUniqueRegions; id++) {
    const stat = regionStats[id];
    if (stat.count < 10) continue; // Safety guard

    let bestSwatchIdx = 0;
    let maxVotes = -1;
    for (const [swIdx, votes] of stat.swatchVotes.entries()) {
      if (votes > maxVotes) {
        maxVotes = votes;
        bestSwatchIdx = swIdx;
      }
    }

    const swatch = palette[bestSwatchIdx] || palette[0];

    const approxX = Math.round(stat.sumX / stat.count);
    const approxY = Math.round(stat.sumY / stat.count);

    let bestCenterX = approxX;
    let bestCenterY = approxY;
    let maxClearance = -1;

    // Evaluate clearance from boundary for sample interior points
    const step = Math.max(1, Math.floor(stat.points.length / 80));
    for (let pIdx = 0; pIdx < stat.points.length; pIdx += step) {
      const [px, py] = stat.points[pIdx];
      const pos = py * width + px;
      if (finalRegionMap[pos] !== id || boundaryMap[pos] === 1) continue;

      let dUp = 0, dDown = 0, dLeft = 0, dRight = 0;
      while (py - dUp > 0 && finalRegionMap[(py - dUp) * width + px] === id) dUp++;
      while (py + dDown < height - 1 && finalRegionMap[(py + dDown) * width + px] === id) dDown++;
      while (px - dLeft > 0 && finalRegionMap[py * width + (px - dLeft)] === id) dLeft++;
      while (px + dRight < width - 1 && finalRegionMap[py * width + (px + dRight)] === id) dRight++;

      const clearance = Math.min(dUp, dDown, dLeft, dRight);
      const distFromCentroid = Math.hypot(px - approxX, py - approxY);
      const score = clearance * 2 - distFromCentroid * 0.35;

      if (score > maxClearance) {
        maxClearance = score;
        bestCenterX = px;
        bestCenterY = py;
      }
    }

    regions.push({
      id,
      label: `${id}`,
      targetColorIndex: bestSwatchIdx,
      targetColorHex: swatch.hex,
      filledColorHex: null,
      isCorrect: false,
      pixelCount: stat.count,
      centerX: bestCenterX,
      centerY: bestCenterY,
      bbox: {
        minX: stat.minX,
        minY: stat.minY,
        maxX: stat.maxX,
        maxY: stat.maxY,
      },
    });
  }

  return {
    width,
    height,
    regions,
    regionMap: finalRegionMap,
    boundaryMap,
    dominantSwatches: palette,
  };
}
