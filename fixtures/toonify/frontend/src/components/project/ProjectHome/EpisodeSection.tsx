'use client';

import { cn, formatDate } from '@/lib/utils';
import { Link, useRouter } from '@/navigation';
import { Plus, Clapperboard, ChevronDown, Calendar, Film, BookOpen } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import SectionTitle from '@/components/ui/SectionTitle';
import ActionButton from '@/components/ui/ActionButton';
import type { Episode } from './types';

interface EpisodeSectionProps {
  episodes: Episode[];
  safeProjectId: string;
  onOpenEpisodeModal: () => void;
  onOpenPrologueModal?: () => void;
}

export function EpisodeSection({
  episodes,
  safeProjectId,
  onOpenEpisodeModal,
  onOpenPrologueModal,
}: EpisodeSectionProps) {
  const router = useRouter();
  const t = useTranslations('Project.Home');
  const locale = useLocale();

  const hasEpisodes = episodes && episodes.length > 0;

  return (
    <section>
      <SectionTitle
        color="indigo"
        action={
          <div className="flex items-center gap-2">
            {hasEpisodes ? (
              // Show regular "New Episode" button when episodes exist
              <ActionButton
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={onOpenEpisodeModal}
              >
                {t('newEpisode')}
              </ActionButton>
            ) : onOpenPrologueModal ? (
              // Show "Create Prologue" button when no episodes
              <ActionButton
                variant="primary"
                size="sm"
                icon={BookOpen}
                onClick={onOpenPrologueModal}
              >
                {t('createPrologue')}
              </ActionButton>
            ) : null}
            {hasEpisodes && (
              <Link href={`/project/${safeProjectId}/episodes`} className="hidden sm:block">
                <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                  {t('viewAll')} <ChevronDown size={12} className="-rotate-90" />
                </button>
              </Link>
            )}
          </div>
        }
      >
        {t('episodes')} <span className="text-slate-500 text-sm font-normal ml-1 translate-y-[1px]">{episodes?.length || 0}</span>
      </SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {hasEpisodes ? (
          episodes.map((ep) => (
            <div
              key={ep.id}
              onClick={() => router.push(`/project/${safeProjectId}/editor?episode_id=${ep.id}`)}
              className="group relative flex flex-col bg-[#0F0F12] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-black/40 relative overflow-hidden">
                {(ep.first_cut_image || ep.thumbnail_url) ? (
                  <img
                    src={ep.first_cut_image || ep.thumbnail_url}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt=""
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback placeholder */}
                <div 
                  className="w-full h-full flex items-center justify-center bg-[#15151A] absolute inset-0"
                  style={{ display: (ep.first_cut_image || ep.thumbnail_url) ? 'none' : 'flex' }}
                >
                  <span className="text-4xl font-mono font-bold text-gray-700 group-hover:text-gray-600 transition-colors">
                    {String(ep.episode_order || 0).padStart(2, '0')}
                  </span>
                </div>

                {/* Overlay Status */}
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
                    (ep.first_cut_image || ep.thumbnail_url)
                      ? "bg-green-500/20 text-green-200 border-green-500/30"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  )}>
                    {(ep.first_cut_image || ep.thumbnail_url) ? t('ready') : t('draft')}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-200 line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {ep.title}
                  </h3>
                </div>

                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-800/50">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDate(ep.created_at, locale)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Film size={12} />
                    {t('episode')} {ep.episode_order || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-800 rounded-xl bg-[#0f0f16]">
            <div className="p-3 rounded-full bg-slate-800/50 text-slate-500">
              <Clapperboard size={24} />
            </div>
            <p className="text-sm text-slate-500">{t('noEpisodes')}</p>
            <p className="text-xs text-slate-600">{t('createPrologueDesc')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
