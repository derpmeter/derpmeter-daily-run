'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { sendGAEvent } from '@next/third-parties/google';
import type { StoryCut } from '../types';

interface UseCutGenerationOptions {
  activeEpisodeId: string | null | undefined;
  cuts: StoryCut[];
  addGeneratingId: (id: string) => void;
  removeGeneratingId: (id: string) => void;
  setEpisodeStatus: (status: string) => void;
  setActiveEpisodeStatus: (status: string) => void;
}


export function useCutGeneration({
  activeEpisodeId,
  cuts,
  addGeneratingId,
  removeGeneratingId,
  setEpisodeStatus,
  setActiveEpisodeStatus,
}: UseCutGenerationOptions) {
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('Project.Editor');

  const handleGenerateImage = useCallback(async (cutId: string): Promise<boolean> => {
    try {
      addGeneratingId(cutId);
      await api.post(`/episodes/${activeEpisodeId}/cuts/${cutId}/generate-image`, {});

      toast({
        title: t('toasts.genStarted'),
        description: t('toasts.genStartedDesc'),
      });
      sendGAEvent('event', 'generate_cut', {
        episode_id: activeEpisodeId,
        cut_id: cutId
      });
      return true;

    } catch (e) {
      console.error("Gen Image Failed", e);
      toast({ title: t('toasts.genFailed'), description: t('toasts.genServerFailed'), variant: "destructive" });
      removeGeneratingId(cutId);
      return false;
    }
  }, [activeEpisodeId, addGeneratingId, removeGeneratingId, toast, t]);

  const handleGenerateAll = useCallback(async () => {
    if (!activeEpisodeId) return;

    if (cuts.length === 0) {
      toast({ title: t('toasts.noCuts'), description: t('toasts.noCutsDesc') });
      return;
    }

    setIsBatchGenerating(true);
    
    const pendingCuts = cuts.filter(c => !c.image_path);
    toast({ title: t('toasts.batchStart'), description: t('toasts.batchStartDesc', { count: pendingCuts.length }) });

    try {
      await api.post(`/episodes/${activeEpisodeId}/generate-images`);

      setEpisodeStatus('generating');
      setActiveEpisodeStatus('generating');
      sendGAEvent('event', 'batch_generate_cuts', {
        episode_id: activeEpisodeId,
        cut_count: pendingCuts.length
      });

    } catch (err) {
      console.error("Batch Gen Failed", err);
      toast({ title: t('toasts.genFailed'), description: t('toasts.genServerFailed'), variant: "destructive" });
      setIsBatchGenerating(false);
    }
  }, [activeEpisodeId, cuts, toast, t, setEpisodeStatus, setActiveEpisodeStatus]);

  const handleRegenerateSelected = useCallback(async (selectedCutIds: Set<string>, clearSelection: () => void, setRegenerateMode: (v: boolean) => void) => {
    if (!activeEpisodeId || selectedCutIds.size === 0) return;

    const cutIds = Array.from(selectedCutIds);
    
    // Mark all as generating
    cutIds.forEach(id => addGeneratingId(id));
    
    toast({ 
      title: t('toasts.batchStart') || 'Regenerating...', 
      description: t('toasts.batchStartDesc', { count: cutIds.length }) || `Regenerating ${cutIds.length} cuts...`
    });

    try {
      await api.post(`/episodes/${activeEpisodeId}/regenerate-selected`, {
        cut_ids: cutIds
      });

      sendGAEvent('event', 'batch_regenerate_cuts', {
        episode_id: activeEpisodeId,
        cut_count: cutIds.length
      });
      
      // Clear selection and exit regenerate mode
      clearSelection();
      setRegenerateMode(false);

    } catch (err) {
      console.error("Batch Regen Failed", err);
      toast({ title: t('toasts.genFailed'), description: t('toasts.genServerFailed'), variant: "destructive" });
      cutIds.forEach(id => removeGeneratingId(id));
    }
  }, [activeEpisodeId, addGeneratingId, removeGeneratingId, toast, t]);

  // Reset batch generating flag when episode status changes
  const resetBatchGenerating = useCallback((status: string) => {
    if (status !== 'generating') {
      setIsBatchGenerating(false);
    }
  }, []);

  return {
    isBatchGenerating,
    setIsBatchGenerating,
    handleGenerateImage,
    handleGenerateAll,
    handleRegenerateSelected,
    resetBatchGenerating,
  };
}
