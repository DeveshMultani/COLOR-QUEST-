import type { RegionData, ColorSwatch, GameDifficulty, PresetImage } from '../types/game.ts';
import { createSwatch, colorDistance, hexToRgb, areColorsEqual } from './colorMath.ts';

export interface SegmentationResult {
  width: number;
  height: number;
  regions: RegionData[];
  regionMap: Int32Array; // Size: width * height. Stores regionId (1..N) or 0
  boundaryMap: Uint8Array; // 1 if boundary edge, 0 otherwise
  dominantSwatches: ColorSwatch[];
}

/**
 * High-quality SVG preset templates for immediate play without needing image upload.
 */
export const PRESETS: PresetImage[] = [
  {
    id: 'stained-glass-rose',
    name: 'Stained Glass Rose',
    description: 'A classic Gothic cathedral rose window featuring vibrant crimson petals and emerald foliage.',
    difficulty: 'easy',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="%231E293B"/>
      <!-- Petals Layer 1 -->
      <path d="M 200 70 C 160 120 160 180 200 200 C 240 180 240 120 200 70 Z" fill="%23DC2626"/>
      <path d="M 200 200 C 160 220 120 220 70 200 C 120 160 180 160 200 200 Z" fill="%23EF4444"/>
      <path d="M 200 200 C 240 220 280 220 330 200 C 280 160 220 160 200 200 Z" fill="%23B91C1C"/>
      <path d="M 200 200 C 180 240 180 280 200 330 C 220 280 220 240 200 200 Z" fill="%23991B1B"/>
      <!-- Diagonal Petals -->
      <path d="M 200 200 C 150 170 110 130 110 90 C 150 90 180 140 200 200 Z" fill="%23F87171"/>
      <path d="M 200 200 C 250 170 290 130 290 90 C 250 90 220 140 200 200 Z" fill="%23F43F5E"/>
      <path d="M 200 200 C 150 230 110 270 100 310 C 140 310 170 260 200 200 Z" fill="%2310B981"/>
      <path d="M 200 200 C 250 230 290 270 300 310 C 260 310 230 260 200 200 Z" fill="%23059669"/>
      <!-- Leaves -->
      <path d="M 100 310 C 60 330 40 370 50 390 C 90 390 110 350 100 310 Z" fill="%23047857"/>
      <path d="M 300 310 C 340 330 360 370 350 390 C 310 390 290 350 300 310 Z" fill="%23065F46"/>
      <!-- Center Core -->
      <circle cx="200" cy="200" r="32" fill="%23FBBF24"/>
      <circle cx="200" cy="200" r="14" fill="%23D97706"/>
    </svg>`,
  },
  {
    id: 'tropical-toucan',
    name: 'Tropical Toucan',
    description: 'An exotic rainforest composition with bold geometric beak and lush canopy layers.',
    difficulty: 'medium',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="%230F172A"/>
      <!-- Foliage background -->
      <path d="M 0 0 L 150 0 L 120 160 L 0 100 Z" fill="%23064E3B"/>
      <path d="M 400 0 L 260 0 L 290 140 L 400 110 Z" fill="%23065F46"/>
      <path d="M 0 300 L 180 250 L 140 400 L 0 400 Z" fill="%23047857"/>
      <path d="M 260 270 L 400 290 L 400 400 L 240 400 Z" fill="%23059669"/>
      <!-- Branch -->
      <path d="M 0 280 C 120 270 240 270 400 290 L 400 320 C 240 300 120 300 0 310 Z" fill="%2378350F"/>
      <!-- Toucan Body -->
      <path d="M 160 160 C 130 190 120 280 180 300 C 220 300 230 240 220 180 Z" fill="%231E293B"/>
      <!-- Chest / Bib -->
      <path d="M 160 160 C 180 170 200 190 190 230 C 170 240 150 220 145 190 Z" fill="%23F59E0B"/>
      <path d="M 145 190 C 160 220 180 230 175 250 C 155 255 140 235 135 210 Z" fill="%23EF4444"/>
      <!-- Head -->
      <circle cx="170" cy="140" r="32" fill="%230F172A"/>
      <circle cx="160" cy="135" r="8" fill="%2338BDF8"/>
      <circle cx="160" cy="135" r="4" fill="%230284C7"/>
      <!-- Giant Beak -->
      <path d="M 180 125 C 250 115 310 145 350 180 C 310 205 240 195 180 165 Z" fill="%23EAB308"/>
      <path d="M 280 135 C 315 150 340 170 350 180 C 330 195 300 190 275 175 Z" fill="%23EA580C"/>
      <path d="M 320 160 C 338 170 348 176 350 180 C 342 188 330 185 315 178 Z" fill="%23DC2626"/>
      <path d="M 180 140 C 210 145 220 165 180 165 Z" fill="%230284C7"/>
    </svg>`,
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    description: 'A stellar expanse combining deep space violets, neon cyan stardust, and radiant solar rings.',
    difficulty: 'hard',
    width: 400,
    height: 400,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="%2309090B"/>
      <!-- Outer Nebula Clouds -->
      <path d="M 50 40 C 150 10 280 30 360 80 C 320 180 240 200 160 140 C 90 90 40 80 50 40 Z" fill="%234C1D95"/>
      <path d="M 360 80 C 390 160 380 260 330 330 C 260 300 230 220 270 170 C 300 130 330 100 360 80 Z" fill="%23581C87"/>
      <path d="M 330 330 C 260 380 130 390 60 340 C 90 260 160 260 210 290 C 260 320 300 325 330 330 Z" fill="%231E1B4B"/>
      <path d="M 60 340 C 10 270 20 160 70 100 C 110 160 130 220 100 270 C 80 300 70 320 60 340 Z" fill="%231E3A8A"/>
      <!-- Inner Stardust -->
      <path d="M 120 160 C 180 120 260 140 280 200 C 230 230 170 220 140 190 Z" fill="%2306B6D4"/>
      <path d="M 160 190 C 210 160 260 180 260 220 C 220 240 180 230 160 210 Z" fill="%233B82F6"/>
      <path d="M 180 210 C 220 190 250 200 240 230 C 210 245 190 235 180 220 Z" fill="%238B5CF6"/>
      <!-- Star Rings -->
      <ellipse cx="200" cy="200" rx="90" ry="32" fill="none" stroke="%23EC4899" stroke-width="24" transform="rotate(-25 200 200)"/>
      <ellipse cx="200" cy="200" rx="45" ry="16" fill="none" stroke="%23F43F5E" stroke-width="12" transform="rotate(-25 200 200)"/>
      <!-- Core Star -->
      <circle cx="200" cy="200" r="28" fill="%23FDE047"/>
      <circle cx="200" cy="200" r="14" fill="%23FFFFFF"/>
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
    img.onerror = (e) => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

/**
 * Performs color quantization using median cut / K-means clustering on image pixels.
 */
export function extractDominantColors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  clusterCount = 6
): ColorSwatch[] {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const pixels: { r: number; g: number; b: number }[] = [];
  const step = Math.max(1, Math.floor((width * height) / 1200)); // Sample ~1200 pixels

  for (let i = 0; i < imgData.length; i += 4 * step) {
    const a = imgData[i + 3];
    if (a < 128) continue; // Skip transparent
    pixels.push({
      r: imgData[i],
      g: imgData[i + 1],
      b: imgData[i + 2],
    });
  }

  if (pixels.length === 0) {
    return [
      createSwatch({ r: 239, g: 68, b: 68 }, 'dom-1'),
      createSwatch({ r: 59, g: 130, b: 246 }, 'dom-2'),
      createSwatch({ r: 34, g: 197, b: 94 }, 'dom-3'),
      createSwatch({ r: 234, g: 179, b: 8 }, 'dom-4'),
    ];
  }

  // K-Means initialization (k-means++ style spread)
  const centers: { r: number; g: number; b: number }[] = [];
  centers.push(pixels[Math.floor(Math.random() * pixels.length)]);

  while (centers.length < clusterCount) {
    let bestDist = -1;
    let bestPix = pixels[0];

    for (let p = 0; p < Math.min(pixels.length, 150); p++) {
      const pix = pixels[Math.floor(Math.random() * pixels.length)];
      let minDistToCenter = Infinity;
      for (const c of centers) {
        const d = colorDistance(pix, c);
        if (d < minDistToCenter) minDistToCenter = d;
      }
      if (minDistToCenter > bestDist) {
        bestDist = minDistToCenter;
        bestPix = pix;
      }
    }
    centers.push(bestPix);
  }

  // 4 iterations of K-Means clustering
  for (let iter = 0; iter < 4; iter++) {
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (const p of pixels) {
      let bestIdx = 0;
      let minD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = colorDistance(p, centers[c]);
        if (d < minD) {
          minD = d;
          bestIdx = c;
        }
      }
      sums[bestIdx].r += p.r;
      sums[bestIdx].g += p.g;
      sums[bestIdx].b += p.b;
      sums[bestIdx].count++;
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

  // Sort swatches by luminance / hue for pleasant visual order
  const swatches = centers.map((c, i) => createSwatch(c, `dom-${i + 1}`));
  return swatches.sort((a, b) => a.hsv.h - b.hsv.h);
}

/**
 * Segment image into connected, numbered puzzle regions using:
 * 1. Pixel quantization to nearest palette color.
 * 2. 4-connected component labeling (CCL) with disjoint-set union.
 * 3. Small-region merging to eliminate micro-speck visual clutter.
 * 4. Boundary extraction & centroid determination.
 */
export function segmentImageIntoRegions(
  img: HTMLImageElement,
  difficulty: GameDifficulty,
  palette: ColorSwatch[],
  targetResolution = 360
): SegmentationResult {
  // 1. Maintain aspect ratio within target resolution
  const aspect = img.width / img.height;
  let width = targetResolution;
  let height = targetResolution;
  if (aspect > 1) {
    height = Math.round(targetResolution / aspect);
  } else {
    width = Math.round(targetResolution * aspect);
  }

  // Ensure minimum dimensions
  width = Math.max(120, Math.min(500, width));
  height = Math.max(120, Math.min(500, height));

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height).data;

  // 2. Quantize each pixel to nearest palette swatch index
  const quantMap = new Uint8Array(width * height);
  const rgbPalette = palette.map(p => hexToRgb(p.hex));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const px = { r: imgData[idx], g: imgData[idx + 1], b: imgData[idx + 2] };
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

  // 3. Connected-Component Labeling (CCL)
  // Two-pass algorithm with Disjoint Set Union
  const labels = new Int32Array(width * height);
  const parent: number[] = [0]; // 1-indexed

  function find(i: number): number {
    let root = i;
    while (root !== parent[root]) {
      root = parent[root];
    }
    let curr = i;
    while (curr !== root) {
      const next = parent[curr];
      parent[curr] = root;
      curr = next;
    }
    return root;
  }

  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  }

  let nextLabel = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const colorVal = quantMap[pos];

      const upPos = (y - 1) * width + x;
      const leftPos = y * width + (x - 1);

      const hasUp = y > 0 && quantMap[upPos] === colorVal;
      const hasLeft = x > 0 && quantMap[leftPos] === colorVal;

      if (hasUp && hasLeft) {
        const labelUp = labels[upPos];
        const labelLeft = labels[leftPos];
        labels[pos] = labelUp;
        if (labelUp !== labelLeft) {
          union(labelUp, labelLeft);
        }
      } else if (hasUp) {
        labels[pos] = labels[upPos];
      } else if (hasLeft) {
        labels[pos] = labels[leftPos];
      } else {
        labels[pos] = nextLabel;
        parent.push(nextLabel);
        nextLabel++;
      }
    }
  }

  // Second pass: flatten roots and compute region sizes
  const regionPixelCounts = new Map<number, number>();
  const regionColorIndex = new Map<number, number>();

  for (let i = 0; i < width * height; i++) {
    const root = find(labels[i]);
    labels[i] = root;
    regionPixelCounts.set(root, (regionPixelCounts.get(root) || 0) + 1);
    regionColorIndex.set(root, quantMap[i]);
  }

  // 4. Small region elimination / merging using maximum shared border
  // minArea threshold set carefully to preserve all genuine petals & shapes
  let minArea = 15;
  if (difficulty === 'easy') minArea = 20;
  else if (difficulty === 'medium') minArea = 12;
  else minArea = 6;

  // Find border adjacency counts between components
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

  // Merge small components into neighbor with maximum shared border
  for (const [compLabel, count] of regionPixelCounts.entries()) {
    if (count < minArea) {
      const neighborsMap = adjacency.get(compLabel);
      if (neighborsMap && neighborsMap.size > 0) {
        let bestNeighbor = 0;
        let maxBorder = -1;
        for (const [neighborLabel, borderLen] of neighborsMap.entries()) {
          if (borderLen > maxBorder) {
            maxBorder = borderLen;
            bestNeighbor = neighborLabel;
          }
        }
        if (bestNeighbor > 0) {
          union(compLabel, bestNeighbor);
        }
      }
    }
  }

  // Re-flatten after merging
  const finalRegionMap = new Int32Array(width * height);
  const uniqueRoots = new Map<number, number>(); // root -> 1-based sequential region ID
  let assignedId = 1;

  for (let i = 0; i < width * height; i++) {
    const root = find(labels[i]);
    if (!uniqueRoots.has(root)) {
      uniqueRoots.set(root, assignedId++);
    }
    finalRegionMap[i] = uniqueRoots.get(root)!;
  }

  // 5. Build RegionData objects and calculate centroid & boundaries
  const totalUniqueRegions = uniqueRoots.size;
  const regionStats = Array.from({ length: totalUniqueRegions + 1 }, () => ({
    count: 0,
    sumX: 0,
    sumY: 0,
    minX: width,
    minY: height,
    maxX: 0,
    maxY: 0,
    colorIndex: 0,
  }));

  const boundaryMap = new Uint8Array(width * height);

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
      stat.colorIndex = quantMap[pos];

      // Boundary detection: if neighbor differs
      if (
        (x > 0 && finalRegionMap[pos - 1] !== rId) ||
        (x < width - 1 && finalRegionMap[pos + 1] !== rId) ||
        (y > 0 && finalRegionMap[pos - width] !== rId) ||
        (y < height - 1 && finalRegionMap[pos + width] !== rId)
      ) {
        boundaryMap[pos] = 1;
      }
    }
  }

  // Filter out microscopic regions that couldn't be merged
  const regions: RegionData[] = [];
  for (let id = 1; id <= totalUniqueRegions; id++) {
    const stat = regionStats[id];
    if (stat.count < 8) continue; // safety filter

    const swatchIdx = stat.colorIndex % palette.length;
    const swatch = palette[swatchIdx] || palette[0];

    regions.push({
      id,
      label: `${id}`,
      targetColorIndex: swatchIdx,
      targetColorHex: swatch.hex,
      filledColorHex: null,
      isCorrect: false,
      pixelCount: stat.count,
      centerX: Math.round(stat.sumX / stat.count),
      centerY: Math.round(stat.sumY / stat.count),
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
