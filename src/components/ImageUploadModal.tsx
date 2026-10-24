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
        setErrorMsg('Could not decode image data. Please try another file.');
      };
      img.src = result;
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

  const handleStartSegmenting = () => {
    if (!loadedImageRef.current) return;
    setIsProcessing(true);
    sounds.playClick();
    setTimeout(() => {
      if (loadedImageRef.current) {
        onImageReady(loadedImageRef.current, difficulty);
        setIsProcessing(false);
        onClose();
      }
    }, 200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-[#1C1A18] border border-[#38332B] rounded-2xl p-6 sm:p-7 shadow-2xl relative flex flex-col text-[#F5F2EB]">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-[#282521] text-[#8C867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          aria-label="Close upload window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-[#D49A5B]" />
          <h2 id="upload-modal-title" className="font-editorial text-lg font-bold text-[#F5F2EB]">
            Transform Image into Colour Block Puzzle
          </h2>
        </div>
        <p className="text-xs text-[#8C867B] mb-5">
          Upload any photo or illustration. The atelier engine extracts dominant color gamuts and segments it into harmonic partitions.
        </p>

        {/* Drag and Drop Zone */}
        {!previewSrc ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-[#D49A5B] bg-[#22201D]'
                : 'border-[#38332B] hover:border-[#4A443A] bg-[#141312]'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[#1E1C1A] border border-[#2D2A26] flex items-center justify-center text-[#D49A5B]">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F5F2EB]">
                Click to browse or drop an image here
              </p>
              <p className="text-[11px] text-[#8C867B] mt-1">
                PNG, JPEG, or WEBP up to 15MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl bg-[#141312] border border-[#2D2A26] overflow-hidden flex items-center justify-center p-2">
              <img
                src={previewSrc}
                alt="Upload preview"
                className="max-w-full max-h-full object-contain rounded"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewSrc(null);
                  setImageMeta(null);
                  loadedImageRef.current = null;
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#141312]/80 hover:bg-[#141312] text-[#F5F2EB] border border-[#38332B] cursor-pointer"
                title="Change Image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {imageMeta && (
              <div className="flex items-center justify-between text-xs text-[#8C867B] bg-[#141312] px-3 py-2 rounded-lg border border-[#262420]">
                <span className="truncate max-w-[200px] text-[#D6D0C2] font-medium">{imageMeta.name}</span>
                <span className="font-mono text-[11px]">{imageMeta.width}×{imageMeta.height} · {imageMeta.size}</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              validateAndProcessFile(e.target.files[0]);
            }
          }}
        />

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-[#261A18] border border-[#4D2822] text-[#E07A5F] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Difficulty Selection */}
        {previewSrc && (
          <div className="mt-4">
            <span className="text-xs font-medium text-[#8C867B] block mb-1.5">Partition Density:</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#141312] rounded-lg border border-[#262420]">
              {(['easy', 'medium', 'hard'] as GameDifficulty[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setDifficulty(d);
                  }}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-[#282521] text-[#F5F2EB] shadow-xs border border-[#3E3A33]'
                      : 'text-[#8C867B] hover:text-[#D6D0C2]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#A8A296] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {previewSrc && (
            <button
              type="button"
              onClick={handleStartSegmenting}
              disabled={isProcessing}
              className="py-2.5 px-5 rounded-xl text-xs font-bold bg-[#D49A5B] hover:bg-[#C2894A] text-[#141312] flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#D49A5B]/15"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Segmenting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Generate Puzzle</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
