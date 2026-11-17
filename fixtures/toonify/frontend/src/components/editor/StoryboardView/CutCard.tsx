'use client';

import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Trash2, Sparkles, RefreshCw, Wand2, CheckCircle2, Circle } from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTranslations } from 'next-intl';
import type { StoryCut } from './types';

interface CutCardProps {
  cut: StoryCut;
  index: number;
  isSelected: boolean;
  isGenerating: boolean;
  isBatchGenerating: boolean;
  episodeStatus: string;
  deleteConfirmationId: string | null;
  onSelect: () => void;
  onGenerate: () => void;
  onModify: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  cutRef: (el: HTMLDivElement | null) => void;
  isRegenerateMode?: boolean;
}

export function CutCard({
  cut,
  isSelected,
  isGenerating,
  isBatchGenerating,
  episodeStatus,
  deleteConfirmationId,
  onSelect,
  onGenerate,
  onModify,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  cutRef,
  isRegenerateMode = false,
}: CutCardProps) {
  const t = useTranslations('Project.Editor');
  const tc = useTranslations('Common');

  const isCurrentlyGenerating = isGenerating || cut.status === 'generating';
  const isDisabledForGeneration = isBatchGenerating || episodeStatus === 'generating';

  // In regenerate mode, only cuts with images can be selected
  const canSelect = !isRegenerateMode || cut.image_path;

  return (
    <div
      ref={cutRef}
      onClick={canSelect ? onSelect : undefined}
      className={`
        group relative bg-[#0f0f16] border rounded-xl overflow-hidden transition-all
        ${canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
        ${isRegenerateMode && isSelected
          ? 'border-orange-500 ring-2 ring-orange-500/50 shadow-2xl shadow-orange-500/10 scale-[1.01]'
          : isSelected && !isRegenerateMode
            ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-600 opacity-90 hover:opacity-100'}
      `}
    >
      {/* Regenerate Mode Selection Indicator */}
      {isRegenerateMode && cut.image_path && (
        <div className="absolute top-3 left-3 z-20">
          {isSelected ? (
            <CheckCircle2 size={24} className="text-orange-500 fill-orange-500/20" />
          ) : (
            <Circle size={24} className="text-slate-500" />
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-[#13131c] border-b border-slate-800">
        <span className="text-xs md:text-sm font-bold text-slate-400 font-mono">
          {t('sceneHeader', { order: String(cut.cut_order).padStart(2, '0') })}
        </span>
        {!isRegenerateMode && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 hover:text-purple-400 text-slate-500 transition-colors"
              onClick={(e) => { e.stopPropagation(); onModify(); }}
              title={t('refineWithAi')}
            >
              <Sparkles size={14} />
            </button>
            <ConfirmationDialog
              open={deleteConfirmationId === cut.id}
              onOpenChange={(open) => !open && onDeleteCancel()}
              title={tc('delete')}
              description={tc('deleteConfirm')}
              confirmLabel={tc('delete')}
              cancelLabel={tc('cancel')}
              onConfirm={onDeleteConfirm}
              variant="destructive"
              trigger={
                <button
                  className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
                >
                  <Trash2 size={14} />
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="flex flex-col md:flex-row min-h-[180px] md:min-h-[240px]">
        {/* Image Area */}
        <div className="w-full md:w-[55%] aspect-[4/3] md:aspect-auto bg-slate-900 relative flex items-center justify-center md:border-r border-b md:border-b-0 border-slate-800 overflow-hidden group/image">
          {cut.image_path ? (
            <>
              <img
                src={cut.image_path}
                alt="Cut"
                className={`w-full h-full object-cover transition-all ${isCurrentlyGenerating ? 'blur-sm scale-105 opacity-50' : ''}`}
              />
              {/* Loading Overlay */}
              {isCurrentlyGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <CustomLoader size={24} className="mb-2" />
                  <span className="text-[10px] text-purple-200 font-bold bg-black/50 px-2 py-0.5 rounded-full">{t('rendering')}</span>
                </div>
              )}
              {/* Regenerate Button Overlay - Hide in regenerate mode */}
              {!isCurrentlyGenerating && !isRegenerateMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isDisabledForGeneration}
                    onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                    className={`h-8 text-xs backdrop-blur-sm border ${isDisabledForGeneration ? 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
                  >
                    <RefreshCw size={12} className="mr-2" /> {t('regenerate') || "Regenerate"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-600 flex flex-col items-center gap-2 py-4 md:py-0">
              {isCurrentlyGenerating || (isBatchGenerating && !cut.image_path) ? (
                <>
                  <CustomLoader size={24} />
                  <span className="text-[10px] text-purple-400">
                    {isBatchGenerating && !isGenerating && cut.status !== 'generating' 
                      ? t('waiting') 
                      : t('rendering')}
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon size={32} className="opacity-30" />
                  <span className="text-[10px] opacity-50">{t('noImage')}</span>
                  {!isRegenerateMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDisabledForGeneration}
                      onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                      className={`h-6 text-[10px] mt-1 border border-slate-700 ${isDisabledForGeneration ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {t('generate')}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Script Area */}
        <div className="w-full md:w-[45%] p-4 md:p-5 flex flex-col">
          <span className="text-[10px] md:text-xs uppercase text-slate-500 font-bold mb-2 md:mb-3 tracking-wider">{t('visualScript')}</span>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-serif italic line-clamp-4 md:line-clamp-5 flex-1">
            &quot;{cut.script}&quot;
          </p>
          <div className="mt-4 md:mt-5 pt-3 md:pt-4 border-t border-slate-800/50 flex justify-between items-center">
            <span className="text-[10px] md:text-xs bg-slate-800 px-2 py-0.5 md:py-1 rounded text-slate-400 border border-slate-700 font-mono">{cut.aspect_ratio || '1:1'}</span>
            {cut.image_path && (
              <span className="text-[10px] md:text-xs text-purple-400 flex items-center gap-1 font-bold">
                <Wand2 size={12} /> {t('aiReady')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
