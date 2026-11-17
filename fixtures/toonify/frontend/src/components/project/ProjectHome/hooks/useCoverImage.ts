'use client';

import { useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { Project } from '../types';

interface UseCoverImageOptions {
  project: Project;
  onProjectUpdate: (p: Project) => void;
  onOpenEditModal: () => void;
}

interface UseCoverImageReturn {
  handleGenerateCover: () => Promise<void>;
  isCoverProcessing: boolean;
}

export function useCoverImage({
  project,
  onProjectUpdate,
  onOpenEditModal,
}: UseCoverImageOptions): UseCoverImageReturn {
  const { toast } = useToast();
  const t = useTranslations('Project.Home');

  const isCoverProcessing = project.cover_image_status === 'processing';

  const handleGenerateCover = useCallback(async () => {
    if ((!project.genres || project.genres.length === 0) && !project.genre) {
      toast({
        title: t('missingInfo'),
        description: t('setGenreFirst'),
      });
      onOpenEditModal();
      if (!project.worldview) return;
      return;
    }

    try {
      onProjectUpdate({ ...project, cover_image_status: 'processing' });
      await api.post(`/projects/${project.id}/cover`);
      toast({
        title: t('genStarted'),
        description: t('creatingCover'),
      });
    } catch (e) {
      console.error(e);
      toast({
        title: t('reqFailed'),
        description: t('startCoverFailed'),
        variant: 'destructive',
      });
      onProjectUpdate({ ...project, cover_image_status: 'failed' });
    }
  }, [project, onProjectUpdate, onOpenEditModal, toast, t]);

  // Polling for cover image status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCoverProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/projects/${project.id}`);
          const updatedProject = res.data;

          if (updatedProject.cover_image_status !== 'processing') {
            onProjectUpdate(updatedProject);
            clearInterval(interval);

            if (updatedProject.cover_image_status === 'completed') {
              toast({
                title: t('coverGenerated'),
                description: t('coverSuccess'),
              });
            } else if (updatedProject.cover_image_status === 'failed') {
              toast({
                title: t('genFailed'),
                description: t('coverFailed'),
                variant: 'destructive'
              });
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCoverProcessing, project.id, onProjectUpdate, toast, t]);

  return {
    handleGenerateCover,
    isCoverProcessing,
  };
}
