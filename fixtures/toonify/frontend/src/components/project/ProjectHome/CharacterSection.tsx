'use client';

import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/navigation';
import { Plus, Sparkles, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomLoader } from '@/components/ui/custom-loader';
import SectionTitle from '@/components/ui/SectionTitle';
import ActionButton from '@/components/ui/ActionButton';
import ImageGeneratingPlaceholder from '@/components/ui/ImageGeneratingPlaceholder';
import SuggestionCard from '@/components/project/SuggestionCard';
import type { Character, Suggestion, Project } from './types';

interface CharacterSectionProps {
  project: Project;
  characters: Character[];
  suggestions: Suggestion[];
  isSuggestionsLoading: boolean;
  isAiRecommending: boolean;
  safeProjectId: string;
  promotingSuggestionIds?: Set<string>;
  onCharacterClick: (char: Character) => void;
  onAiRecommend: () => void;
  onSuggestionClick: (suggestion: Suggestion) => void;
}

export function CharacterSection({
  project,
  characters,
  suggestions,
  isSuggestionsLoading,
  isAiRecommending,
  safeProjectId,
  promotingSuggestionIds = new Set(),
  onCharacterClick,
  onAiRecommend,
  onSuggestionClick,
}: CharacterSectionProps) {
  const router = useRouter();
  const t = useTranslations('Project.Home');

  return (
    <section id="cast-section">
      <SectionTitle
        color="purple"
        action={
          <div className="flex items-center gap-2">
            {/* AI Recommend Button - Desktop */}
            <ActionButton
              variant="gradient"
              size="sm"
              icon={Sparkles}
              onClick={onAiRecommend}
              disabled={isAiRecommending || project.suggestions_status === 'processing'}
              isLoading={isAiRecommending || project.suggestions_status === 'processing'}
              className="hidden sm:flex"
            >
              {(isAiRecommending || project.suggestions_status === 'processing') ? t('aiRecommending') : t('aiRecommend')}
            </ActionButton>
            
            {/* AI Recommend Button - Mobile Icon */}
            <ActionButton
              variant="gradient"
              size="icon"
              icon={isAiRecommending || project.suggestions_status === 'processing' ? Loader2 : Sparkles}
              onClick={onAiRecommend}
              disabled={isAiRecommending || project.suggestions_status === 'processing'}
              className="sm:hidden"
            />
            
            {/* Add Character Button - Desktop */}
            <ActionButton
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => router.push(`/project/${safeProjectId}/casting`)}
              className="hidden sm:flex"
            >
              {t('newChar')}
            </ActionButton>
            
            {/* Add Character Button - Mobile Icon */}
            <ActionButton
              variant="primary"
              size="icon"
              icon={Plus}
              onClick={() => router.push(`/project/${safeProjectId}/casting`)}
              className="sm:hidden"
            />
            
            {/* View All - with spacing */}
            <Link href={`/project/${safeProjectId}/characters`} className="ml-2">
              <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                {t('viewAll')} <ChevronDown size={12} className="-rotate-90" />
              </button>
            </Link>
          </div>
        }
      >
        <span className="flex items-center gap-2">
          {t('cast')}
          {(project.suggestions_status === 'processing' || isSuggestionsLoading) && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 animate-pulse">
              <Loader2 size={10} className="animate-spin text-purple-400" />
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">{t('aiRecommending')}</span>
            </span>
          )}
        </span>
      </SectionTitle>
      
      {/* Mobile: 3-column grid, Desktop: 4-6 columns */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
        <div
          onClick={() => router.push(`/project/${safeProjectId}/casting`)}
          className="aspect-[3/4] cursor-pointer rounded-xl border border-dashed border-gray-800 bg-[#0F0F12] flex flex-col items-center justify-center gap-2 hover:bg-[#15151A] hover:border-gray-700 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
            <Plus size={16} />
          </div>
          <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300">{t('addChar')}</span>
        </div>

        {[...characters].reverse().slice(0, 5).map(char => {
          const isGenerating = char.sheet_status === 'pending' || char.sheet_status === 'processing';
          const isFailed = char.sheet_status === 'failed';
          return (
            <div
              key={char.id || char.name}
              onClick={() => onCharacterClick(char)}
              className={cn(
                "group relative rounded-xl overflow-hidden bg-[#0F0F12] border transition-all cursor-pointer",
                isFailed
                  ? "border-red-500/50 hover:border-red-500"
                  : "border-gray-800 hover:border-gray-700"
              )}
            >
              <div className="aspect-[3/4] bg-cover bg-center relative" style={char.profile_image_url && !isGenerating ? { backgroundImage: `url("${char.profile_image_url}")` } : {}}>
                {isGenerating && (
                  <ImageGeneratingPlaceholder text={t('creating')} />
                )}

                {(!char.profile_image_url && !isGenerating && !isFailed) && (
                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-gray-600 gap-2">
                    <span className="font-bold text-xl">{char.name[0]}</span>
                  </div>
                )}

                {isFailed && (
                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-gray-600 gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                      <AlertCircle size={16} />
                    </div>
                    <span className="text-[10px] text-red-400 font-bold">{t('failed')}</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h4 className="text-white text-xs font-bold truncate drop-shadow-lg">{char.name}</h4>
                  <p className="text-[10px] text-gray-300 truncate drop-shadow-md">{Array.isArray(char.default_mood) ? char.default_mood.join(', ') : (char.default_mood || 'Neutral')}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Brainstorming Card */}
        {(project.suggestions_status === 'processing' || (isSuggestionsLoading && suggestions.length === 0)) && (
          <div className="aspect-[3/4] rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col items-center justify-center gap-3 p-2 sm:p-4 text-center animate-pulse">
            <CustomLoader size={40} />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{t('preparingSuggestions')}</p>
              <p className="text-[9px] text-gray-500 leading-tight">{t('preparingSuggestionsDesc')}</p>
            </div>
          </div>
        )}

        {/* Suggestions Cards (Top 3) */}
        {suggestions.length > 0 && suggestions.slice(0, 3).map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            isPromoting={promotingSuggestionIds.has(suggestion.id)}
          />
        ))}
      </div>
    </section>
  );
}
