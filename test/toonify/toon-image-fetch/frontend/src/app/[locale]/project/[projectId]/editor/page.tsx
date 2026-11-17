'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Link } from '@/navigation';
import { useState, useEffect } from 'react';

import InspectorPanel from '@/components/editor/InspectorPanel';
import StoryboardView from '@/components/editor/StoryboardView';
import { useCanvasStore } from '@/store/useCanvasStore';
import api from '@/lib/api';
import { ArrowLeft, Save, Download, Cloud, Layers, Users, Image as ImageIcon, Settings, Loader2, Smartphone, Clapperboard, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

export default function EditorPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params?.projectId as string;

    const [activeSegment, setActiveSegment] = useState('storyboard'); // script, storyboard (kept for reference if needed, though hidden)
    const { activeEpisodeId, setActiveEpisode, setReviewMode } = useCanvasStore();
    const [exporting, setExporting] = useState(false);
    const { toast } = useToast();
    const t = useTranslations('Project.Editor');

    const [projectTitle, setProjectTitle] = useState('');
    const [episodeTitle, setEpisodeTitle] = useState('');
    const [episodeOrder, setEpisodeOrder] = useState<number | null>(null);
    
    // Mobile view toggle
    const [mobileActiveView, setMobileActiveView] = useState<'storyboard' | 'inspector'>('storyboard');

    // URL-derived Episode ID (Primary Source of Truth)
    const epIdFromUrl = searchParams?.get('episode_id');

    // Load episode from query param if present, or clear if missing
    useEffect(() => {
        if (epIdFromUrl) {
            setActiveEpisode(epIdFromUrl);
        } else {
            setActiveEpisode(null);
        }
    }, [epIdFromUrl, setActiveEpisode]);

    // Clear active episode on unmount
    useEffect(() => {
        return () => {
            setActiveEpisode(null);
        };
    }, [setActiveEpisode]);

    // Fetch Project Details
    useEffect(() => {
        if (!projectId) return;
        api.get(`/projects/${projectId}`).then(res => {
            setProjectTitle(res.data.title);
        }).catch(err => console.error("Failed to fetch project", err));
    }, [projectId]);

    // Fetch Episode Details
    useEffect(() => {
        if (!activeEpisodeId) {
            setEpisodeTitle('');
            setEpisodeOrder(null);
            return;
        }
        api.get(`/episodes/${activeEpisodeId}`).then(res => {
            setEpisodeTitle(res.data.title);
            setEpisodeOrder(res.data.episode_order);
        }).catch(err => console.error("Failed to fetch episode", err));
    }, [activeEpisodeId]);

    const handleExport = async () => {
        if (!activeEpisodeId) {
            toast({
                title: t('noEpisodeSelected'),
                description: t('selectEpisodeToExport'),
                variant: 'destructive',
            });
            return;
        }
        try {
            setExporting(true);
            toast({ title: t('toasts.exporting'), description: t('toasts.exportPreparing') });
            
            const response = await api.post(`/episodes/${activeEpisodeId}/export?format=zip`, {}, {
                responseType: 'blob'
            });

            const missingCuts = response.headers['x-missing-cuts'];
            if (missingCuts) {
                toast({ title: t('toasts.missingCuts', { cuts: String(missingCuts) }), variant: 'destructive' });
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Try to extract filename from header
            const contentDisposition = response.headers['content-disposition'];
            let filename = `episode_export.zip`;
            if (contentDisposition) {
                // Check for standard filename
                const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    filename = fileNameMatch[1];
                }

                // Check for UTF-8 encoded filename (overrides standard)
                const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
                if (utf8Match && utf8Match.length === 2) {
                    filename = decodeURIComponent(utf8Match[1]);
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (err: any) {
            console.error("Export failed", err);

            let errorMessage = t('toasts.exportDownloadFailed');
            if (err.response && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
                // Try to read the blob error if Axios caught it as a Blob
                try {
                    const text = await err.response.data.text();
                    const errorObj = JSON.parse(text);
                    if (errorObj.detail) errorMessage = errorObj.detail;
                } catch (e) { /* ignore */ }
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast({ title: t('toasts.exportFailed'), description: errorMessage, variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#05050a] text-slate-200 overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Top Bar */}
            <header className="h-14 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 bg-[#0f0f16] shrink-0">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <Link href={`/project/${projectId}`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800/80 -ml-2 px-2 md:px-3">
                            <ArrowLeft size={18} className="md:mr-2" />
                            <span className="hidden md:inline">{t('back')}</span>
                        </Button>
                    </Link>
                    <div className="hidden md:block h-4 w-[1px] bg-slate-800 mx-2"></div>

                    <div className="flex items-center gap-2 text-sm min-w-0">
                        <span className="font-bold text-slate-200 truncate max-w-[80px] md:max-w-none">{projectTitle}</span>
                        <span className="text-slate-600 hidden sm:inline">/</span>
                        <span className="font-medium text-slate-300 truncate max-w-[60px] md:max-w-none hidden sm:inline">{episodeTitle || t('title')}</span>
                        {episodeOrder !== null && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                                #{episodeOrder}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewMode(true)}
                        className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 px-2 md:px-3"
                    >
                        <Smartphone size={16} className="md:mr-2" />
                        <span className="hidden md:inline">{t('review')}</span>
                    </Button>

                    <Button
                        className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 px-2 md:px-3"
                        size="sm"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download size={16} className="md:mr-2" />
                        )}
                        <span className="hidden md:inline">{t('export')}</span>
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden flex pb-14 md:pb-0">
                {/* Left Sidebar: Navigation (Fixed Icon Bar) - Hidden on mobile */}
                <aside className="hidden md:flex w-16 bg-[#0a0a10] border-r border-slate-800 flex-col items-center py-4 gap-4 z-40">
                    <button className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30 hover:bg-purple-600/30 transition-colors">
                        <Layers size={20} />
                    </button>
                    <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <Users size={20} />
                    </button>
                    <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <ImageIcon size={20} />
                    </button>
                    <div className="flex-1" />
                    <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <Settings size={20} />
                    </button>
                </aside>

                {/* Desktop: Panel Layout */}
                <div className="hidden md:block flex-1 overflow-hidden">
                    <PanelGroup direction="horizontal">
                        {/* Center: Canvas / Editor */}
                        <Panel defaultSize={75} minSize={30}>
                            <div className="h-full flex flex-col bg-[#05050a]">
                                {/* Content Area - Only Storyboard */}
                                <div className="flex-1 overflow-hidden relative">
                                    <StoryboardView
                                        projectId={projectId?.toString() || ''}
                                        episodeId={epIdFromUrl || activeEpisodeId || ''}
                                    />
                                </div>
                            </div>
                        </Panel>

                        <PanelResizeHandle className="w-[1px] bg-slate-800 hover:bg-purple-500 transition-colors" />

                        {/* Right Sidebar: Inspector */}
                        <Panel defaultSize={25} minSize={15} maxSize={30} className="bg-[#0f0f16] border-l border-slate-800">
                            <InspectorPanel episodeId={epIdFromUrl || activeEpisodeId || ''} />
                        </Panel>
                    </PanelGroup>
                </div>

                {/* Mobile: Tab-based Layout */}
                <div className="md:hidden flex-1 overflow-hidden">
                    {mobileActiveView === 'storyboard' ? (
                        <StoryboardView 
                            projectId={projectId?.toString() || ''} 
                            episodeId={epIdFromUrl || activeEpisodeId || ''} 
                        />
                    ) : (
                        <div className="h-full overflow-y-auto">
                            <InspectorPanel episodeId={epIdFromUrl || activeEpisodeId || ''} />
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Tab Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0f0f16] border-t border-slate-800 flex z-50">
                <button
                    onClick={() => setMobileActiveView('storyboard')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                        mobileActiveView === 'storyboard'
                            ? 'text-purple-400 bg-purple-500/10'
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Clapperboard size={20} />
                    <span className="text-[10px] font-medium">{t('storyboard') || 'Storyboard'}</span>
                </button>
                <button
                    onClick={() => setMobileActiveView('inspector')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                        mobileActiveView === 'inspector'
                            ? 'text-purple-400 bg-purple-500/10'
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <SlidersHorizontal size={20} />
                    <span className="text-[10px] font-medium">{t('inspector') || 'Inspector'}</span>
                </button>
            </div>
        </div>
    );
}
