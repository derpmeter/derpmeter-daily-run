'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { sendGAEvent } from '@next/third-parties/google';
import type { StoryCut, DirectorOption } from '../types';

interface UseDirectorModeOptions {
  projectId: string;
  activeEpisodeId: string | null | undefined;
  cuts: StoryCut[];
  fetchCuts: () => Promise<void>;
}


export function useDirectorMode({
  projectId,
  activeEpisodeId,
  cuts,
  fetchCuts,
}: UseDirectorModeOptions) {
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [scriptInput, setScriptInput] = useState('');
  const [directorOptions, setDirectorOptions] = useState<DirectorOption[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isRendering, setIsRendering] = useState<string | null>(null);
  const [modifyingCut, setModifyingCut] = useState<StoryCut | null>(null);
  
  const { toast } = useToast();
  const t = useTranslations('Project.Editor');

  const handleDirectorSuggest = useCallback(async () => {
    if (!scriptInput.trim()) return;
    try {
      setIsSuggesting(true);
      const res = await api.post('/scenes/structure', {
        script: scriptInput,
        project_id: projectId
      });
      if (res.data && res.data.options) {
        setDirectorOptions(res.data.options);
      }
    } catch (err) {
      console.error("Director Suggest Error", err);
      toast({
        title: t('toasts.suggestionFailed'),
        description: t('toasts.suggestionFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  }, [scriptInput, projectId, toast, t]);

  const handleOptionSelect = useCallback(async (option: DirectorOption) => {
    if (!activeEpisodeId) return;
    try {
      setIsRendering(option.id);

      // 1. Render the image
      const renderRes = await api.post('/scenes/render', {
        prompt: option.image_prompt,
        width: option.aspect_ratio === '16:9' ? 1024 : 768,
        height: 1024
      });
      const imageUrl = renderRes.data.image_url;

      // 2. Save the Cut
      const nextOrder = cuts.length > 0 ? cuts[cuts.length - 1].cut_order + 1 : 1;
      await api.post('/cuts', {
        episode_id: activeEpisodeId,
        cut_order: nextOrder,
        script: scriptInput,
        selected_layout: 'single',
        aspect_ratio: option.aspect_ratio,
        image_path: imageUrl,
        dialogues: []
      });

      sendGAEvent('event', 'director_create_scene', {
        project_id: projectId,
        aspect_ratio: option.aspect_ratio
      });

      // 3. Reset and Refresh
      setIsDirectorMode(false);
      setScriptInput('');
      setDirectorOptions([]);
      fetchCuts();

    } catch (err) {
      console.error("Render & Save Error", err);
      toast({
        title: t('toasts.creationFailed'),
        description: t('toasts.creationFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsRendering(null);
    }
  }, [activeEpisodeId, cuts, scriptInput, projectId, fetchCuts, toast, t]);

  const closeDirectorMode = useCallback(() => {
    setIsDirectorMode(false);
    setDirectorOptions([]);
    setScriptInput('');
  }, []);

  return {
    isDirectorMode,
    setIsDirectorMode,
    scriptInput,
    setScriptInput,
    directorOptions,
    isSuggesting,
    isRendering,
    modifyingCut,
    setModifyingCut,
    handleDirectorSuggest,
    handleOptionSelect,
    closeDirectorMode,
  };
}
