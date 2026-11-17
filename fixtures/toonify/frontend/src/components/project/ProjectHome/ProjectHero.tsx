'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MoreVertical, Settings, Palette, LayoutTemplate, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomLoader } from '@/components/ui/custom-loader';
import ImageGeneratingPlaceholder from '@/components/ui/ImageGeneratingPlaceholder';
import type { Project, HeroAction } from './types';

interface ProjectHeroProps {
  project: Project;
  heroAction: HeroAction | null;
  isCoverProcessing: boolean;
  onOpenEditModal: () => void;
  onStyleClick: () => void;
  onGenerateCover: () => void;
}

export function ProjectHero({
  project,
  heroAction,
  isCoverProcessing,
  onOpenEditModal,
  onStyleClick,
  onGenerateCover,
}: ProjectHeroProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const t = useTranslations('Project.Home');
  const tGenres = useTranslations('NewProject.genres');

  const descriptionText = project.description || project.worldview?.content || project.worldview?.description || t('noDesc');
  const isLongDescription = descriptionText.length > 200;

  return (
    <div 
      className="relative w-full h-[50vh] md:aspect-[21/9] md:h-auto md:max-h-[400px] bg-black group overflow-visible"
      onClick={() => setIsMenuOpen(false)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-all duration-700 overflow-hidden",
          isCoverProcessing && "opacity-50 filter blur-sm"
        )}
        style={{
          backgroundImage: project.thumbnail_url ? `url("${project.thumbnail_url}")` : undefined,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent pointer-events-none" />

      {/* Status Overlay for Processing */}
      {isCoverProcessing && (
        <ImageGeneratingPlaceholder text={t('generatingCoverArt')} />
      )}

      {/* Async Suggestions Banner */}
      {project.suggestions_status === 'processing' && (
        <div className="absolute top-0 left-0 w-full bg-purple-600/90 py-2 px-4 flex items-center justify-center gap-3 backdrop-blur-md z-20 animate-in slide-in-from-top-full duration-500">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
          <span className="text-sm font-bold text-white tracking-wide shadow-sm">
            {t('brainstormingBanner')}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full p-4 pt-16 sm:p-12 sm:pt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6 z-10">
        <div className="flex flex-col gap-2 sm:gap-4 max-w-2xl">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Genres */}
            {project.genres && project.genres.length > 0 ? (
              project.genres.map((gName, idx) => (
                <span key={idx} className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] sm:text-xs font-bold text-white border border-white/20">
                  {tGenres(gName.toLowerCase().replace(/\s/g, '') as any)}
                </span>
              ))
            ) : (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] sm:text-xs font-bold text-white border border-white/20">
                {(() => {
                  const knownGenres = ['fantasy', 'romance', 'sciFi', 'sliceOfLife', 'action', 'thriller', 'historical', 'comedy', 'mystery', 'horror'];
                  if (project.genre_id && knownGenres.includes(project.genre_id)) {
                    return tGenres(project.genre_id);
                  }
                  if (Array.isArray(project.genre)) return project.genre.join(', ');
                  if (project.genre) return project.genre;
                  return t('genreNotSet');
                })()}
              </span>
            )}
            {project.worldview?.tone && Array.isArray(project.worldview.tone) && project.worldview.tone.map((tone: string) => (
              <span key={tone} className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-purple-500/20 backdrop-blur-md text-[10px] sm:text-xs font-bold text-purple-200 border border-purple-500/30">
                {tone}
              </span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
            {project.title}
          </h1>
          <div className="max-w-xl hidden sm:block">
            <p className={cn("text-sm sm:text-lg text-gray-300 font-medium transition-all", isDescriptionExpanded ? "" : "line-clamp-2")}>
              {descriptionText}
            </p>
            {isLongDescription && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDescriptionExpanded(!isDescriptionExpanded);
                }}
                className="text-sm text-purple-400 hover:text-white mt-1 font-bold flex items-center gap-1"
              >
                {isDescriptionExpanded ? (
                  <><ChevronDown className="rotate-180 w-3 h-3" />{t('showLess')}</>
                ) : (
                  <><ChevronDown className="w-3 h-3" />{t('showMore')}</>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative self-end sm:self-auto">
          {/* Primary CTA */}
          {heroAction && (
            <Button
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                heroAction.onClick();
              }}
              disabled={heroAction.disabled}
              className={cn(
                "h-11 w-11 sm:h-12 sm:w-auto sm:px-6 rounded-full text-sm sm:text-base font-bold shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1",
                heroAction.variant === 'magic'
                  ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                  : "bg-white text-black hover:bg-gray-100",
                heroAction.disabled && "cursor-not-allowed opacity-70"
              )}
            >
              {heroAction.isLoader ? (
                <CustomLoader size={16} className="sm:mr-2" />
              ) : heroAction.Icon ? (
                <heroAction.Icon className="h-4 w-4 sm:mr-2" />
              ) : null}
              <span className="hidden sm:inline">{heroAction.label}</span>
            </Button>
          )}

          {/* Tooltip Menu Trigger */}
          <div className="relative">
            <Button
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12 bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <MoreVertical size={18} className="sm:w-5 sm:h-5" />
            </Button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#18181B] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-white/5">
                  {t('controls')}
                </div>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditModal();
                    setIsMenuOpen(false);
                  }}
                >
                  <Settings size={16} />
                  {t('settings')}
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStyleClick();
                    setIsMenuOpen(false);
                  }}
                >
                  <Palette size={16} />
                  {project.style_preset ? t('viewStyle') : t('selectStyleAction')}
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateCover();
                    setIsMenuOpen(false);
                  }}
                  disabled={isCoverProcessing}
                >
                  <LayoutTemplate size={16} />
                  {project.thumbnail_url ? t('regenCover') : t('genCover')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
