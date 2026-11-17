'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, User, FileText, Activity, Users, Tag } from 'lucide-react';
import { RadarChart } from '@/components/ui/radar-chart';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useTranslations } from 'next-intl';

interface Suggestion {
    id: string;
    name: string;
    role?: string;
    theme_color?: string;
    bio?: string;
    personality?: string;
    stats?: Record<string, number>;
    visual_keywords?: string[];
    age?: string;
    personality_tags?: string[];
}

interface SuggestionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestion: Suggestion | null;
    onCast: (suggestion: Suggestion) => void;
}

export default function SuggestionDetailModal({ isOpen, onClose, suggestion, onCast }: SuggestionDetailModalProps) {
    const t = useTranslations('Project.Characters');
    const tc = useTranslations('Modals.CharacterDetail');

    if (!suggestion) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent hideCloseButton className="max-w-4xl p-0 overflow-hidden bg-[#0F0F12] border border-gray-800 text-white sm:rounded-2xl max-h-[90vh] flex flex-col">
                <VisuallyHidden>
                    <DialogTitle>{tc('detail')}</DialogTitle>
                </VisuallyHidden>
                <div className="flex flex-col md:flex-row h-full overflow-hidden">

                    {/* Left: Summary Card */}
                    <div className="w-full md:w-[40%] relative flex flex-col items-center justify-center p-8 bg-[#13111C] border-b md:border-b-0 md:border-r border-gray-800">
                        {/* Background Tint */}
                        <div
                            className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-transparent to-black"
                            style={{ backgroundColor: suggestion.theme_color || '#a855f7' }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center gap-6 w-full max-w-sm">
                            <div
                                className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mb-2 relative group"
                                style={{ backgroundColor: (suggestion.theme_color || '#a855f7') + '20', border: `2px solid ${suggestion.theme_color || '#a855f7'}` }}
                            >
                                <Users size={48} style={{ color: suggestion.theme_color || '#a855f7' }} />
                                <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{suggestion.name}</h2>
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-200">
                                    {suggestion.role || "Role Undefined"}
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm italic line-clamp-4 leading-relaxed max-w-xs">
                                "{suggestion.bio || suggestion.personality}"
                            </p>

                            <Button
                                onClick={() => onCast(suggestion)}
                                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-purple-900/20 bg-purple-600 hover:bg-purple-500 hover:scale-[1.02] transition-all mt-4"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                {t('castConfirm')}
                            </Button>
                        </div>
                    </div>

                    {/* Right: Detailed Info SCROLLABLE */}
                    <div className="w-full md:w-[60%] flex flex-col h-full bg-[#0F0F12] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0F0F12]/80 backdrop-blur-md z-10 sticky top-0 shrink-0">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('suggestionList')}</span>
                                <h3 className="text-lg font-bold text-white leading-tight">{tc('detail')}</h3>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {/* Stats */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={14} className="text-purple-400" /> {tc('stats')}
                                </h4>
                                <div className="bg-[#15151A] rounded-xl p-4 border border-gray-800">
                                    <div className="h-[200px] w-full flex items-center justify-center">
                                        <RadarChart
                                            data={Object.entries(suggestion.stats || {}).map(([key, value]) => ({ label: key, value: value || 0 }))}
                                            size={180}
                                            color={suggestion.theme_color || '#a855f7'}

                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Bio / Personality */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <User size={14} className="text-blue-400" /> {tc('profile')}
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-[#15151A] rounded-xl p-4 border border-gray-800 space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">{tc('personality')}</label>
                                        <p className="text-gray-300 text-sm leading-relaxed">{suggestion.personality}</p>
                                    </div>
                                    {suggestion.bio && (
                                        <div className="bg-[#15151A] rounded-xl p-4 border border-gray-800 space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">{tc('background')}</label>
                                            <p className="text-gray-300 text-sm leading-relaxed">{suggestion.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Visuals */}
                            {suggestion.visual_keywords && suggestion.visual_keywords.length > 0 && (
                                <section>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Sparkles size={14} className="text-yellow-400" /> {tc('visuals')}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestion.visual_keywords.map((tag, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-[#1A1A22] border border-gray-800 text-gray-300 text-xs font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Personality Tags */}
                            {suggestion.personality_tags && suggestion.personality_tags.length > 0 && (
                                <section>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Tag size={14} className="text-green-400" /> {tc('personality')} Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestion.personality_tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-[#1A1A22] border border-gray-800 text-gray-300 text-xs font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Close Button Footer */}
                        <div className="p-4 border-t border-gray-800 bg-[#0F0F12] flex justify-end">
                            <Button variant="ghost" onClick={onClose} className="hover:bg-white/5 text-gray-400 hover:text-white">
                                {tc('close')}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
