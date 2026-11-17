'use client';

import { useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { sendGAEvent } from '@next/third-parties/google';

interface UseExportOptions {
  activeEpisodeId: string | null | undefined;
}


export function useExport({ activeEpisodeId }: UseExportOptions) {
  const { toast } = useToast();
  const t = useTranslations('Project.Editor');

  const handleExport = useCallback(async (format: 'zip' | 'webtoon') => {
    if (!activeEpisodeId) return;
    try {
      toast({ title: t('toasts.exporting'), description: t('toasts.exportPreparing') });
      const response = await api.post(`/episodes/${activeEpisodeId}/export?format=${format}`, {}, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Try to extract filename from header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `episode_export.${format === 'zip' ? 'zip' : 'png'}`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          filename = fileNameMatch[1];
        }

        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8Match && utf8Match.length === 2) {
          filename = decodeURIComponent(utf8Match[1]);
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      sendGAEvent('event', 'export_episode', {
        episode_id: activeEpisodeId,
        format: format
      });
    } catch (err: any) {
      console.error("Export failed", err);

      let errorMessage = t('toasts.exportDownloadFailed');
      if (err.response && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
        try {
          const text = await err.response.data.text();
          const errorObj = JSON.parse(text);
          if (errorObj.detail) errorMessage = errorObj.detail;
        } catch (e) { /* ignore */ }
      }

      toast({ title: t('toasts.exportFailed'), description: errorMessage, variant: "destructive" });
    }
  }, [activeEpisodeId, toast, t]);

  return { handleExport };
}
