import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Check, Sparkles, Printer, Image as ImageIcon } from 'lucide-react';
import type { RegionData, ColorSwatch, ColorSchemeType, ColorModelMode } from '../types/game.ts';
import { sounds } from '../services/soundEffects.ts';

interface ExportArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleWidth: number;
  puzzleHeight: number;
  regions: RegionData[];
  regionMap: Int32Array;
  boundaryMap: Uint8Array;
  palette: ColorSwatch[];
  colorScheme: ColorSchemeType;
  colorModel: ColorModelMode;
  artworkName: string;
}

export const ExportArtworkModal: React.FC<ExportArtworkModalProps> = ({
  isOpen,
  onClose,
  puzzleWidth,
  puzzleHeight,
  regions,
  regionMap,
  boundaryMap,
  palette,
  colorScheme,
  colorModel,
  artworkName,
}) => {
  const [exportMode, setExportMode] = useState<'masterpiece' | 'current' | 'coloring-sheet'>('masterpiece');
  const [includeLegend, setIncludeLegend] = useState<boolean>(true);
  const [includeOutlines, setIncludeOutlines] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate high-resolution preview when mode or settings change
  useEffect(() => {
    if (!isOpen || puzzleWidth === 0 || puzzleHeight === 0) return;

    const renderExportCanvas = () => {
      // 2.5x upscale for pristine high-res poster
      const scaleFactor = 2.5;
      const artW = Math.round(puzzleWidth * scaleFactor);
      const artH = Math.round(puzzleHeight * scaleFactor);

      const legendHeight = includeLegend ? 130 : 0;
      const totalWidth = artW;
      const totalHeight = artH + legendHeight;

      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background fill
      ctx.fillStyle = exportMode === 'coloring-sheet' ? '#FFFFFF' : '#141312';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // 2. Offscreen pixel buffer for art area
      const offscreen = document.createElement('canvas');
      offscreen.width = puzzleWidth;
      offscreen.height = puzzleHeight;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const imgData = offCtx.createImageData(puzzleWidth, puzzleHeight);
      const totalPixels = puzzleWidth * puzzleHeight;

      // Map region colors
      const targetColors = new Map<number, { r: number; g: number; b: number }>();
      const currentColors = new Map<number, { r: number; g: number; b: number }>();

      for (const r of regions) {
        const tHex = r.targetColorHex.replace('#', '');
        targetColors.set(r.id, {
          r: parseInt(tHex.substring(0, 2), 16) || 120,
          g: parseInt(tHex.substring(2, 4), 16) || 120,
          b: parseInt(tHex.substring(4, 6), 16) || 120,
        });

        if (r.filledColorHex) {
          const fHex = r.filledColorHex.replace('#', '');
          currentColors.set(r.id, {
            r: parseInt(fHex.substring(0, 2), 16) || 120,
            g: parseInt(fHex.substring(2, 4), 16) || 120,
            b: parseInt(fHex.substring(4, 6), 16) || 120,
          });
        }
      }

      for (let i = 0; i < totalPixels; i++) {
        const rId = regionMap[i];
        const idx = i * 4;

        if (exportMode === 'masterpiece') {
          // Vibrant full color blocks
          const col = targetColors.get(rId) || { r: 240, g: 240, b: 240 };
          imgData.data[idx] = col.r;
          imgData.data[idx + 1] = col.g;
          imgData.data[idx + 2] = col.b;
          imgData.data[idx + 3] = 255;
        } else if (exportMode === 'current') {
          // Current progress
          const col = currentColors.get(rId);
          if (col) {
            imgData.data[idx] = col.r;
            imgData.data[idx + 1] = col.g;
            imgData.data[idx + 2] = col.b;
            imgData.data[idx + 3] = 255;
          } else {
            // Unfilled paper cream
            imgData.data[idx] = 245;
            imgData.data[idx + 1] = 242;
            imgData.data[idx + 2] = 236;
            imgData.data[idx + 3] = 255;
          }
        } else {
          // Coloring sheet: clean white paper
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = 255;
          imgData.data[idx + 2] = 255;
          imgData.data[idx + 3] = 255;
        }

        // Draw boundaries
        if (includeOutlines && boundaryMap[i] === 1) {
          if (exportMode === 'coloring-sheet') {
            imgData.data[idx] = 30;
            imgData.data[idx + 1] = 30;
            imgData.data[idx + 2] = 30;
          } else {
            imgData.data[idx] = 18;
            imgData.data[idx + 1] = 16;
            imgData.data[idx + 2] = 15;
          }
          imgData.data[idx + 3] = 255;
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      // Draw upscale to main export canvas
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, artW, artH);

      // If coloring sheet or current mode, draw number badges
      if (exportMode === 'coloring-sheet' || exportMode === 'current') {
        const unfilledOrAll = exportMode === 'coloring-sheet' ? regions : regions.filter(r => !r.isCorrect);
        for (const r of unfilledOrAll) {
          const bx = r.centerX * scaleFactor;
          const by = r.centerY * scaleFactor;
          const badgeRadius = 11 * (scaleFactor / 2);

          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = exportMode === 'coloring-sheet' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(20, 19, 18, 0.9)';
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = exportMode === 'coloring-sheet' ? '#71717A' : '#D4CEBF';
          ctx.stroke();

          ctx.fillStyle = exportMode === 'coloring-sheet' ? '#18181B' : '#F5F2EB';
          ctx.font = `bold ${Math.round(11 * (scaleFactor / 2))}px 'Plus Jakarta Sans', system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${r.targetColorIndex + 1}`, bx, by);
          ctx.restore();
        }
      }

      // Draw Atelier Legend Bar at bottom
      if (includeLegend) {
        const legendY = artH;
        ctx.fillStyle = exportMode === 'coloring-sheet' ? '#FAFAFA' : '#1A1816';
        ctx.fillRect(0, legendY, totalWidth, legendHeight);

        // Hairline separator
        ctx.strokeStyle = exportMode === 'coloring-sheet' ? '#E4E4E7' : 'rgba(245, 240, 235, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, legendY);
        ctx.lineTo(totalWidth, legendY);
        ctx.stroke();

        // Title and Scheme
        ctx.fillStyle = exportMode === 'coloring-sheet' ? '#18181B' : '#F5F2EB';
        ctx.font = `bold 16px 'Fraunces', Georgia, serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(artworkName, 24, legendY + 18);

        ctx.fillStyle = exportMode === 'coloring-sheet' ? '#71717A' : '#A8A296';
        ctx.font = `12px 'Plus Jakarta Sans', sans-serif`;
        const subtitle = `Harmonic Palette · ${colorScheme.toUpperCase()} Scheme · ${colorModel.toUpperCase()} Gamut`;
        ctx.fillText(subtitle, 24, legendY + 42);

        // Swatch chips
        const chipStartX = 24;
        const chipY = legendY + 70;
        const chipW = Math.min(130, Math.floor((totalWidth - 48) / Math.max(1, palette.length)));

        palette.forEach((swatch, idx) => {
          const cx = chipStartX + idx * chipW;
          // Color block
          ctx.fillStyle = swatch.hex;
          ctx.fillRect(cx, chipY, 20, 20);
          ctx.strokeStyle = exportMode === 'coloring-sheet' ? '#D4D4D8' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, chipY, 20, 20);

          // Number & Hex label
          ctx.fillStyle = exportMode === 'coloring-sheet' ? '#3F3F46' : '#D6D0C2';
          ctx.font = `bold 10px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(`${idx + 1}. ${swatch.hex}`, cx + 26, chipY + 4);
        });
      }

      canvasRef.current = canvas;
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    };

    renderExportCanvas();
  }, [isOpen, exportMode, includeLegend, includeOutlines, puzzleWidth, puzzleHeight, regions, regionMap, boundaryMap, palette, colorScheme, colorModel, artworkName]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    sounds.playClick();

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      const cleanName = artworkName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `colorquest-${cleanName}-${exportMode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export artwork:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-[#1C1A18] border border-[#38332B] rounded-2xl p-6 sm:p-7 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-lg hover:bg-[#2A2723] text-[#A8A296] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          aria-label="Close export window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#D49A5B]" />
            <h2 id="export-modal-title" className="text-xl font-bold font-editorial text-[#F5F2EB]">
              Export Colour Block Artwork
            </h2>
          </div>
          <p className="text-xs text-[#A8A296]">
            Download pristine high-resolution PNG prints of your color block puzzle and harmonic palette.
          </p>
        </div>

        {/* Export Style Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#141312] rounded-xl border border-[#2D2A26] mb-5">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setExportMode('masterpiece');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              exportMode === 'masterpiece'
                ? 'bg-[#2A2723] text-[#F5F2EB] border border-[#443E36] shadow-sm'
                : 'text-[#8C867B] hover:text-[#D6D0C2]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#D49A5B]" />
            <span>Masterpiece</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setExportMode('current');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              exportMode === 'current'
                ? 'bg-[#2A2723] text-[#F5F2EB] border border-[#443E36] shadow-sm'
                : 'text-[#8C867B] hover:text-[#D6D0C2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6E9484]" />
            <span>In-Progress</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setExportMode('coloring-sheet');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              exportMode === 'coloring-sheet'
                ? 'bg-[#2A2723] text-[#F5F2EB] border border-[#443E36] shadow-sm'
                : 'text-[#8C867B] hover:text-[#D6D0C2]'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-[#C87A54]" />
            <span>Coloring Sheet</span>
          </button>
        </div>

        {/* Live Artwork Preview */}
        <div className="relative w-full aspect-square max-h-72 bg-[#141312] border border-[#2D2A26] rounded-xl overflow-hidden flex items-center justify-center mb-5 p-2">
          {previewDataUrl ? (
            <img
              src={previewDataUrl}
              alt="Artwork Export Preview"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded shadow-md"
            />
          ) : (
            <div className="text-xs text-[#8C867B]">Rendering preview...</div>
          )}
        </div>

        {/* Options Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-[#141312] border border-[#2A2723] rounded-xl mb-6">
          <label className="flex items-center gap-2.5 text-xs text-[#D6D0C2] cursor-pointer">
            <input
              type="checkbox"
              checked={includeLegend}
              onChange={e => setIncludeLegend(e.target.checked)}
              className="w-4 h-4 rounded border-[#38332B] bg-[#1E1C1A] text-[#D49A5B] focus:ring-0 cursor-pointer"
            />
            <span>Include Palette Legend & Color Code Bar</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-[#D6D0C2] cursor-pointer">
            <input
              type="checkbox"
              checked={includeOutlines}
              onChange={e => setIncludeOutlines(e.target.checked)}
              className="w-4 h-4 rounded border-[#38332B] bg-[#1E1C1A] text-[#D49A5B] focus:ring-0 cursor-pointer"
            />
            <span>Include Leaded Partition Lines</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-[#D49A5B] hover:bg-[#C2894A] text-[#141312] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#D49A5B]/15"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download High-Resolution PNG</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="py-3 px-5 rounded-xl font-semibold text-xs bg-[#24211D] hover:bg-[#2C2924] border border-[#38332B] text-[#D6D0C2] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
