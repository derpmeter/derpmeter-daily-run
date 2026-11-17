import { X, Smartphone, Check, XCircle, Loader2, Wand2, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface StoryCut {
    id: string;
    cut_order: number;
    script: string;
    image_path?: string;
    dialogues: any[];
}

interface MobileEpisodeViewerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    episodeId: string;
    cuts: StoryCut[];
    onUpdateCut?: (cutId: string, imagePath: string) => void;
    mode?: 'view' | 'review';
}

// Device Types & Configuration
type DeviceType = 'iphone' | 'android' | 'fold' | 'ipad_mini';

const deviceConfig: Record<DeviceType, {
    label: string;
    widthClass: string;
    heightClass: string;
    roundedClass: string;
    bezelColor: string;
    notch: 'notch' | 'hole' | 'dynamic' | 'none'; // added dynamic just in case, keeping simple for now
    homeIndicator: boolean;
    statusBar: boolean;
    frameClass: string;
}> = {
    iphone: {
        label: 'iPhone',
        widthClass: 'max-w-[400px] w-full',
        heightClass: 'h-[85vh]',
        roundedClass: 'rounded-[3.5rem]',
        bezelColor: 'border-gray-900',
        notch: 'notch',
        homeIndicator: true,
        statusBar: true,
        frameClass: 'border-[12px] shadow-[0_0_0_2px_#333,0_0_0_4px_#111,0_20px_50px_-10px_rgba(0,0,0,0.5)]'
    },
    android: {
        label: 'Android',
        widthClass: 'max-w-[400px] w-full',
        heightClass: 'h-[85vh]',
        roundedClass: 'rounded-[2.5rem]',
        bezelColor: 'border-slate-900',
        notch: 'hole',
        homeIndicator: false,
        statusBar: true,
        frameClass: 'border-[10px] shadow-[0_0_0_2px_#333,0_0_0_4px_#111,0_20px_50px_-10px_rgba(0,0,0,0.5)]'
    },
    fold: {
        label: 'Galaxy Fold',
        widthClass: 'max-w-[600px] w-full',
        heightClass: 'h-[80vh]',
        roundedClass: 'rounded-[2rem]',
        bezelColor: 'border-slate-950',
        notch: 'hole',
        homeIndicator: false,
        statusBar: true,
        frameClass: 'border-[12px] shadow-[0_0_0_2px_#333,0_0_0_4px_#111,0_20px_50px_-10px_rgba(0,0,0,0.5)]'
    },
    ipad_mini: {
        label: 'iPad Mini',
        widthClass: 'max-w-[600px] w-full',
        heightClass: 'h-[80vh]',
        roundedClass: 'rounded-[1.5rem]',
        bezelColor: 'border-gray-800',
        notch: 'none',
        homeIndicator: true,
        statusBar: true,
        frameClass: 'border-[16px] shadow-[0_0_0_2px_#333,0_0_0_4px_#111,0_20px_50px_-10px_rgba(0,0,0,0.5)]'
    }
};

export default function MobileEpisodeViewer({ isOpen, onClose, title, episodeId, cuts, onUpdateCut, mode = 'view' }: MobileEpisodeViewerProps) {
    if (!isOpen) return null;

    // Sort cuts by order
    const sortedCuts = [...cuts].sort((a, b) => a.cut_order - b.cut_order);

    const [generatingCuts, setGeneratingCuts] = useState<Record<string, boolean>>({});
    const [reviewStatus, setReviewStatus] = useState<Record<string, 'approved' | 'rejected' | null>>({});
    const [activeDevice, setActiveDevice] = useState<DeviceType>('iphone');
    const t = useTranslations('Project.Editor');

    const config = deviceConfig[activeDevice];

    const handleGenerateImage = async (cutId: string) => {
        setGeneratingCuts(prev => ({ ...prev, [cutId]: true }));
        try {
            const res = await api.post(`/episodes/${episodeId}/cuts/${cutId}/generate-image`);
            if (res.data && onUpdateCut) {
                onUpdateCut(cutId, res.data.image_path);
            }
        } catch (e) {
            console.error("Failed to generate image", e);
        } finally {
            setGeneratingCuts(prev => ({ ...prev, [cutId]: false }));
        }
    };

    const toggleReviewStatus = (cutId: string, status: 'approved' | 'rejected') => {
        setReviewStatus(prev => ({
            ...prev,
            [cutId]: prev[cutId] === status ? null : status
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">

            {/* Device Selector Sidebar */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-gray-900/50 p-4 rounded-2xl backdrop-blur border border-white/10 z-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-2">{t('deviceLabel')}</span>
                {(Object.keys(deviceConfig) as DeviceType[]).map((type) => (
                    <button
                        key={type}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveDevice(type);
                        }}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-xl transition-all border",
                            activeDevice === type
                                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                : "bg-black/40 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
                        )}
                        title={deviceConfig[type].label}
                    >
                        {type === 'iphone' && <Smartphone size={20} />}
                        {type === 'android' && <Smartphone size={20} className="rounded-sm" />}
                        {type === 'fold' && (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <line x1="12" y1="4" x2="12" y2="20" />
                            </svg>
                        )}
                        {type === 'ipad_mini' && <Tablet size={20} />}
                    </button>
                ))}
            </div>

            {/* Render Phone Frame */}
            <div className={cn(
                "relative bg-black flex flex-col overflow-hidden transition-all duration-500 ease-in-out",
                config.widthClass,
                config.heightClass,
                config.roundedClass,
                config.bezelColor,
                config.frameClass
            )}>

                {/* Status Bar */}
                {config.statusBar && (
                    <div className="h-10 bg-black flex items-center justify-between px-6 text-white text-xs select-none z-20 shrink-0">
                        <span className="font-medium tracking-wide">9:41</span>
                        <div className="flex gap-1.5 items-center">
                            <div className="w-4 h-2.5 bg-white rounded-[1px]" />
                            <div className="w-3 h-2.5 bg-white rounded-[1px]" />
                            {!config.notch.includes('hole') && <div className="w-6 h-3 border border-white rounded-[3px] relative flex items-center justify-center"><div className="w-4 h-1.5 bg-white rounded-[1px]" /></div>}
                        </div>
                    </div>
                )}

                {/* Notch / Camera */}
                {config.notch === 'notch' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-[#111] rounded-b-[1.2rem] z-30 pointer-events-none flex items-center justify-center">
                        <div className="w-16 h-4 bg-black/50 rounded-full blur-[1px]"></div>
                    </div>
                )}
                {config.notch === 'hole' && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#111] z-30 pointer-events-none ring-1 ring-white/10" />
                )}

                {/* App Header */}
                <div className="h-14 flex items-center justify-between px-5 bg-[#1a1a1a] z-10 border-b border-white/5 shrink-0">
                    <span className="font-bold text-white truncate max-w-[200px] text-sm">{title}</span>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                        <X size={18} />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white relative">
                    <div className="flex flex-col min-h-full">
                        {/* Title Card */}
                        <div className="aspect-[3/4] flex items-center justify-center bg-gray-50 p-8 text-center border-b border-gray-100">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{title}</h1>
                                <div className="h-1 w-12 bg-black mx-auto mb-3"></div>
                                <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">{t('originalLabel')}</p>
                            </div>
                        </div>

                        {sortedCuts.map((cut) => (
                            <div key={cut.id} className="relative w-full">
                                {cut.image_path ? (
                                    <img
                                        src={cut.image_path}
                                        alt={`Cut ${cut.cut_order}`}
                                        className="w-full h-auto block"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full aspect-square bg-gray-100 flex flex-col items-center justify-center p-6 text-center group border-b border-gray-200">
                                        <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mb-3">
                                            <span className="font-serif font-bold text-gray-300">#{cut.cut_order}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500 max-w-[90%] leading-relaxed font-serif italic">"{cut.script}"</p>

                                        <Button
                                            size="sm"
                                            className="mt-6 gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 bg-black hover:bg-gray-800 text-white shadow-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGenerateImage(cut.id);
                                            }}
                                            disabled={generatingCuts[cut.id]}
                                        >
                                            {generatingCuts[cut.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                            Generate
                                        </Button>
                                    </div>
                                )}

                                {mode === 'review' && (
                                    <div className="absolute top-3 right-3 flex gap-2 z-10 transition-transform hover:scale-105">
                                        <Button
                                            size="icon"
                                            className={cn(
                                                "h-10 w-10 rounded-full shadow-xl transition-all border border-black/5",
                                                reviewStatus[cut.id] === 'approved'
                                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                                    : "bg-white/90 hover:bg-white text-gray-400"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReviewStatus(cut.id, 'approved');
                                            }}
                                        >
                                            <Check size={18} strokeWidth={3} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            className={cn(
                                                "h-10 w-10 rounded-full shadow-xl transition-all border border-black/5",
                                                reviewStatus[cut.id] === 'rejected'
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-white/90 hover:bg-white text-gray-400"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReviewStatus(cut.id, 'rejected');
                                            }}
                                        >
                                            <XCircle size={18} strokeWidth={2.5} />
                                        </Button>
                                    </div>
                                )}

                                {mode === 'review' && reviewStatus[cut.id] === 'rejected' && (
                                    <div className="absolute inset-0 bg-red-500/10 pointer-events-none border-4 border-red-500 z-0" />
                                )}
                                {mode === 'review' && reviewStatus[cut.id] === 'approved' && (
                                    <div className="absolute inset-0 border-4 border-green-500/50 pointer-events-none z-0" />
                                )}
                            </div>
                        ))}

                        {/* Footer / End Card */}
                        <div className="py-24 bg-white text-center space-y-6">
                            <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-sm">To Be Continued</p>
                            <div className="flex justify-center gap-3 opacity-30">
                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Home Indicator (iOS only) */}
                {config.homeIndicator && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/80 rounded-full pointer-events-none z-30" />
                )}
            </div>

            {/* Click outside closer background interaction */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
