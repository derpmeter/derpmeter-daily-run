'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Zap, RotateCw, Wand2, Sliders, PenLine, ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, Clock, Trash2 } from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { sendGAEvent } from '@next/third-parties/google';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface GenerateEpisodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onGenerate: (newEpisode: any) => void;
    nextOrder: number;
    isPrologueMode?: boolean;
}

interface Idea {
    id?: string;
    title: string;
    summary: string;
    reason: string;
    created_at?: string;
}

export default function GenerateEpisodeModal({ isOpen, onClose, projectId, onGenerate, nextOrder, isPrologueMode = false }: GenerateEpisodeModalProps) {
    const t = useTranslations('Modals.GenerateEpisode');
    const [mode, setMode] = useState<'form' | 'generating'>('form');

    const [formData, setFormData] = useState({
        title: '',
        story_summary: '',
        num_cuts: 6
    });

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [userInstruction, setUserInstruction] = useState('');
    const { toast } = useToast();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    // Fetch saved suggestions when modal opens
    useEffect(() => {
        if (isOpen && projectId) {
            fetchSuggestions();
            
            // Set default prologue title and summary when in prologue mode
            if (isPrologueMode) {
                setFormData(prev => ({
                    ...prev,
                    title: t('prologueDefaultTitle'),
                    story_summary: '',
                }));
                setIsDetailsOpen(true);
            }
        }
    }, [isOpen, projectId, isPrologueMode]);

    const fetchSuggestions = async () => {
        try {
            const res = await api.get(`/episodes/suggestions/${projectId}`);
            if (res.data) {
                setIdeas(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch suggestions", e);
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setMode('form');
            setFormData({ title: '', story_summary: '', num_cuts: formData.num_cuts });
            setIsDetailsOpen(false);
        }, 300);
    };

    const handleSuggestIdeas = async () => {
        setLoadingIdeas(true);
        try {
            // Use prologue-specific API when in prologue mode
            const endpoint = isPrologueMode 
                ? '/episodes/generate-prologue-options' 
                : '/episodes/generate-options';
            
            const res = await api.post(endpoint, null, {
                params: {
                    project_id: projectId,
                    user_instruction: userInstruction || undefined
                }
            });
            if (res.data.options) {
                // Refetch all suggestions to get updated list with IDs
                await fetchSuggestions();
                setUserInstruction('');
                sendGAEvent('event', isPrologueMode ? 'generate_prologue_ideas' : 'generate_episode_ideas', {
                    project_id: projectId
                });
            }
        } catch (e) {
            console.error("Failed to get ideas", e);
            toast({
                title: t('failed'),
                description: t('failedDesc'),
                variant: "destructive"
            });
        } finally {
            setLoadingIdeas(false);
        }
    };

    const handleSuggestionClick = (idea: Idea) => {
        setFormData(prev => ({
            ...prev,
            title: idea.title,
            story_summary: idea.summary,
        }));
        setIsDetailsOpen(true);
    };

    const handleDeleteSuggestion = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await api.delete(`/episodes/suggestions/${id}`);
            setIdeas(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error("Failed to delete suggestion", err);
        }
    };

    const handleGenerate = async () => {
        setMode('generating');
        try {
            const response = await api.post('/episodes/generate-cuts', {
                project_id: projectId,
                episode_title: formData.title,
                episode_summary: formData.story_summary,
                num_cuts: formData.num_cuts
            });

            const newEpisode = {
                id: response.data.episode_id,
                title: formData.title,
                story_summary: formData.story_summary,
                episode_order: nextOrder,
                status: 'generating',
                cuts_count: formData.num_cuts,
                thumbnail_url: null,
                created_at: new Date().toISOString()
            };

            onGenerate(newEpisode);
            toast({
                title: t('success'),
                description: t('successDesc', { title: formData.title }),
            });
            sendGAEvent('event', 'create_episode', {
                project_id: projectId,
                method: 'ai_generation',
                num_cuts: formData.num_cuts
            });
            handleClose();
        } catch (error) {
            console.error("Failed to start generation", error);
            setMode('form');
            toast({
                title: t('genFailed'),
                description: t('genFailedDesc'),
                variant: 'destructive',
            });
        }
    };

    const ct = useTranslations('Common.relativeTime');

    // Format relative time
    const formatRelativeTime = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return ct('justNow');
        if (diffMins < 60) return ct('minutesAgo', { count: diffMins });
        if (diffHours < 24) return ct('hoursAgo', { count: diffHours });
        return ct('daysAgo', { count: diffDays });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="bg-[#0f0f16] border border-slate-700/50 p-0 overflow-hidden sm:max-w-[900px] gap-0 text-slate-200">
                <VisuallyHidden>
                    <DialogTitle>
                        {mode === 'generating' ? t('titleGenerating') : (isPrologueMode ? t('prologueTitle') : t('title'))}
                    </DialogTitle>
                </VisuallyHidden>

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-[#0f0f16] z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {mode === 'generating' ? <RotateCw className="animate-spin text-purple-500" /> : <Sparkles className={isPrologueMode ? "text-amber-500" : "text-purple-500"} />}
                            {mode === 'generating' ? t('titleGenerating') : (isPrologueMode ? t('prologueTitle') : t('title'))}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {mode === 'generating' ? t('descGenerating') : (isPrologueMode ? t('prologueDesc') : t('desc'))}
                        </p>
                    </div>
                    {/* Panel Toggle */}
                    <button
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title={isPanelOpen ? t('hideSuggestions') : t('showSuggestions')}
                    >
                        {isPanelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                    </button>
                </div>

                {/* Modal Body - Two Column Layout */}
                <div className="flex">
                    {/* Left Column - Form */}
                    <div className={cn(
                        "p-6 overflow-y-auto max-h-[60vh] custom-scrollbar relative transition-all",
                        isPanelOpen ? "w-3/5" : "w-full"
                    )}>

                        {/* Loading Overlay */}
                        {(mode === 'generating' || loadingIdeas) && (
                            <div className="absolute inset-0 z-20 bg-[#0f0f16]/95 backdrop-blur-sm flex flex-col items-center justify-center">
                                <CustomLoader size={80} />
                                <h3 className="text-xl font-bold text-white mt-6 mb-2">
                                    {loadingIdeas ? t('thinking') : t('thinking')}
                                </h3>
                                <p className="text-slate-400 text-sm animate-pulse">
                                    {loadingIdeas ? t('inspirationDesc') : (t('steps.analyzing') || t('processing'))}
                                </p>
                            </div>
                        )}

                        {/* Form Content */}
                        <div className="space-y-5">

                            {/* 1. Need Inspiration */}
                            <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                        <Wand2 size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{t('needInspiration')}</h4>
                                        <p className="text-xs text-slate-400">{t('inspirationDesc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                            <PenLine size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            value={userInstruction}
                                            onChange={(e) => setUserInstruction(e.target.value)}
                                            placeholder={t('instructionPlaceholder')}
                                            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none placeholder-slate-400 transition-all dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-600"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSuggestIdeas}
                                        disabled={loadingIdeas}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {loadingIdeas ? <RotateCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        {loadingIdeas ? t('thinking') : t('suggestIdeas')}
                                    </button>
                                </div>
                            </div>

                            {/* 2. Number of Cuts */}
                            <div>
                                <label className="text-xs font-mono text-slate-500 mb-1.5 block ml-1 uppercase">{t('cutsLabel')}</label>
                                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                                    <Sliders size={18} className="text-slate-500" />
                                    <input
                                        type="range"
                                        min="4" max="20"
                                        value={formData.num_cuts}
                                        onChange={(e) => setFormData({ ...formData, num_cuts: parseInt(e.target.value) })}
                                        className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center font-mono text-sm text-white">
                                        {formData.num_cuts}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Details Section (Collapsible) */}
                            <div className="border border-slate-800 rounded-xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-slate-500 uppercase">{t('episodeTitleLabel')} / {t('summaryLabel')}</span>
                                        {formData.title && (
                                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                                                {formData.title.length > 20 ? formData.title.substring(0, 20) + '...' : formData.title}
                                            </span>
                                        )}
                                    </div>
                                    {isDetailsOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                </button>

                                {isDetailsOpen && (
                                    <div className="p-4 space-y-4 bg-slate-900/30 animate-fade-in">
                                        <div>
                                            <label className="text-xs font-mono text-slate-500 mb-1.5 block ml-1 uppercase">{t('episodeTitleLabel')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('titlePlaceholder')}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-slate-600"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-mono text-slate-500 mb-1.5 block ml-1 uppercase">{t('summaryLabel')}</label>
                                            <textarea
                                                placeholder={t('summaryPlaceholder')}
                                                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-slate-600 resize-none leading-relaxed text-sm"
                                                value={formData.story_summary}
                                                onChange={(e) => setFormData({ ...formData, story_summary: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Suggestions Panel */}
                    {isPanelOpen && (
                        <div className="w-2/5 border-l border-slate-800 bg-slate-900/30 p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {t('suggestionsTitle')} ({ideas.length})
                                </span>
                            </div>

                            {ideas.length === 0 ? (
                                <div className="text-center py-8 text-slate-600">
                                    <Wand2 size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">{t('noSuggestionsDesc')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {ideas.map((idea) => (
                                        <button
                                            key={idea.id || idea.title}
                                            onClick={() => handleSuggestionClick(idea)}
                                            className={cn(
                                                "w-full text-left p-3 bg-slate-800/50 border rounded-lg hover:border-purple-500/50 hover:bg-purple-900/10 transition-all group relative",
                                                formData.title === idea.title ? "border-purple-500/50 bg-purple-900/10" : "border-slate-700"
                                            )}
                                        >
                                            {/* Timestamp chip */}
                                            <div className="flex items-center gap-1 mb-1.5">
                                                <Clock size={10} className="text-slate-500" />
                                                <span className="text-[10px] text-slate-500">{formatRelativeTime(idea.created_at)}</span>
                                                {formData.title === idea.title && (
                                                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold ml-auto">{t('selected')}</span>
                                                )}
                                            </div>

                                            <h4 className="font-bold text-sm text-slate-200 group-hover:text-white mb-1">{idea.title}</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 line-clamp-2">{idea.summary}</p>

                                            {/* Delete button */}
                                            {idea.id && (
                                                <button
                                                    onClick={(e) => handleDeleteSuggestion(e, idea.id!)}
                                                    className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    title={t('delete')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-800 bg-[#0f0f16] flex justify-end gap-3 z-10">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                        disabled={mode === 'generating'}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={mode === 'generating' || !formData.title}
                        className={`
                          px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all
                          ${mode === 'generating' || !formData.title
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30 hover:shadow-purple-900/50 hover:translate-y-[-1px]'
                            }
                        `}
                    >
                        {mode === 'generating' ? t('generating') : t('startGen')}
                        {mode !== 'generating' && <Zap size={16} fill="currentColor" />}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
