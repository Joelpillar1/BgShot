import React from 'react';
import { Backdrop } from '../types';
import { BACKDROPS } from '../data/backdrops';

interface BackdropSelectorProps {
  selectedBackdrop: Backdrop;
  onSelectBackdrop: (backdrop: Backdrop) => void;
}

export default function BackdropSelector({
  selectedBackdrop,
  onSelectBackdrop,
}: BackdropSelectorProps) {
  const solids = BACKDROPS.filter((b) => b.category === 'solids');
  const gradients = BACKDROPS.filter((b) => b.category === 'gradients');
  const presets = BACKDROPS.filter((b) => b.category === 'presets');

  const renderBackdropCircle = (b: Backdrop) => {
    const isSelected = selectedBackdrop.id === b.id;

    return (
      <button
        key={b.id}
        onClick={() => onSelectBackdrop(b)}
        className="flex flex-col items-center gap-1.5 shrink-0 group transition active:scale-95"
      >
        {/* Thumb bubble */}
        <div
          className={`h-11 w-11 rounded-full border transition-all duration-300 relative flex items-center justify-center ${
            isSelected
              ? 'border-white ring-2 ring-white/15 scale-105'
              : 'border-white/10 hover:border-white/30 hover:scale-102'
          }`}
          style={{
            background: b.value,
          }}
        >
          {isSelected && (
            <div className="absolute h-1.5 w-1.5 rounded-full bg-white ring-1 ring-black/50" />
          )}
        </div>
        <span className="text-[9px] text-zinc-500 font-medium tracking-wide group-hover:text-zinc-300 transition-colors">
          {b.name}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Category 1: Solids */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Matte Solids</span>
          <span className="text-[9px] text-zinc-600">Clean Commercial</span>
        </div>
        <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {solids.map(renderBackdropCircle)}
        </div>
      </div>

      {/* Category 2: Gradients */}
      <div className="border-t border-zinc-900 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-sans">Studio Gradients</span>
          <span className="text-[9px] text-zinc-600">Pro Editorial Spotlight</span>
        </div>
        <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {gradients.map(renderBackdropCircle)}
        </div>
      </div>

      {/* Category 3: Organic Textures */}
      {presets.length > 0 && (
        <div className="border-t border-zinc-900 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-sans">Organic Textures</span>
            <span className="text-[9px] text-zinc-600">Premium Sand & Clay</span>
          </div>
          <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {presets.map(renderBackdropCircle)}
          </div>
        </div>
      )}
    </div>
  );
}
