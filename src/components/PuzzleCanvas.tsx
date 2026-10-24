import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { RegionData, ColorSwatch } from '../types/game.ts';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { sounds } from '../services/soundEffects.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

interface TouchRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface PuzzleCanvasProps {
  width: number;
  height: number;
  regions: RegionData[];
  regionMap: Int32Array;
  boundaryMap: Uint8Array;
  palette: ColorSwatch[];
  selectedSwatch: ColorSwatch | null;
  hintRegionId: number | null;
  onRegionClick: (regionId: number, options?: { isBadgeHit?: boolean }) => void;
  lastFeedback: { message: string; type: 'correct' | 'compatible' | 'incorrect' } | null;
  onOpenExport?: () => void;
  onHoverRegionChange?: (regionId: number | null) => void;
}

export const PuzzleCanvas: React.FC<PuzzleCanvasProps> = ({
  width,
  height,
  regions,
  regionMap,
  boundaryMap,
  palette,
  selectedSwatch,
  hintRegionId,
  onRegionClick,
  lastFeedback,
  onOpenExport,
  onHoverRegionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom and Pan state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover and Tap Highlight State
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);
  const [flashRegionId, setFlashRegionId] = useState<number | null>(null);

  // Precise cursor coordinate in image pixel space
  const cursorPosRef = useRef<{ px: number; py: number } | null>(null);

  // Particle & Floating text pools
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingScore[]>([]);
  const ripplesRef = useRef<TouchRipple[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Offscreen pre-rendered layers
  const boundaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fillCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bloomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-render boundary layer once when boundaryMap or dimensions change
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const bCanvas = document.createElement('canvas');
    bCanvas.width = width;
    bCanvas.height = height;
    const bCtx = bCanvas.getContext('2d');
    if (!bCtx) return;

    const bImgData = bCtx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      if (boundaryMap[i] === 1) {
        const idx = i * 4;
        bImgData.data[idx] = 26;     // Warm atelier charcoal outline
        bImgData.data[idx + 1] = 24;
        bImgData.data[idx + 2] = 22;
        bImgData.data[idx + 3] = 255;
      }
    }
    bCtx.putImageData(bImgData, 0, 0);
    boundaryCanvasRef.current = bCanvas;
  }, [width, height, boundaryMap]);

  // Pre-render base fill layer (completed regions colored, unfilled regions warm white/parchment)
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const fCanvas = document.createElement('canvas');
    fCanvas.width = width;
    fCanvas.height = height;
    const fCtx = fCanvas.getContext('2d');
    if (!fCtx) return;

    const regionColorMap = new Map<number, string>();
    for (const r of regions) {
      if (r.filledColorHex) {
        regionColorMap.set(r.id, r.filledColorHex);
      }
    }

    const fImgData = fCtx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const rId = regionMap[i];
      const filledHex = regionColorMap.get(rId);
      const idx = i * 4;

      if (filledHex) {
        const cleanHex = filledHex.replace('#', '');
        fImgData.data[idx] = parseInt(cleanHex.substring(0, 2), 16) || 120;
        fImgData.data[idx + 1] = parseInt(cleanHex.substring(2, 4), 16) || 120;
        fImgData.data[idx + 2] = parseInt(cleanHex.substring(4, 6), 16) || 120;
        fImgData.data[idx + 3] = 255;
      } else {
        // Pristine white / vellum paper for uncolored regions
        fImgData.data[idx] = 252;
        fImgData.data[idx + 1] = 250;
        fImgData.data[idx + 2] = 246;
        fImgData.data[idx + 3] = 255;
      }
    }
    fCtx.putImageData(fImgData, 0, 0);
    fillCanvasRef.current = fCanvas;
  }, [width, height, regions, regionMap]);

  // Initialize offscreen bloom canvas for the emerging color effect
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const blCanvas = document.createElement('canvas');
    blCanvas.width = width;
    blCanvas.height = height;
    bloomCanvasRef.current = blCanvas;
  }, [width, height]);

  // Particle explosion trigger
  const spawnParticles = useCallback((cx: number, cy: number, color: string) => {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 3 + 1.2;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 18 + 22,
      });
    }
  }, []);

  // Floating text score delta
  const spawnFloater = useCallback((text: string, x: number, y: number, color: string) => {
    floatersRef.current.push({
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1,
      life: 0,
    });
  }, []);

  // Touch ripple effect on tap
  const spawnRipple = useCallback((x: number, y: number, color = '#D49A5B') => {
    ripplesRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius: 28,
      alpha: 0.9,
      color,
    });
  }, []);

  // Watch for feedback changes to trigger visual juice
  useEffect(() => {
    if (!lastFeedback) return;
    if (lastFeedback.type === 'correct') {
      const region = regions.find(r => r.isCorrect && r.filledColorHex);
      if (region) {
        spawnParticles(region.centerX, region.centerY, region.targetColorHex);
        spawnFloater('+100', region.centerX, region.centerY - 10, '#D49A5B');
      }
    } else if (lastFeedback.type === 'compatible') {
      const region = regions.find(r => r.filledColorHex);
      if (region) {
        spawnFloater('+40 Harmonious', region.centerX, region.centerY - 10, '#6E9484');
      }
    } else if (lastFeedback.type === 'incorrect') {
      if (hoveredRegionId || flashRegionId) {
        const targetId = flashRegionId || hoveredRegionId;
        const region = regions.find(r => r.id === targetId);
        if (region) {
          spawnFloater('Mismatch', region.centerX, region.centerY - 10, '#C87A54');
        }
      }
    }
  }, [lastFeedback, regions, hoveredRegionId, flashRegionId, spawnParticles, spawnFloater]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      // Dark warm gallery floor
      ctx.fillStyle = '#141312';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const activeHoverRegion = regions.find(r => r.id === hoveredRegionId);

      // Render Emerging Colour Radial Gradient on Bloom Canvas (darkens towards cursor, strictly masked to region)
      const blCanvas = bloomCanvasRef.current;
      if (
        activeHoverRegion &&
        !activeHoverRegion.isCorrect &&
        cursorPosRef.current &&
        blCanvas
      ) {
        const blCtx = blCanvas.getContext('2d');
        if (blCtx) {
          blCtx.clearRect(0, 0, width, height);

          const minX = Math.max(0, activeHoverRegion.bbox.minX);
          const minY = Math.max(0, activeHoverRegion.bbox.minY);
          const maxX = Math.min(width - 1, activeHoverRegion.bbox.maxX);
          const maxY = Math.min(height - 1, activeHoverRegion.bbox.maxY);
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;

          // 1. Put pixel-perfect silhouette mask onto bloom canvas
          const maskImg = blCtx.createImageData(bw, bh);
          for (let y = 0; y < bh; y++) {
            const row = (minY + y) * width;
            for (let x = 0; x < bw; x++) {
              if (regionMap[row + (minX + x)] === activeHoverRegion.id) {
                const idx = (y * bw + x) * 4;
                maskImg.data[idx] = 255;
                maskImg.data[idx + 1] = 255;
                maskImg.data[idx + 2] = 255;
                maskImg.data[idx + 3] = 255;
              }
            }
          }
          blCtx.putImageData(maskImg, minX, minY);

          // 2. Prepare radial gradient darkening towards cursor
          const { px, py } = cursorPosRef.current;
          const cleanHex = activeHoverRegion.targetColorHex.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16) || 120;
          const g = parseInt(cleanHex.substring(2, 4), 16) || 120;
          const b = parseInt(cleanHex.substring(4, 6), 16) || 120;

          // Deepened, richer pigment tone right under cursor tip: "gradient which darkens coming towards the cursor"
          const darkR = Math.max(0, Math.round(r * 0.62));
          const darkG = Math.max(0, Math.round(g * 0.62));
          const darkB = Math.max(0, Math.round(b * 0.62));

          const isMatch =
            selectedSwatch &&
            selectedSwatch.hex.toLowerCase() === activeHoverRegion.targetColorHex.toLowerCase();
          const intensity = isMatch ? 1.0 : (selectedSwatch ? 0.82 : 0.95);

          const regionSpan = Math.hypot(bw, bh);
          // Short-range gradient radius (typically 52-85px)
          const radius = Math.min(85, Math.max(52, regionSpan * 0.44));

          const grad = blCtx.createRadialGradient(px, py, 0, px, py, radius);
          // Directly under cursor: deepest, darkened pigment
          grad.addColorStop(0, `rgba(${darkR}, ${darkG}, ${darkB}, ${intensity * 0.98})`);
          // Inner core: exact target color at full vibrance
          grad.addColorStop(0.24, `rgba(${r}, ${g}, ${b}, ${intensity * 0.92})`);
          // Mid transition: soft chromatic fade
          grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${intensity * 0.48})`);
          // Outer edge: gentle feather fading smoothly into the white paper
          grad.addColorStop(0.82, `rgba(${r}, ${g}, ${b}, ${intensity * 0.14})`);
          // End of short range: completely transparent
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

          // 3. Composite gradient strictly inside the mask using 'source-in'
          blCtx.globalCompositeOperation = 'source-in';
          blCtx.fillStyle = grad;
          blCtx.fillRect(minX, minY, bw, bh);
          blCtx.globalCompositeOperation = 'source-over';
        }
      }

      ctx.save();

      // Apply Pan and Zoom centered
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.translate(cx + pan.x, cy + pan.y);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      // Subtle shadow under puzzle canvas
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#1B1917';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 1. Draw base pre-rendered fill image
      if (fillCanvasRef.current) {
        ctx.drawImage(fillCanvasRef.current, 0, 0);
      }

      // 2. Draw emerging color gradient strictly clipped to hovered region (No boxes!)
      if (
        activeHoverRegion &&
        !activeHoverRegion.isCorrect &&
        cursorPosRef.current &&
        bloomCanvasRef.current
      ) {
        ctx.drawImage(bloomCanvasRef.current, 0, 0);
      }

      // 3. Draw crisp boundary lead lines over the fills and emerging gradient
      if (boundaryCanvasRef.current) {
        ctx.drawImage(boundaryCanvasRef.current, 0, 0);
      }

      // 4. Subtle Cursor Pointer Alignment Ring inside region (No rectangular boxes)
      if (
        activeHoverRegion &&
        !activeHoverRegion.isCorrect &&
        cursorPosRef.current
      ) {
        const { px, py } = cursorPosRef.current;
        const isMatch =
          selectedSwatch &&
          selectedSwatch.hex.toLowerCase() === activeHoverRegion.targetColorHex.toLowerCase();

        ctx.save();
        // Inner color bead showing exact designated color
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = activeHoverRegion.targetColorHex;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // If player has selected the matching swatch, show glowing alignment halo
        if (isMatch) {
          ctx.beginPath();
          ctx.arc(px, py, 8.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#D49A5B';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Draw Region Number Badges
      const sortedUnfilled = [...regions]
        .filter(r => !r.isCorrect)
        .sort((a, b) => b.pixelCount - a.pixelCount);

      const placedBadgePositions: { x: number; y: number }[] = [];
      const MIN_BADGE_DISTANCE = 20;

      for (const r of sortedUnfilled) {
        const isHovered = r.id === hoveredRegionId;
        const isHint = r.id === hintRegionId;
        const isTargeted = isHovered || isHint || r.id === flashRegionId;

        let collides = false;
        for (const pb of placedBadgePositions) {
          const d = Math.hypot(pb.x - r.centerX, pb.y - r.centerY);
          if (d < MIN_BADGE_DISTANCE) {
            collides = true;
            break;
          }
        }

        if (collides && !isTargeted) {
          continue;
        }

        placedBadgePositions.push({ x: r.centerX, y: r.centerY });

        // Pulsing golden beacon around hint region badge (clean organic circular pulse, no box)
        if (isHint) {
          const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(r.centerX, r.centerY, 14 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212, 154, 91, ${0.9 - pulse * 0.4})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
          ctx.restore();
        }

        // Determine badge color styling
        let badgeBg = '#221F1C';
        let badgeText = '#F5F2EB';
        let badgeBorder = '#D4CEBF';

        if (isHint) {
          badgeBg = '#D49A5B';
          badgeText = '#141312';
          badgeBorder = '#FFFFFF';
        } else if (isHovered) {
          // When hovered, the badge turns into the exact designated color!
          badgeBg = r.targetColorHex;
          badgeBorder = '#FFFFFF';
          const cleanHex = r.targetColorHex.replace('#', '');
          const rVal = parseInt(cleanHex.substring(0, 2), 16) || 128;
          const gVal = parseInt(cleanHex.substring(2, 4), 16) || 128;
          const bVal = parseInt(cleanHex.substring(4, 6), 16) || 128;
          const yiq = (rVal * 299 + gVal * 587 + bVal * 114) / 1000;
          badgeText = yiq >= 135 ? '#141312' : '#FFFFFF';
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.centerX, r.centerY, isTargeted ? 12 : 10, 0, Math.PI * 2);
        ctx.fillStyle = badgeBg;
        ctx.fill();
        ctx.lineWidth = isTargeted ? 1.6 : 1.2;
        ctx.strokeStyle = badgeBorder;
        ctx.stroke();

        ctx.fillStyle = badgeText;
        ctx.font = `bold ${isTargeted ? '11px' : '9.5px'} 'Plus Jakarta Sans', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${r.targetColorIndex + 1}`, r.centerX, r.centerY);
        ctx.restore();
      }

      // 6. Update and render touch ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rip = ripplesRef.current[i];
        rip.radius += 1.8;
        rip.alpha *= 0.88;

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rip.color;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = rip.alpha;
        ctx.stroke();
        ctx.restore();

        if (rip.alpha < 0.05 || rip.radius >= rip.maxRadius) {
          ripplesRef.current.splice(i, 1);
        }
      }

      // 6. Update and render particle physics
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 7. Update and render floating text badges
      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const f = floatersRef.current[i];
        f.y -= 0.6;
        f.life++;
        f.alpha = Math.max(0, 1 - f.life / 38);

        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = "bold 12px 'Plus Jakarta Sans', system-ui, sans-serif";
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();

        if (f.life >= 38) {
          floatersRef.current.splice(i, 1);
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [width, height, regions, regionMap, hoveredRegionId, hintRegionId, flashRegionId, scale, pan]);

  /**
   * Project screen/client coordinates to puzzle image pixel coordinates
   */
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;

    if (cssX < 0 || cssX > rect.width || cssY < 0 || cssY > rect.height) {
      return null;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const bufferX = cssX * scaleX;
    const bufferY = cssY * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const imgX = (bufferX - (cx + pan.x)) / scale + width / 2;
    const imgY = (bufferY - (cy + pan.y)) / scale + height / 2;

    const px = Math.floor(imgX);
    const py = Math.floor(imgY);

    if (px < 0 || px >= width || py < 0 || py >= height) {
      return null;
    }
    return { px, py, bufferX, bufferY };
  }, [width, height, scale, pan]);

  /**
   * High-Precision Hit Resolution:
   * 1. Check if user tapped directly on or near ANY region's number badge (< 18px radius).
   * 2. Direct pixel hit test inside region body.
   * 3. Forgiving boundary search: if tapped on boundary line, inspect 8px radius.
   *    If a neighboring region matches the currently selected swatch, prioritize it!
   */
  const resolveTargetRegion = useCallback((px: number, py: number): { id: number; isBadgeHit: boolean } | null => {
    // 1. Direct number badge hit test
    for (const r of regions) {
      if (!r.isCorrect) {
        const d = Math.hypot(px - r.centerX, py - r.centerY);
        if (d <= 18) {
          return { id: r.id, isBadgeHit: true };
        }
      }
    }

    // 2. Direct pixel lookup
    const pos = py * width + px;
    const directId = regionMap[pos];
    if (directId > 0) {
      return { id: directId, isBadgeHit: false };
    }

    // 3. Forgiving boundary search
    const votes = new Map<number, number>();
    for (let r = 1; r <= 8; r++) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const nx = Math.round(px + Math.cos(angle) * r);
        const ny = Math.round(py + Math.sin(angle) * r);
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nId = regionMap[ny * width + nx];
          if (nId > 0) {
            const reg = regions.find(item => item.id === nId);
            let weight = (9 - r);
            if (reg && !reg.isCorrect) {
              weight *= 3;
              // If this neighbor matches the currently selected swatch, grant high priority!
              if (selectedSwatch && reg.targetColorHex === selectedSwatch.hex) {
                weight += 20;
              }
            }
            votes.set(nId, (votes.get(nId) || 0) + weight);
          }
        }
      }
    }

    let bestId = 0;
    let maxWeight = 0;
    for (const [id, weight] of votes.entries()) {
      if (weight > maxWeight) {
        maxWeight = weight;
        bestId = id;
      }
    }

    return bestId > 0 ? { id: bestId, isBadgeHit: false } : null;
  }, [regions, regionMap, width, height, selectedSwatch]);

  // UNIFIED POINTER-BASED CONTROLLER
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    primaryPointerId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    hasMoved: boolean;
    isMultiTouch: boolean;
    initialDistance: number;
    initialScale: number;
  }>({
    primaryPointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    hasMoved: false,
    isMultiTouch: false,
    initialDistance: 0,
    initialScale: 1,
  });

  const lastActionTimestampRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      gestureRef.current = {
        primaryPointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTime: Date.now(),
        hasMoved: false,
        isMultiTouch: false,
        initialDistance: 0,
        initialScale: scale,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    } else if (activePointersRef.current.size === 2) {
      gestureRef.current.isMultiTouch = true;
      gestureRef.current.hasMoved = true;

      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      gestureRef.current.initialDistance = dist;
      gestureRef.current.initialScale = scale;
    } else {
      gestureRef.current.isMultiTouch = true;
      gestureRef.current.hasMoved = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) {
      if (e.pointerType === 'mouse') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        if (coords) {
          cursorPosRef.current = { px: coords.px, py: coords.py };
          const target = resolveTargetRegion(coords.px, coords.py);
          const targetId = target ? target.id : null;
          if (targetId !== hoveredRegionId) {
            setHoveredRegionId(targetId);
            onHoverRegionChange?.(targetId);
          }
        } else {
          cursorPosRef.current = null;
          if (hoveredRegionId !== null) {
            setHoveredRegionId(null);
            onHoverRegionChange?.(null);
          }
        }
      }
      return;
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Track active touch pointer in image space
    if (activePointersRef.current.size === 1 && !gestureRef.current.isMultiTouch) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) {
        cursorPosRef.current = { px: coords.px, py: coords.py };
        const target = resolveTargetRegion(coords.px, coords.py);
        const targetId = target ? target.id : null;
        if (targetId !== hoveredRegionId) {
          setHoveredRegionId(targetId);
          onHoverRegionChange?.(targetId);
        }
      }
    }

    if (gestureRef.current.isMultiTouch && activePointersRef.current.size >= 2) {
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      if (gestureRef.current.initialDistance > 0) {
        const factor = dist / gestureRef.current.initialDistance;
        setScale(Math.max(0.6, Math.min(3.5, gestureRef.current.initialScale * factor)));
      }
    } else if (activePointersRef.current.size === 1 && e.pointerId === gestureRef.current.primaryPointerId) {
      const dx = e.clientX - gestureRef.current.startX;
      const dy = e.clientY - gestureRef.current.startY;
      const moveDistance = Math.hypot(dx, dy);

      if (moveDistance > 8) {
        gestureRef.current.hasMoved = true;
        setPan(p => ({ x: p.x + dx * 0.7, y: p.y + dy * 0.7 }));
        gestureRef.current.startX = e.clientX;
        gestureRef.current.startY = e.clientY;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const wasPrimary = e.pointerId === gestureRef.current.primaryPointerId;
    const wasSingleTouch = !gestureRef.current.isMultiTouch && activePointersRef.current.size === 1;
    const didNotMove = !gestureRef.current.hasMoved;
    const duration = Date.now() - gestureRef.current.startTime;

    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size === 0) {
      gestureRef.current.primaryPointerId = null;
    }

    if (wasPrimary && wasSingleTouch && didNotMove && duration < 600) {
      const now = Date.now();
      if (now - lastActionTimestampRef.current >= 300) {
        lastActionTimestampRef.current = now;

        const coords = getCanvasCoords(gestureRef.current.startX, gestureRef.current.startY);
        if (coords) {
          const target = resolveTargetRegion(coords.px, coords.py);
          if (target && target.id > 0) {
            spawnRipple(coords.px, coords.py, '#D49A5B');
            setFlashRegionId(target.id);
            setTimeout(() => setFlashRegionId(null), 250);

            onRegionClick(target.id, { isBadgeHit: target.isBadgeHit });
          }
        }
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      gestureRef.current.primaryPointerId = null;
      gestureRef.current.isMultiTouch = false;
      gestureRef.current.hasMoved = false;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setScale(s => Math.max(0.6, Math.min(3.5, s * zoomFactor)));
  };

  const handleResetView = () => {
    sounds.playClick();
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: cWidth, height: cHeight } = entry.contentRect;
        if (cWidth > 0 && cHeight > 0) {
          canvas.width = Math.round(cWidth);
          canvas.height = Math.round(cHeight);
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] bg-[#141312] overflow-hidden flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
        onPointerLeave={() => {
          cursorPosRef.current = null;
          setHoveredRegionId(null);
          onHoverRegionChange?.(null);
        }}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onContextMenu={e => e.preventDefault()}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Viewport Control Tools Overlay */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-[#1C1A18]/90 border border-[#38332B] p-1 rounded-xl shadow-lg backdrop-blur-xs">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setScale(s => Math.min(3.5, s * 1.15));
          }}
          className="p-1.5 rounded-lg text-[#A8A296] hover:text-[#F5F2EB] hover:bg-[#2A2723] cursor-pointer"
          aria-label="Zoom In"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setScale(s => Math.max(0.6, s * 0.85));
          }}
          className="p-1.5 rounded-lg text-[#A8A296] hover:text-[#F5F2EB] hover:bg-[#2A2723] cursor-pointer"
          aria-label="Zoom Out"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-[#A8A296] hover:text-[#F5F2EB] hover:bg-[#2A2723] cursor-pointer"
          aria-label="Reset View"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {onOpenExport && (
          <>
            <div className="w-[1px] h-4 bg-[#38332B] mx-0.5" />
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenExport();
              }}
              className="p-1.5 rounded-lg text-[#D49A5B] hover:text-[#F5F2EB] hover:bg-[#2A2723] cursor-pointer"
              aria-label="Download Colour Block Image"
              title="Download Colour Block Image"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Selected Swatch Clean Indicator */}
      {selectedSwatch && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 py-1.5 px-3 bg-[#1C1A18]/85 border border-[#38332B] rounded-lg text-xs shadow-md">
          <div
            className="w-3.5 h-3.5 rounded-md border border-white/20 shadow-sm"
            style={{ backgroundColor: selectedSwatch.hex }}
          />
          <span className="text-[#A8A296]">
            Active Swatch: <strong className="text-[#F5F2EB] font-medium">{selectedSwatch.name}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
