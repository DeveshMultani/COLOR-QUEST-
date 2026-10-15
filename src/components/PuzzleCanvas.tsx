import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { RegionData, ColorSwatch } from '../types/game.ts';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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

interface PuzzleCanvasProps {
  width: number;
  height: number;
  regions: RegionData[];
  regionMap: Int32Array;
  boundaryMap: Uint8Array;
  palette: ColorSwatch[];
  selectedSwatch: ColorSwatch | null;
  hintRegionId: number | null;
  onRegionClick: (regionId: number, clickPos: { x: number; y: number }) => void;
  lastFeedback: { message: string; type: 'correct' | 'compatible' | 'incorrect' } | null;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom and Pan state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover state
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);

  // Particle & Floating text pools
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingScore[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Offscreen pre-rendered layers for instant 60fps composition
  const boundaryCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
        bImgData.data[idx] = 15;     // Dark slate outline
        bImgData.data[idx + 1] = 23;
        bImgData.data[idx + 2] = 42;
        bImgData.data[idx + 3] = 255;
      }
    }
    bCtx.putImageData(bImgData, 0, 0);
    boundaryCanvasRef.current = bCanvas;
  }, [width, height, boundaryMap]);

  // Particle explosion trigger
  const spawnParticles = useCallback((cx: number, cy: number, color: string) => {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 3 + 1.5;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3.5 + 2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 20 + 25,
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

  // Watch for feedback changes to trigger visual juice
  useEffect(() => {
    if (!lastFeedback) return;
    if (lastFeedback.type === 'correct') {
      const region = regions.find(r => r.isCorrect && r.filledColorHex);
      if (region) {
        spawnParticles(region.centerX, region.centerY, region.targetColorHex);
        spawnFloater('+100', region.centerX, region.centerY - 10, '#FBBF24');
      }
    } else if (lastFeedback.type === 'compatible') {
      const region = regions.find(r => r.filledColorHex);
      if (region) {
        spawnFloater('+40 Harmonious', region.centerX, region.centerY - 10, '#38BDF8');
      }
    } else if (lastFeedback.type === 'incorrect') {
      if (hoveredRegionId) {
        const region = regions.find(r => r.id === hoveredRegionId);
        if (region) {
          spawnFloater('-10 Incorrect', region.centerX, region.centerY - 10, '#F87171');
        }
      }
    }
  }, [lastFeedback]);

  // Main 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fast region lookup map for colors
    const regionColorMap = new Map<number, string | null>();
    const regionCorrectMap = new Map<number, boolean>();
    for (const r of regions) {
      regionColorMap.set(r.id, r.filledColorHex);
      regionCorrectMap.set(r.id, r.isCorrect);
    }

    // Offscreen canvas for fill colors
    const fillCanvas = document.createElement('canvas');
    fillCanvas.width = width;
    fillCanvas.height = height;
    const fillCtx = fillCanvas.getContext('2d');
    if (!fillCtx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      // Clear full main canvas
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw region color fills to offscreen fillCanvas
      const fillImgData = fillCtx.createImageData(width, height);
      for (let i = 0; i < width * height; i++) {
        const rId = regionMap[i];
        const isHovered = rId === hoveredRegionId;
        const isHint = rId === hintRegionId;
        const filledHex = regionColorMap.get(rId);

        const idx = i * 4;

        if (filledHex) {
          // Parse filled color
          const cleanHex = filledHex.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16) || 120;
          const g = parseInt(cleanHex.substring(2, 4), 16) || 120;
          const b = parseInt(cleanHex.substring(4, 6), 16) || 120;

          fillImgData.data[idx] = isHovered ? Math.min(255, r + 30) : r;
          fillImgData.data[idx + 1] = isHovered ? Math.min(255, g + 30) : g;
          fillImgData.data[idx + 2] = isHovered ? Math.min(255, b + 30) : b;
          fillImgData.data[idx + 3] = 255;
        } else {
          // Unfilled: warm parchment draft texture
          let baseG = 232;
          if (isHovered) baseG = 255;
          if (isHint) baseG = 245;

          fillImgData.data[idx] = isHint ? 254 : isHovered ? 245 : 230;
          fillImgData.data[idx + 1] = isHint ? 242 : baseG;
          fillImgData.data[idx + 2] = isHint ? 150 : isHovered ? 215 : 212;
          fillImgData.data[idx + 3] = 255;
        }
      }
      fillCtx.putImageData(fillImgData, 0, 0);

      ctx.save();

      // Apply Pan and Zoom centered
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.translate(cx + pan.x, cy + pan.y);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      // Draw drop shadow under puzzle board
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Draw fill image
      ctx.drawImage(fillCanvas, 0, 0);

      // 2. Draw crisp boundary lines from pre-rendered offscreen buffer
      if (boundaryCanvasRef.current) {
        ctx.drawImage(boundaryCanvasRef.current, 0, 0);
      }

      // 3. Highlight boundary for hovered or hint region
      if (hoveredRegionId || hintRegionId) {
        const targetId = hintRegionId || hoveredRegionId;
        ctx.strokeStyle = hintRegionId ? '#F59E0B' : '#38BDF8';
        ctx.lineWidth = 2.5;
        // Pulse hint boundary
        if (hintRegionId) {
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 8;
        }
      }

      // 4. Draw Region Number Badges for unfilled regions
      for (const r of regions) {
        if (!r.isCorrect) {
          const isTargeted = r.id === hoveredRegionId || r.id === hintRegionId;

          // Number badge circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(r.centerX, r.centerY, isTargeted ? 12 : 9.5, 0, Math.PI * 2);
          ctx.fillStyle = isTargeted ? '#F59E0B' : '#0F172A';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = isTargeted ? '#FFFFFF' : '#CBD5E1';
          ctx.stroke();

          // Text label
          ctx.fillStyle = isTargeted ? '#0F172A' : '#F8FAFC';
          ctx.font = `${isTargeted ? 'bold 11px' : 'bold 9px'} system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${r.targetColorIndex + 1}`, r.centerX, r.centerY);
          ctx.restore();
        }
      }

      // 5. Update and render particle physics
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

      // 6. Update and render floating text badges
      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const f = floatersRef.current[i];
        f.y -= 0.6;
        f.life++;
        f.alpha = Math.max(0, 1 - f.life / 40);

        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();

        if (f.life >= 40) {
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
  }, [width, height, regions, regionMap, hoveredRegionId, hintRegionId, scale, pan]);

  // Coordinate projection from mouse event to image pixel space
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const imgX = (clientX - (cx + pan.x)) / scale + width / 2;
    const imgY = (clientY - (cy + pan.y)) / scale + height / 2;

    const px = Math.floor(imgX);
    const py = Math.floor(imgY);

    if (px < 0 || px >= width || py < 0 || py >= height) {
      return null;
    }
    return { px, py, clientX, clientY };
  };

  // Mouse hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) {
      if (hoveredRegionId !== null) setHoveredRegionId(null);
      return;
    }

    const pos = coords.py * width + coords.px;
    const rId = regionMap[pos];
    if (rId > 0 && rId !== hoveredRegionId) {
      setHoveredRegionId(rId);
    } else if (rId === 0 && hoveredRegionId !== null) {
      setHoveredRegionId(null);
    }
  };

  // Mouse click handling
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const pos = coords.py * width + coords.px;
    const rId = regionMap[pos];
    if (rId > 0) {
      onRegionClick(rId, { x: coords.px, y: coords.py });
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(s => Math.max(0.6, Math.min(3.5, s * zoomFactor)));
  };

  // Drag to pan handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey || e.altKey) {
      // Middle click or Shift+drag triggers pan
      e.preventDefault();
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
  };

  const handleResetView = () => {
    sounds.playClick();
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Responsive canvas size adjustment
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] bg-slate-950 overflow-hidden flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setHoveredRegionId(null);
        }}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Viewport Control Tools Overlay */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setScale(s => Math.min(3.5, s * 1.15));
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setScale(s => Math.max(0.6, s * 0.85));
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Swatch Floating Preview Pill */}
      {selectedSwatch && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-slate-900/90 border border-slate-800 py-1.5 px-3 rounded-full shadow-lg">
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
            style={{ backgroundColor: selectedSwatch.hex }}
          />
          <span className="text-xs font-semibold text-slate-200">
            Active: <span className="text-amber-400">{selectedSwatch.name}</span>
          </span>
        </div>
      )}
    </div>
  );
};
