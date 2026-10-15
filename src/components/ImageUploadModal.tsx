import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { GameDifficulty } from '../types/game.ts';
import { sounds } from '../services/soundEffects.ts';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageReady: (img: HTMLImageElement, difficulty: GameDifficulty) => void;
  initialDifficulty: GameDifficulty;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onImageReady,
  initialDifficulty,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string; width: number; height: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  if (!isOpen) return null;

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);
    sounds.playClick();

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Unsupported format. Please upload a PNG, JPEG, or WEBP image.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds 15MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        setPreviewSrc(result);
        setImageMeta({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => {
        setErrorMsg('Failed to decode the image file.');
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMsg('Error reading the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleGenerate = () => {
    if (!loadedImageRef.current) return;
    setIsProcessing(true);
    sounds.playClick();

    setTimeout(() => {
      try {
        onImageReady(loadedImageRef.current!, difficulty);
        setIsProcessing(false);
        onClose();
      } catch (err) {
        setIsProcessing(false);
        setErrorMsg('Image segmentation failed. Please try a different image or lower difficulty.');
      }
    }, 100);
  };

  const handleReset = () => {
    sounds.playClick();
    setPreviewSrc(null);
    setImageMeta(null);
    loadedImageRef.current = null;
    setErrorMsg(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-5 h-5 text-amber-400" />
          <h2 id="upload-modal-title" className="text-lg font-bold text-slate-100">
            Upload Custom Image
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Upload any picture. ColorQuest will extract its harmonic palette and segment it into a numbered region puzzle.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!previewSrc ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200 mb-1">
              Click to choose image or drag & drop here
            </div>
            <div className="text-xs text-slate-400">
              Supports PNG, JPEG, WEBP up to 15MB
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                <img
                  src={previewSrc}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-semibold text-sm text-slate-200 truncate">{imageMeta?.name}</div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  {imageMeta?.width} × {imageMeta?.height} px · {imageMeta?.size}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 text-xs text-amber-400 hover:underline cursor-pointer font-medium"
                >
                  Choose a different image
                </button>
              </div>
            </div>

            {/* Complexity Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Region Complexity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDifficulty(d);
                    }}
                    className={`py-2 px-3 rounded-lg border text-center text-xs font-semibold capitalize cursor-pointer transition-all ${
                      difficulty === d
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Segmenting Image...</span>
                </>
              ) : (
                <span>Generate Colour Puzzle</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
