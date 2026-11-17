'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { Suggestion, Project } from '../types';

interface UseSuggestionsOptions {
  projectId: string;
  suggestionsStatus?: string;
  onRefreshCharacters?: () => void;
}

interface UseSuggestionsReturn {
  suggestions: Suggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  isSuggestionsLoading: boolean;
  isAiRecommending: boolean;
  handleAiRecommend: () => Promise<void>;
  handlePromoteConfirm: (suggestionId: string) => Promise<void>;
  promotingSuggestionIds: Set<string>;
}

export function useSuggestions({
  projectId,
  suggestionsStatus,
  onRefreshCharacters,
}: UseSuggestionsOptions): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isAiRecommending, setIsAiRecommending] = useState(false);
  const [promotingSuggestionIds, setPromotingSuggestionIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const t = useTranslations('Project.Home');

  const handleAiRecommend = useCallback(async () => {
    setIsAiRecommending(true);
    try {
      await api.post('/characters/suggestions/batch', { project_id: projectId });
      toast({ title: t('recommendations'), description: t('preparingSuggestionsDesc') });
      setIsSuggestionsLoading(true);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to generate AI recommendations', variant: 'destructive' });
    } finally {
      setIsAiRecommending(false);
    }
  }, [projectId, toast, t]);

  const handlePromoteConfirm = useCallback(async (suggestionId: string) => {
    // Check if this specific suggestion is already being promoted
    if (promotingSuggestionIds.has(suggestionId)) return;
    
    // Add this suggestion to the promoting set
    setPromotingSuggestionIds(prev => new Set(prev).add(suggestionId));
    
    try {
      await api.post(`/characters/suggestions/${suggestionId}/promote`);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      if (onRefreshCharacters) onRefreshCharacters();
      toast({ title: t('castSuccess') });
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 409) {
        toast({ title: t('alreadyCast'), variant: 'destructive' });
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        if (onRefreshCharacters) onRefreshCharacters();
      } else {
        toast({ title: "Error", description: t('castFailed'), variant: 'destructive' });
      }
    } finally {
      // Remove this suggestion from the promoting set
      setPromotingSuggestionIds(prev => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }
  }, [promotingSuggestionIds, onRefreshCharacters, toast, t]);

  // Polling for suggestions
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkSuggestions = async () => {
      try {
        const res = await api.get(`/characters/suggestions/${projectId}`);
        setSuggestions(res.data);

        if (res.data.length > 0 || suggestionsStatus === 'completed') {
          setIsSuggestionsLoading(false);
          if (interval) clearInterval(interval);
        }
      } catch (e) {
        console.error("Failed to fetch suggestions", e);
      }
    };

    checkSuggestions();

    if (suggestionsStatus === 'processing' || (suggestionsStatus === 'pending' && suggestions.length === 0)) {
      setIsSuggestionsLoading(true);
      interval = setInterval(checkSuggestions, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectId, suggestionsStatus]);

  return {
    suggestions,
    setSuggestions,
    isSuggestionsLoading,
    isAiRecommending,
    handleAiRecommend,
    handlePromoteConfirm,
    promotingSuggestionIds,
  };
}
