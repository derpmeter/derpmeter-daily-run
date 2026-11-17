'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Calendar, Film } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import EpisodeGenerationModal from './EpisodeGenerationModal';
import { Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/utils';


interface Episode {
    id: string;
    title: string;
    episode_order: number;
    thumbnail_url?: string;
    created_at?: string;
    status?: string; // ready, generating, failed
}

export default function EpisodeList() {
    const t = useTranslations('Common');
    const te = useTranslations('Project.Editor.EpisodeList');
    const locale = useLocale();
    const params = useParams();
    const projectId = params?.projectId as string;
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const { setActiveEpisode, activeEpisodeId } = useCanvasStore(); // Use store


    const fetchEpisodes = async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await api.get(`/episodes/?project_id=${projectId}`);
            setEpisodes(res.data);
        } catch (err) {
            console.error("Fetch Episodes Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const [creating, setCreating] = useState(false);

    const createEpisode = async () => {
        if (creating) return;
        try {
            setCreating(true);
            const maxOrder = episodes.length > 0 ? Math.max(...episodes.map(e => e.episode_order)) : 0;
            const nextNumber = maxOrder + 1;
            await api.post('/episodes', {
                title: `Episode ${nextNumber}`,
                project_id: projectId,
                episode_order: nextNumber
            });
            await fetchEpisodes();
        } catch (err) {
            console.error("Failed to create episode", err);
        } finally {
            setCreating(false);
        }
    }

    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

    const handleDeleteConfirm = async (id: string) => {
        try {
            await api.delete(`/episodes/${id}`);
            if (activeEpisodeId === id) setActiveEpisode(null);
            fetchEpisodes();
        } catch (err) {
            console.error("Failed to delete episode", err);
        }
    };

    const [genModalOpen, setGenModalOpen] = useState(false);

    const handleEpisodeCreated = async (newItem: any) => {
        // Optimistic update or just fetch
        // If newItem contains full episode data with 'generating' status, we can optimistically add it
        if (newItem) {
            setEpisodes(prev => [...prev, newItem].sort((a, b) => a.episode_order - b.episode_order));
            // Don't set active if generating? Or maybe select it so user sees it
            // setActiveEpisode(newItem.id); 
        } else {
            await fetchEpisodes();
        }
    };

    useEffect(() => {
        fetchEpisodes();
    }, [projectId]);

    // Polling for generating episodes
    useEffect(() => {
        // Only run if there are episodes with 'generating' status
        const generatingEpisodes = episodes.filter(e => e.status === 'generating');
        if (generatingEpisodes.length === 0) return;

        const interval = setInterval(async () => {
            // console.log("Polling generating episodes...", generatingEpisodes.map(e => e.id));

            // Check status of all generating episodes
            const statuses = await Promise.all(generatingEpisodes.map(async (ep) => {
                try {
                    const res = await api.get(`/episodes/${ep.id}`);
                    return { id: ep.id, status: res.data.status, data: res.data };
                } catch {
                    return null;
                }
            }));

            // If any finished, update the list
            const finished = statuses.filter(s => s && s.status !== 'generating');

            if (finished.length > 0) {
                // We could do a partial update or a full fetch. 
                // Full fetch is safer to ensure we get creation dates, thumbnails etc.
                await fetchEpisodes();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [episodes]);

    return (
        <div className="flex flex-col h-full bg-[#0f0f16]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">{te('title')}</h3>
                <span className="text-xs text-slate-500 font-mono">{episodes.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 custom-scrollbar">
                {loading ? (
                    <div className="text-slate-500 text-xs text-center py-4">{t('loading')}</div>
                ) : episodes.length === 0 ? (
                    <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl m-2">
                        <div className="text-slate-500 text-xs italic mb-4">{te('empty')}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 text-purple-400 hover:text-purple-300 hover:bg-slate-700 hover:border-purple-500 w-full"
                            onClick={() => setGenModalOpen(true)}
                        >
                            <Sparkles size={14} className="mr-2" />{te('autoGenerate')}
                        </Button>
                    </div>
                ) : (
                    episodes.map((ep) => (
                        <div
                            key={ep.id}
                            data-testid={`episode-item-${ep.id}`}
                            className={`p-2 rounded-lg cursor-pointer transition-all group border ${activeEpisodeId === ep.id
                                ? 'bg-purple-900/20 border-purple-500/50'
                                : 'bg-[#15151A] border-transparent hover:bg-slate-800 hover:border-slate-700'
                                }`}
                            onClick={() => setActiveEpisode(ep.id)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-bold truncate pr-2 ${activeEpisodeId === ep.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                    {ep.title}
                                </span>
                                {activeEpisodeId === ep.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(ep.created_at, locale)}</span>
                                <span className="flex items-center gap-1"><Film size={10} /> #{ep.episode_order}</span>
                            </div>

                            {ep.status === 'generating' && (
                                <div className="mt-2 text-[10px] text-purple-400 flex items-center gap-1 animate-pulse">
                                    <Sparkles size={10} className="animate-spin" /> {te('generating') || 'Generating...'}
                                </div>
                            )}

                            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ConfirmationDialog
                                    open={deleteConfirmationId === ep.id}
                                    onOpenChange={(open) => !open && setDeleteConfirmationId(null)}
                                    title={t('delete')}
                                    description={t('deleteConfirm')}
                                    confirmLabel={t('delete')}
                                    cancelLabel={t('cancel')}
                                    onConfirm={() => handleDeleteConfirm(ep.id)}
                                    variant="destructive"
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-slate-700/50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmationId(ep.id);
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-slate-800 space-y-2 bg-[#0f0f16]">
                <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20 border-0 h-9 font-bold text-xs"
                    onClick={() => setGenModalOpen(true)}
                >
                    <Sparkles size={14} className="mr-2" />{te('createNew')}
                </Button>
            </div>

            <EpisodeGenerationModal
                isOpen={genModalOpen}
                onClose={() => setGenModalOpen(false)}
                projectId={projectId}
                onEpisodeCreated={(episodeId) => {
                    // Fetch episodes to get the new one
                    fetchEpisodes();
                }}
            />
        </div>
    );
}
