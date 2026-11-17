'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    LayoutGrid, Paintbrush, LayoutTemplate, FolderOpen, Settings,
    Plus, Search, MoreVertical, LogOut, User,
    HelpCircle, ChevronDown, Sparkles, Wand2,
    Zap, Command, Layers, Trash2, Edit3, Copy, Check, Loader2, Image as ImageIcon, ArrowRight
} from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import CreateStyleModal from '@/components/project/modals/CreateStyleModal';
import { cn } from '@/lib/utils';
import ArtStyleSelectionModal from '@/components/styles/ArtStyleSelectionModal';
import StyleDetailModal from '@/components/styles/StyleDetailModal';
import { useTranslations } from 'next-intl';

interface ArtStyle {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    image_url?: string; // Backend returns snake_case
    status: string;
    // adding optional fields to match reference usage if backend doesn't support them yet
    version?: string;
    progress?: number;
    prompt?: string;
    image?: string; // fallback
}

const StyleCard = ({ style, onClick }: { style: ArtStyle, onClick: () => void }) => {
    const [copied, setCopied] = useState(false);

    // Map status 'processing' or 'pending' to reference's 'Generating' behavior.
    // Also consider 'failed' as NOT generating, but needing attention.
    const isGenerating = style.status === 'processing' || style.status === 'pending' || style.status === 'Generating';
    const isFailed = style.status === 'failed';

    // Prioritize imageUrl, fallback to image_url (snake_case from backend), then image
    const imageUrl = style.imageUrl || style.image_url || style.image || '';
    const promptText = style.prompt || style.description || "No prompt provided";
    const version = style.version || "v1.0";

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal open
        if (promptText) {
            navigator.clipboard.writeText(promptText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-[#0f0f16] border rounded-2xl overflow-hidden transition-all duration-500 shadow-lg hover:shadow-purple-900/20 flex flex-col cursor-pointer
      ${isGenerating ? 'border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : isFailed ? 'border-red-500/50 hover:border-red-500' : 'border-slate-800 hover:border-purple-500/50 hover:-translate-y-1.5'}
    `}>
            {/* Image Area */}
            <div className="aspect-video bg-slate-900 relative overflow-hidden">
                {/* Main Image */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={style.name}
                        className={`w-full h-full object-cover transition-all duration-1000 
            ${isGenerating ? 'opacity-0 scale-110 blur-xl' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105 blur-0'}
          `}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        {isGenerating ? null : isFailed ? <Zap className="text-red-500 rotate-12" size={32} /> : <ImageIcon className="text-slate-600" />}
                    </div>
                )}

                {/* Generation Overlay Effects */}
                {isGenerating && (
                    <>
                        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
                            <div className="relative">
                                <CustomLoader size={48} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={16} className="text-purple-400 animate-pulse" />
                                </div>
                            </div>
                            <span className="text-xs font-mono text-purple-300 animate-pulse">Rendering...</span>
                        </div>
                    </>
                )}

                {/* Failed Overlay */}
                {isFailed && !isGenerating && (
                    <div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center gap-2">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest border border-red-500/50 px-2 py-1 rounded bg-black/50 backdrop-blur">
                            Generation Failed
                        </span>
                    </div>
                )}

                {/* Overlay Gradient (Always) */}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-transparent to-transparent ${isGenerating ? 'opacity-0' : 'opacity-80'}`} />
            </div>

            {/* Info Area */}
            <div className="p-5 flex-1 flex flex-col justify-between relative z-10 bg-[#0f0f16] group-hover:bg-[#13131c] transition-colors">
                {isGenerating && style.progress !== undefined && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-800">
                        <div
                            className="h-full bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.8)] transition-all duration-300 ease-out"
                            style={{ width: `${style.progress}%` }}
                        />
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-start">
                        <h3 className={`font-bold text-sm truncate pr-2 leading-tight ${isGenerating ? 'text-purple-300 animate-pulse' : 'text-white'}`}>
                            {style.name}
                        </h3>
                        {!isGenerating && <Sparkles size={14} className="text-yellow-500 shrink-0 mt-0.5" fill="currentColor" />}
                    </div>

                    {isGenerating && (
                        <div className="mt-2.5 w-full flex items-center justify-center text-xs text-purple-400 bg-purple-900/10 p-2.5 rounded-lg border border-purple-500/20 font-mono animate-pulse">
                            Generating Preview...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function ArtStylesContent() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    // Detail Modal State
    const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);

    const [styles, setStyles] = useState<ArtStyle[]>([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations('Styles');

    const searchParams = useSearchParams();
    const router = useRouter();
    const pollingStartTimeRef = React.useRef<number | null>(null);

    const fromProjectSetup = searchParams?.get('from') === 'project_setup';
    const projectId = searchParams?.get('projectId');
    const projectTitle = searchParams?.get('title');

    const fetchStyles = async () => {
        try {
            const res = await api.get('/styles');
            setStyles(res.data);
        } catch (error) {
            console.error("Failed to fetch styles", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStyles();
    }, []);

    // Polling Logic with 2 min timeout
    useEffect(() => {
        const hasProcessing = styles.some(s => s.status === 'processing' || s.status === 'pending');

        if (hasProcessing) {
            if (pollingStartTimeRef.current === null) {
                pollingStartTimeRef.current = Date.now();
            }

            const elapsed = Date.now() - pollingStartTimeRef.current;
            if (elapsed > 120000) { // 2 minutes
                // Timeout: Force specific processing items to failed or just stop polling?
                console.warn("Polling timeout reached (2m). Stopping auto-refresh.");
                pollingStartTimeRef.current = null; // Reset
                return;
            }

            const timer = setTimeout(fetchStyles, 3000);
            return () => clearTimeout(timer);
        } else {
            pollingStartTimeRef.current = null;
        }
    }, [styles]);

    const handleCreateClick = () => {
        setIsCreateModalOpen(true);
    };

    const handleStyleClick = (style: ArtStyle) => {
        setSelectedStyle(style);
    };

    return (
        <>
            <div className="flex-1 min-h-screen bg-[#05050a] text-slate-200 font-sans relative selection:bg-purple-500/30 overflow-x-hidden">
                {/* Background Ambience */}
                <div className="fixed top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-900/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Header */}
                <header className="py-4 md:py-6 pl-16 md:pl-6 lg:pl-10 pr-4 md:pr-6 lg:pr-10 sticky top-0 bg-[#05050a]/80 backdrop-blur-md z-30 border-b border-slate-800/30">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold text-white mb-1 tracking-tight">{t('myStyles')}</h1>
                                <p className="text-slate-400 text-sm">{t('subtitle')}</p>
                                {fromProjectSetup && (
                                    <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg inline-flex items-center gap-2 text-sm text-purple-300">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                        {t('creatingFor')} <span className="font-bold text-white">{projectTitle || "Unknown Project"}</span>
                                    </div>
                                )}
                            </div>

                            {/* View Toggle / Search */}
                            <div className="flex items-center gap-4">
                                {styles.length > 0 && (
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder={t('searchPlaceholder')}
                                            className="bg-slate-900 border border-slate-700/50 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none w-40 md:w-64 transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto pb-20 relative z-10">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[300px]">
                            <CustomLoader size={32} />
                        </div>
                    ) : styles.length > 0 ? (
                        // POPULATED STATE (Grid)
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
                            {/* Create New Trigger Card */}
                            <button
                                onClick={handleCreateClick}
                                className="group relative bg-[#0f0f16] border-2 border-dashed rounded-2xl overflow-hidden border-slate-800 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all flex flex-col cursor-pointer shadow-inner hover:shadow-lg active:scale-95 duration-200"
                            >
                                {/* Image Area - matches StyleCard aspect-video */}
                                <div className="aspect-video bg-slate-900/20 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-purple-600 group-hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                                        <Plus size={32} className="text-slate-400 group-hover:text-white" strokeWidth={3} />
                                    </div>
                                </div>
                                {/* Info Area - matches StyleCard p-5 */}
                                <div className="p-5 flex-1 flex items-center justify-center">
                                    <span className="font-bold text-sm tracking-wide text-slate-500 group-hover:text-purple-300">{t('generateNew')}</span>
                                </div>
                            </button>

                            {/* Style Cards */}
                            {styles.map(style => (
                                <StyleCard
                                    key={style.id}
                                    style={style}
                                    onClick={() => handleStyleClick(style)}
                                />
                            ))}
                        </div>
                    ) : (
                        // EMPTY STATE (Initial)
                        <div className="w-full h-[600px] flex items-center justify-center animate-fade-in">
                            <div className="bg-[#0f0f16] border border-slate-800 rounded-3xl p-12 max-w-2xl w-full text-center relative overflow-hidden shadow-2xl group">
                                {/* Dynamic Background Glow */}
                                <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] group-hover:bg-purple-600/20 transition-colors duration-700" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-slate-700 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                        <ImageIcon size={40} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                    </div>

                                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">{t('generateFirstStyleTitle')}</h2>
                                    <p className="text-slate-400 text-base mb-10 max-w-md leading-relaxed">
                                        {t('generateFirstStyleDesc')}
                                    </p>

                                    <button
                                        onClick={handleCreateClick}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-purple-900/30 hover:shadow-purple-900/50 hover:translate-y-[-2px] transition-all flex items-center gap-2 group/btn active:scale-95"
                                    >
                                        <Zap size={20} fill="currentColor" className="group-hover/btn:animate-pulse" />
                                        {t('startGenerating')}
                                    </button>

                                    <div className="mt-10 flex gap-8 text-xs text-slate-600 font-mono border-t border-slate-800/50 pt-6">
                                        <span className="flex items-center gap-1.5"><Command size={12} /> {t('promptToStyle')}</span>
                                        <span className="flex items-center gap-1.5"><Layers size={12} /> {t('instantPreview')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <CreateStyleModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        fetchStyles();
                        setIsCreateModalOpen(false);
                    }}
                    projectId={projectId}
                />

                <ArtStyleSelectionModal
                    open={isSelectionModalOpen}
                    onOpenChange={setIsSelectionModalOpen}
                />

                <StyleDetailModal
                    isOpen={!!selectedStyle}
                    onClose={() => setSelectedStyle(null)}
                    style={selectedStyle}
                    onRegenerate={() => {
                        fetchStyles();
                        // Poll immediately
                        pollingStartTimeRef.current = Date.now();
                    }}
                    onDelete={() => {
                        // Implement delete if needed, otherwise just close.
                        // Ideally we should have an API call here.
                        // I'll leave it as TODO or simple close for now.
                        setSelectedStyle(null);
                        fetchStyles();
                    }}
                />

                {/* Floating CTA for Return Flow */}
                {fromProjectSetup && (
                    <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                        <Button
                            onClick={() => router.push(`/project/${projectId}?setup=true`)}
                            size="lg"
                            className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_40px_rgba(168,85,247,0.4)] border border-purple-400/50 px-8 h-14 rounded-full font-bold text-lg flex items-center gap-3 transition-transform hover:-translate-y-1"
                        >
                            {t('returnToSetup')} <ArrowRight size={20} />
                        </Button>
                    </div>
                )}
            </div>

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
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #475569;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
              `}</style>
        </>
    );
}

export default function ArtStylesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[300px] h-full">
                <CustomLoader size={32} />
            </div>
        }>
            <ArtStylesContent />
        </Suspense>
    );
}
