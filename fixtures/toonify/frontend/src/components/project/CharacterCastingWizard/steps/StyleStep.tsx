'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Check, X, Palette } from 'lucide-react';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectionCard } from '@/components/ui/selection-card';
import { useTranslations } from 'next-intl';
import { stepVariants, THEME_COLORS, PERSONALITY_TYPES } from '../types';

interface StyleStepProps {
  visualKeywords: string[];
  currentKeyword: string;
  themeColor: string;
  personalityTypes: string[];
  direction: number;
  onAddKeyword: () => void;
  onRemoveKeyword: (index: number) => void;
  onCurrentKeywordChange: (value: string) => void;
  onThemeColorChange: (color: string) => void;
  onPersonalityToggle: (type: string) => void;
}

export function StyleStep({
  visualKeywords,
  currentKeyword,
  themeColor,
  personalityTypes,
  direction,
  onAddKeyword,
  onRemoveKeyword,
  onCurrentKeywordChange,
  onThemeColorChange,
  onPersonalityToggle,
}: StyleStepProps) {
  const t = useTranslations('CharacterWizard');

  return (
    <motion.div
      key="style"
      custom={direction}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col h-full w-full px-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        {/* LEFT COLUMN: Visuals */}
        <div className="flex flex-col gap-8">
          {/* Keywords */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <SectionLabel className="text-[#d8b4fe]" icon={<Sparkles className="w-3 h-3" />}>
                {t('inputs.visualLabel')}
              </SectionLabel>
            </div>

            <div className="bg-[#0B0d12] border border-[#2a2f3a] rounded-xl p-4 min-h-[140px] flex flex-col gap-3 transition-all focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50">
              <div className="flex flex-wrap gap-2">
                {visualKeywords.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="px-2.5 py-1 bg-[#1c162e] text-purple-200 border border-purple-500/20 hover:bg-[#251d3d] transition-colors gap-1.5 font-normal">
                    {tag}
                    <button onClick={() => onRemoveKeyword(i)} className="text-purple-400 hover:text-white transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative mt-auto">
                <Input
                  className="bg-transparent border-none text-white placeholder:text-white/20 p-0 focus-visible:ring-0 h-auto text-sm"
                  placeholder={t('inputs.visualPlaceholder')}
                  value={currentKeyword}
                  onChange={(e) => onCurrentKeywordChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddKeyword()}
                />
                {currentKeyword && (
                  <button
                    onClick={onAddKeyword}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Theme Color */}
          <div className="space-y-3">
            <SectionLabel className="text-[#d8b4fe]" icon={<Palette className="w-3 h-3" />}>
              {t('inputs.themeLabel')}
            </SectionLabel>
            <div className="flex gap-3">
              {THEME_COLORS.map((color) => {
                const isSelected = themeColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => onThemeColorChange(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all relative",
                      isSelected ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Personality */}
        <div className="flex flex-col gap-3">
          <SectionLabel className="text-[#fbbf24]" icon={<span className='w-3 h-3 text-center leading-3'>☺</span>}>
            {t('inputs.personalityLabel')}
          </SectionLabel>

          <div className="grid grid-cols-2 gap-3 h-full">
            {PERSONALITY_TYPES.map((pType) => {
              const isSelected = personalityTypes.includes(pType);
              return (
                <SelectionCard
                  key={pType}
                  variant="filled"
                  selected={isSelected}
                  onClick={() => onPersonalityToggle(pType)}
                  className={cn(
                    "flex items-center justify-center font-medium",
                    isSelected && "bg-[#ea580c] border-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                  )}
                >
                  {t(`personalities.${pType}`)}
                </SelectionCard>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
