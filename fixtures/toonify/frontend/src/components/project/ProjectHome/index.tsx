'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Settings, Palette, Sparkles } from 'lucide-react';

import ProjectLayout from '@/components/layout/ProjectLayout';
import ViewStyleModal from '../modals/ViewStyleModal';
import EditProjectModal from '../modals/EditProjectModal';
import GenerateEpisodeModal from '../modals/GenerateEpisodeModal';
import ArtStyleSetupModal from '../modals/ArtStyleSetupModal';
import CharacterDetailModal from '../modals/CharacterDetailModal';
import SuggestionDetailModal from '../modals/SuggestionDetailModal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

import { ProjectHero } from './ProjectHero';
import { CharacterSection } from './CharacterSection';
import { EpisodeSection } from './EpisodeSection';
import { SuggestionBanner } from './SuggestionBanner';
import { WorldviewSection } from './WorldviewSection';
import { useSuggestions, useCoverImage, useCharacters } from './hooks';

import type { ProjectHomeProps, HeroAction, Suggestion } from './types';

export default function ProjectHome({
  project,
  characters,
  episodes,
  onProjectUpdate,
  onCharacterAdd,
  onEpisodeAdd,
  onRefreshCharacters,
  ...props
}: ProjectHomeProps) {
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [isPrologueMode, setIsPrologueMode] = useState(false);
  const [isArtStyleModalOpen, setIsArtStyleModalOpen] = useState(false);
  const [isViewStyleModalOpen, setIsViewStyleModalOpen] = useState(false);

  // Suggestion Promote State
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isSuggestionDetailOpen, setIsSuggestionDetailOpen] = useState(false);
  const [suggestionToPromote, setSuggestionToPromote] = useState<Suggestion | null>(null);
  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations('Project.Home');
  const tCommon = useTranslations('Common');

  // Use URL params for navigation to avoid undefined issues
  const urlProjectId = params?.projectId as string;
  const safeProjectId = urlProjectId || project.id;

  // Custom Hooks
  const {
    suggestions,
    isSuggestionsLoading,
    isAiRecommending,
    handleAiRecommend,
    handlePromoteConfirm: promoteConfirm,
    promotingSuggestionIds,
  } = useSuggestions({
    projectId: project.id,
    suggestionsStatus: project.suggestions_status,
    onRefreshCharacters,
  });

  const { handleGenerateCover, isCoverProcessing } = useCoverImage({
    project,
    onProjectUpdate,
    onOpenEditModal: () => setIsEditModalOpen(true),
  });

  const {
    selectedCharacter,
    setSelectedCharacter,
    isCharacterDetailOpen,
    setIsCharacterDetailOpen,
    handleCharacterClick,
    handleCharacterRetry,
  } = useCharacters({
    characters,
    onRefreshCharacters,
  });

  // Handlers
  const handleUpdateProject = (updatedProject: typeof project) => {
    onProjectUpdate(updatedProject);
    setIsEditModalOpen(false);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsSuggestionDetailOpen(true);
  };

  const handleCastNowClick = (suggestion: Suggestion) => {
    setSuggestionToPromote(suggestion);
    setIsPromoteConfirmOpen(true);
  };

  const handleCastFromModal = (suggestion: Suggestion) => {
    setIsSuggestionDetailOpen(false);
    setSuggestionToPromote(suggestion);
    setTimeout(() => setIsPromoteConfirmOpen(true), 150);
  };

  const handlePromoteConfirm = async () => {
    if (!suggestionToPromote) return;
    await promoteConfirm(suggestionToPromote.id);
    setIsPromoteConfirmOpen(false);
    setSuggestionToPromote(null);
  };

  const handleStyleClick = () => {
    if (project.style_preset && project.style_preset !== 'anime_webtoon') {
      setIsViewStyleModalOpen(true);
    } else {
      setIsArtStyleModalOpen(true);
    }
  };

  // Check for setup query param
  useEffect(() => {
    if (searchParams && searchParams.get('setup') === 'true') {
      const timer = setTimeout(() => {
        setIsArtStyleModalOpen(true);
        const params = new URLSearchParams(searchParams);
        params.delete('setup');
        router.replace(`${pathname}?${params.toString()}`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, pathname]);

  // Priority Logic for CTA
  const getHeroAction = (): HeroAction | null => {
    // Priority 1: Missing Settings
    if ((!project.genres || project.genres.length === 0) && !project.genre || !project.worldview) {
      return {
        label: t('setupProject'),
        Icon: Settings,
        onClick: () => setIsEditModalOpen(true),
        variant: 'primary',
        description: t('setupDesc'),
        isLoader: false
      };
    }

    // Priority 2: Missing Art Style
    if (!project.style_preset) {
      return {
        label: t('selectStyle'),
        Icon: Palette,
        onClick: () => setIsArtStyleModalOpen(true),
        variant: 'primary',
        description: t('selectStyleDesc'),
        isLoader: false
      };
    }

    // Priority 3: No Characters -> scroll to cast section
    if (!characters || characters.length === 0) {
      const hasSuggestions = suggestions.length > 0 && project.suggestions_status === 'completed';
      const isProcessing = project.suggestions_status === 'processing';
      return {
        label: isProcessing ? t('preparingSuggestions') : (hasSuggestions ? t('suggestionsReady') : t('addChar')),
        Icon: isProcessing ? null : Sparkles,
        onClick: () => {
          document.getElementById('cast-section')?.scrollIntoView({ behavior: 'smooth' });
        },
        variant: isProcessing ? 'magic' : 'primary',
        disabled: isProcessing,
        description: isProcessing ? t('preparingSuggestionsDesc') : (hasSuggestions ? t('suggestionsReadyDesc') : t('addCharDesc')),
        isLoader: isProcessing
      };
    }

    // Priority 4: Missing or Failed Cover (Default Action)
    if (project.thumbnail_url && !isCoverProcessing) {
      return null;
    }

    return {
      label: isCoverProcessing ? t('generating') : t('genAiCover'),
      Icon: isCoverProcessing ? null : Sparkles,
      onClick: handleGenerateCover,
      disabled: isCoverProcessing,
      variant: 'magic',
      description: t('genAiCoverDesc'),
      isLoader: isCoverProcessing
    };
  };

  const heroAction = getHeroAction();

  return (
    <ProjectLayout projectId={project.id} projectTitle={project.title}>
      <div className="flex h-full relative overflow-y-auto bg-[#0A0A0B]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Hero Section */}
          <ProjectHero
            project={project}
            heroAction={heroAction}
            isCoverProcessing={isCoverProcessing}
            onOpenEditModal={() => setIsEditModalOpen(true)}
            onStyleClick={handleStyleClick}
            onGenerateCover={handleGenerateCover}
          />

          {/* Content Section */}
          <div className="flex-1 p-6 md:p-8 bg-[#0A0A0B]">
            <div className="max-w-7xl mx-auto flex flex-col gap-12">
              {/* Worldview Key Features */}
              <WorldviewSection project={project} />

              {/* AI Suggestions CTA Banner */}
              <SuggestionBanner
                project={project}
                suggestions={suggestions}
                characters={characters}
              />

              {/* Cast Section */}
              <CharacterSection
                project={project}
                characters={characters}
                suggestions={suggestions}
                isSuggestionsLoading={isSuggestionsLoading}
                isAiRecommending={isAiRecommending}
                safeProjectId={safeProjectId}
                promotingSuggestionIds={promotingSuggestionIds}
                onCharacterClick={handleCharacterClick}
                onAiRecommend={handleAiRecommend}
                onSuggestionClick={handleSuggestionClick}
              />

              {/* Episodes List */}
              <EpisodeSection
                episodes={episodes}
                safeProjectId={safeProjectId}
                onOpenEpisodeModal={() => setIsEpisodeModalOpen(true)}
                onOpenPrologueModal={(!episodes || episodes.length === 0) ? () => {
                  setIsPrologueMode(true);
                  setIsEpisodeModalOpen(true);
                } : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewStyleModal
        isOpen={isViewStyleModalOpen}
        onClose={() => setIsViewStyleModalOpen(false)}
        styleName={project.style_preset}
        styleImageUrl={project.style_reference_url}
        description={project.art_style}
      />
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        onUpdate={handleUpdateProject}
      />
      <GenerateEpisodeModal
        isOpen={isEpisodeModalOpen}
        onClose={() => {
          setIsEpisodeModalOpen(false);
          setIsPrologueMode(false);
        }}
        projectId={project.id}
        onGenerate={onEpisodeAdd}
        nextOrder={episodes ? episodes.length + 1 : 1}
        isPrologueMode={isPrologueMode}
      />
      <ArtStyleSetupModal
        isOpen={isArtStyleModalOpen}
        onClose={() => setIsArtStyleModalOpen(false)}
        projectId={project.id}
        currentStyle={project.style_preset}
        onStyleUpdate={(newStyle: string) => onProjectUpdate({ ...project, style_preset: newStyle })}
        projectTitle={project.title}
        projectGenre={project.genre}
      />
      <CharacterDetailModal
        isOpen={!!selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        character={selectedCharacter}
        onRetry={handleCharacterRetry}
        onDelete={onRefreshCharacters}
      />

      <SuggestionDetailModal
        isOpen={isSuggestionDetailOpen}
        onClose={() => setIsSuggestionDetailOpen(false)}
        suggestion={selectedSuggestion}
        onCast={handleCastFromModal}
      />

      <ConfirmationDialog
        open={isPromoteConfirmOpen}
        onOpenChange={setIsPromoteConfirmOpen}
        title={t('castConfirm')}
        description={t('castConfirmDesc')}
        confirmLabel={t('castConfirm')}
        cancelLabel={tCommon('cancel')}
        onConfirm={handlePromoteConfirm}
      />
    </ProjectLayout>
  );
}
