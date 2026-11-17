'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { StoryCut } from '../types';

interface UseStoryboardOptions {
  projectId: string;
  episodeId?: string;
}

export function useStoryboard({ projectId, episodeId: propEpisodeId }: UseStoryboardOptions) {
  const {
    activeEpisodeId: storeEpisodeId,
    setActiveCut,
    activeCutId,
    isReviewMode,
    setReviewMode,
    generatingIdsSet: generatingIds,
    addGeneratingId,
    removeGeneratingId,
    setActiveEpisodeStatus
  } = useCanvasStore();

  const activeEpisodeId = propEpisodeId || storeEpisodeId;
  const [cuts, setCuts] = useState<StoryCut[]>([]);
  const [loading, setLoading] = useState(false);
  const [episodeStatus, setEpisodeStatus] = useState<string>('ready');
  const { toast } = useToast();
  const t = useTranslations('Project.Editor');

  // Refs for scroll sync
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIdRef = useRef(activeEpisodeId);

  useEffect(() => {
    activeIdRef.current = activeEpisodeId;
  }, [activeEpisodeId]);

  // Fetch cuts
  const fetchCuts = useCallback(async (targetIdOverride?: string) => {
    const targetId = targetIdOverride || activeEpisodeId;
    if (!targetId) return;

    try {
      if (activeIdRef.current !== targetId && !targetIdOverride) return;

      const epRes = await api.get(`/episodes/${targetId}`);
      if (activeIdRef.current !== targetId && !targetIdOverride) return;

      const status = epRes.data.status || 'ready';
      setEpisodeStatus(status);
      setActiveEpisodeStatus(status);

      const res = await api.get(`/cuts/?episode_id=${targetId}`);
      if (activeIdRef.current !== targetId && !targetIdOverride) return;

      const newCuts = res.data as StoryCut[];
      setCuts(newCuts);

      // Cleanup finished generations
      newCuts.forEach(cut => {
        if (generatingIds.has(cut.id)) {
          if (cut.status !== 'generating' && cut.image_path) {
            removeGeneratingId(cut.id);
          }
          if (cut.status === 'failed') {
            removeGeneratingId(cut.id);
            toast({ title: t('toasts.genFailed'), variant: "destructive" });
          }
        }
      });
    } catch (err) {
      console.error("Fetch Cuts Error:", err);
    }
  }, [activeEpisodeId, generatingIds, removeGeneratingId, setActiveEpisodeStatus, toast, t]);

  // Navigate between cuts
  const navigateToCut = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = activeCutId ? cuts.findIndex(c => c.id === activeCutId) : -1;
    let newIndex = currentIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex <= 0 ? cuts.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= cuts.length - 1 ? 0 : currentIndex + 1;
    }

    if (cuts[newIndex]) {
      setActiveCut(cuts[newIndex].id);
      cutRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [cuts, activeCutId, setActiveCut]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (cuts.length === 0) return;
    
    const currentIndex = activeCutId ? cuts.findIndex(c => c.id === activeCutId) : -1;
    let newIndex = currentIndex;

    if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      newIndex = currentIndex <= 0 ? cuts.length - 1 : currentIndex - 1;
    } else if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      newIndex = currentIndex >= cuts.length - 1 ? 0 : currentIndex + 1;
    }

    if (newIndex !== currentIndex && cuts[newIndex]) {
      setActiveCut(cuts[newIndex].id);
      cutRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [cuts, activeCutId, setActiveCut]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Initial fetch
  useEffect(() => {
    setCuts([]);
    setEpisodeStatus('fetching');
    setActiveEpisodeStatus('fetching');
    setLoading(true);

    if (activeEpisodeId) {
      fetchCuts(activeEpisodeId).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeEpisodeId, setActiveEpisodeStatus]);

  // Polling for generation status
  useEffect(() => {
    const shouldPoll = (episodeStatus === 'generating') || (generatingIds.size > 0);
    if (!shouldPoll || !activeEpisodeId) return;

    const interval = setInterval(async () => {
      await fetchCuts();
    }, 2000);

    return () => clearInterval(interval);
  }, [episodeStatus, activeEpisodeId, generatingIds.size, fetchCuts]);

  return {
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
  };
}
