'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Users, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Project, Suggestion, Character } from './types';

interface SuggestionBannerProps {
  project: Project;
  suggestions: Suggestion[];
  characters: Character[];
}

export function SuggestionBanner({
  project,
  suggestions,
  characters,
}: SuggestionBannerProps) {
  const t = useTranslations('Project.Home');

  // Only show if suggestions are completed, we have suggestions, and no characters yet
  if (!(project.suggestions_status === 'completed' && suggestions.length > 0 && characters.length === 0)) {
    return null;
  }

  return (
    <div
      className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 via-purple-800/20 to-indigo-900/40 border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group shadow-2xl shadow-purple-900/20 mb-4"
    >
      {/* Ambient Glow */}
      <div className="absolute top-[-50%] left-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-600/30 transition-all" />

      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity translate-x-1/4 -translate-y-1/4">
        <Sparkles size={180} />
      </div>

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex gap-6 items-center">
          <Button
            variant="ghost"
            className="absolute inset-0 w-full h-full p-0 opacity-0 z-10"
            onClick={() => {
              document.getElementById('cast-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0 transform group-hover:scale-110 transition-transform duration-500">
            <Users size={32} className="text-white" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">
              {t('suggestionsReady')}
            </h3>
            <p className="text-gray-400 text-sm max-w-lg leading-relaxed font-medium">
              {t('suggestionsReadyDesc')}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <Button className="bg-white text-black hover:bg-gray-100 font-black px-10 rounded-full h-14 shrink-0 shadow-xl shadow-black/20 text-md group-hover:scale-105 transition-all">
            {t('cast')} <ArrowRight size={18} className="ml-2" />
          </Button>
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest text-center animate-pulse">
            NEW CONCEPTS GENERATED
          </p>
        </div>
      </div>
    </div>
  );
}
