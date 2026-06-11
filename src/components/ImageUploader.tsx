import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageSelected, disabled = false }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, HEIC, WebP)');
      return;
    }
    setErrorMsg(null);
    onImageSelected(file);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition-all duration-300 ${
          disabled
            ? 'pointer-events-none opacity-50 border-zinc-800 bg-transparent'
            : isDragActive
            ? 'border-white bg-white/5 scale-[1.01]'
            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
        } cursor-pointer group`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors duration-300">
          <UploadCloud className="h-5.5 w-5.5 text-zinc-400 group-hover:scale-110 transition-transform duration-300" />
        </div>

        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Upload Studio Image
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-xs">
          Drag & Drop or click to browse. Supports high-resolution raw photos, PNGs, and JPGs.
        </p>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-950/30 border border-red-500/10 px-3 py-1.5 text-xs text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
