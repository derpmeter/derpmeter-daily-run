'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DirectorOption } from './types';

interface DirectorModeAreaProps {
  isOpen: boolean;
  scriptInput: string;
  directorOptions: DirectorOption[];
  isSuggesting: boolean;
  isRendering: string | null;
  onScriptChange: (value: string) => void;
  onSuggest: () => void;
  onOptionSelect: (option: DirectorOption) => void;
  onClose: () => void;
}

export function DirectorModeArea({
  isOpen,
  scriptInput,
  directorOptions,
  isSuggesting,
  isRendering,
  onScriptChange,
  onSuggest,
  onOptionSelect,
  onClose,
}: DirectorModeAreaProps) {
  const t = useTranslations('Project.Editor');

  if (!isOpen) return null;

  return (
    <div className="border border-purple-500/30 bg-[#13131c] p-4 rounded-xl shadow-2xl relative z-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-purple-400 font-bold text-sm flex items-center gap-2">
          <Wand2 size={14} /> {t('directorMode.title')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 text-xs text-slate-500 hover:text-white"
        >
          {t('directorMode.cancel')}
        </Button>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder={t('directorMode.placeholder')}
          value={scriptInput}
          onChange={(e) => onScriptChange(e.target.value)}
          className="bg-[#0f0f16] border-slate-700 min-h-[80px] text-sm text-slate-200 focus:border-purple-500"
        />
        {!directorOptions.length && (
          <Button
            onClick={onSuggest}
            disabled={isSuggesting || !scriptInput.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-9 text-xs shadow-lg shadow-purple-900/20"
          >
            {isSuggesting ? (
              <><Loader2 size={14} className="mr-2 animate-spin" /> {t('directorMode.analysing')}</>
            ) : (
              t('directorMode.getSuggestions')
            )}
          </Button>
        )}
      </div>

      {/* Options Display */}
      {directorOptions.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
          {directorOptions.map((opt) => (
            <div
              key={opt.id}
              className={`border border-slate-700 rounded-lg p-3 bg-[#0f0f16] cursor-pointer hover:border-purple-500 transition-all hover:scale-[1.02] active:scale-[0.98] ${isRendering === opt.id ? 'ring-1 ring-purple-500 opacity-50 pointer-events-none' : ''}`}
              onClick={() => onOptionSelect(opt)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-xs text-slate-200">{opt.label}</span>
                <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 bg-slate-800 rounded">{opt.aspect_ratio}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed border-t border-slate-800 pt-2">{opt.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
