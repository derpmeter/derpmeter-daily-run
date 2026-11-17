'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, RefreshCw, X, CheckSquare, Square } from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import MobileEpisodeViewer from '@/components/viewer/MobileEpisodeViewer';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCanvasStore } from '@/store/useCanvasStore';

import { useStoryboard, useCutGeneration, useExport, useDirectorMode } from './hooks';
import { StoryboardToolbar } from './StoryboardToolbar';
import { PositionIndicator } from './PositionIndicator';
import { CutCard } from './CutCard';
import { DirectorModeArea } from './DirectorModeArea';
import type { StoryboardViewProps } from './types';

export default function StoryboardView({ projectId, episodeId: propEpisodeId }: StoryboardViewProps) {
  const t = useTranslations('Project.Editor');
  const { toast } = useToast();
  
  // Regenerate mode state from store
  const { 
    isRegenerateMode, 
    setRegenerateMode, 
    selectedCutIds, 
    toggleCutSelection, 
    clearCutSelection,
    selectAllCuts 
  } = useCanvasStore();
  
  // Main storyboard state
  const {
    activeEpisodeId,
    cuts,
    setCuts,
    loading,
    episodeStatus,
    setEpisodeStatus,
    activeCutId,
    setActiveCut,
    isReviewMode,
    setReviewMode,
    generatingIds,
    addGeneratingId,
    removeGeneratingId,
    setActiveEpisodeStatus,
    scrollContainerRef,
    cutRefs,
    fetchCuts,
    navigateToCut,
  } = useStoryboard({ projectId, episodeId: propEpisodeId });

  // Cut generation
  const {
    isBatchGenerating,
    setIsBatchGenerating,
    handleGenerateImage,
    handleGenerateAll,
    handleRegenerateSelected,
  } = useCutGeneration({
    activeEpisodeId,
    cuts,
    addGeneratingId,
    removeGeneratingId,
    setEpisodeStatus,
    setActiveEpisodeStatus,
  });

  // Export
  const { handleExport } = useExport({ activeEpisodeId });

  // Director mode
  const {
    isDirectorMode,
    setIsDirectorMode,
    scriptInput,
    setScriptInput,
    directorOptions,
    isSuggesting,
    isRendering,
    setModifyingCut,
    handleDirectorSuggest,
    handleOptionSelect,
    closeDirectorMode,
  } = useDirectorMode({
    projectId,
    activeEpisodeId,
    cuts,
    fetchCuts,
  });

  // Delete confirmation state
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const handleDeleteConfirm = async (id: string) => {
    try {
      await api.delete(`/cuts/${id}`);
      fetchCuts();
      toast({
        title: t('toasts.sceneDeleted'),
        description: t('toasts.sceneDeletedDesc'),
      });
    } catch (err) {
      console.error("Failed to delete cut", err);
      toast({
        title: t('toasts.deleteFailed'),
        description: t('toasts.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  // Handle cut click in regenerate mode
  const handleCutClick = (cutId: string) => {
    if (isRegenerateMode) {
      toggleCutSelection(cutId);
    } else {
      setActiveCut(cutId);
    }
  };

  // Select all cuts with images
  const handleSelectAll = () => {
    const cutsWithImages = cuts.filter(c => c.image_path).map(c => c.id);
    selectAllCuts(cutsWithImages);
  };

  // Reset batch generating flag when status changes
  if (episodeStatus !== 'generating' && isBatchGenerating) {
    setIsBatchGenerating(false);
  }

  if (!activeEpisodeId) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 bg-[#05050a] font-mono text-sm">
        {t('selectEpisode')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#05050a] relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 z-0" />

      {/* Header */}
      <StoryboardToolbar
        cuts={cuts}
        isBatchGenerating={isBatchGenerating}
        onGenerateAll={handleGenerateAll}
        onExport={handleExport}
        isRegenerateMode={isRegenerateMode}
        onToggleRegenerateMode={() => setRegenerateMode(!isRegenerateMode)}
      />

      {/* Main Content Area with Position Indicator */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* Position Indicator Sidebar */}
        <PositionIndicator
          cuts={cuts}
          activeCutId={activeCutId}
          cutRefs={cutRefs}
          onNavigate={navigateToCut}
          onCutClick={(cutId) => handleCutClick(cutId)}
        />

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar"
        >
          <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8 pb-20">

            {loading ? (
              <div className="text-slate-500 text-center py-10 flex flex-col items-center">
                <CustomLoader size={24} className="mb-2" />
                <span className="text-xs">{t('loadingScenes')}</span>
              </div>
            ) : cuts.length === 0 && episodeStatus === 'generating' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="mb-6">
                  <CustomLoader size={64} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('generatingEpisode')}</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-4 leading-relaxed">
                  {t('generatingDesc')}
                </p>
                <p className="text-slate-500 text-xs">
                  {t('canLeaveScreen')}
                </p>
              </div>
            ) : cuts.length === 0 && !isDirectorMode ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-[#0f0f16]">
                <div className="text-slate-500 italic mb-4 text-sm">{t('noScenes')}</div>
                <Button
                  onClick={() => setIsDirectorMode(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 font-bold"
                >
                  <Wand2 size={16} className="mr-2" /> {t('startDirectorMode')}
                </Button>
              </div>
            ) : (
              cuts.map((cut, index) => (
                <CutCard
                  key={cut.id}
                  cut={cut}
                  index={index}
                  isSelected={isRegenerateMode ? selectedCutIds.has(cut.id) : activeCutId === cut.id}
                  isGenerating={generatingIds.has(cut.id)}
                  isBatchGenerating={isBatchGenerating}
                  episodeStatus={episodeStatus}
                  deleteConfirmationId={deleteConfirmationId}
                  onSelect={() => handleCutClick(cut.id)}
                  onGenerate={() => handleGenerateImage(cut.id)}
                  onModify={() => setModifyingCut(cut)}
                  onDeleteRequest={() => setDeleteConfirmationId(cut.id)}
                  onDeleteConfirm={() => handleDeleteConfirm(cut.id)}
                  onDeleteCancel={() => setDeleteConfirmationId(null)}
                  cutRef={(el) => { cutRefs.current[index] = el; }}
                  isRegenerateMode={isRegenerateMode}
                />
              ))
            )}

            {/* Director Mode Area */}
            <DirectorModeArea
              isOpen={isDirectorMode}
              scriptInput={scriptInput}
              directorOptions={directorOptions}
              isSuggesting={isSuggesting}
              isRendering={isRendering}
              onScriptChange={setScriptInput}
              onSuggest={handleDirectorSuggest}
              onOptionSelect={handleOptionSelect}
              onClose={closeDirectorMode}
            />
          </div>
        </div>
      </div>

      {/* Regenerate Mode Floating Action Bar */}
      {isRegenerateMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-slate-400 hover:text-white text-xs"
            >
              <CheckSquare size={14} className="mr-1" />
              {t('selectAll') || '전체 선택'}
            </Button>
            
            <div className="h-4 w-px bg-slate-700" />
            
            <span className="text-xs text-slate-400">
              {selectedCutIds.size}개 선택됨
            </span>
            
            <Button
              onClick={() => handleRegenerateSelected(selectedCutIds, clearCutSelection, setRegenerateMode)}
              disabled={selectedCutIds.size === 0}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-xs px-4 disabled:opacity-50"
            >
              <RefreshCw size={14} className="mr-1" />
              {t('regenerateSelected') || '다시 생성'} ({selectedCutIds.size})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearCutSelection();
                setRegenerateMode(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Viewer */}
      <MobileEpisodeViewer
        isOpen={isReviewMode}
        onClose={() => setReviewMode(false)}
        title={t('episodePreview')}
        episodeId={activeEpisodeId || ''}
        cuts={cuts}
        onUpdateCut={(cutId, newPath) => {
          setCuts(prev => prev.map(c => c.id === cutId ? { ...c, image_path: newPath } : c));
        }}
        mode={isReviewMode ? 'review' : 'view'}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
