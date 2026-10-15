export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorCMYK {
  c: number; // 0 to 100
  m: number; // 0 to 100
  y: number; // 0 to 100
  k: number; // 0 to 100
}

export interface ColorHSV {
  h: number; // 0 to 360 degrees
  s: number; // 0 to 100 percent
  v: number; // 0 to 100 percent
}

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  rgb: ColorRGB;
  cmyk: ColorCMYK;
  hsv: ColorHSV;
  isWarm: boolean;
  description: string;
}

export type ColorSchemeType =
  | 'original'
  | 'monochromatic'
  | 'complementary'
  | 'analogous'
  | 'warm'
  | 'cool';

export type ColorModelMode = 'rgb' | 'cmyk';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface RegionData {
  id: number;
  label: string;
  targetColorIndex: number; // Index in the active palette
  targetColorHex: string;
  filledColorHex: string | null;
  isCorrect: boolean;
  pixelCount: number;
  centerX: number; // 0 to 1 relative or pixel
  centerY: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface PaintAction {
  regionId: number;
  previousColorHex: string | null;
  newColorHex: string;
  wasCorrect: boolean;
  pointsEarned: number;
}

export interface GameStats {
  score: number;
  mistakes: number;
  hintsUsed: number;
  elapsedSeconds: number;
  filledCount: number;
  totalRegions: number;
  isCompleted: boolean;
  accuracy: number;
}

export interface PresetImage {
  id: string;
  name: string;
  description: string;
  difficulty: GameDifficulty;
  svgDataUri: string;
  width: number;
  height: number;
}
