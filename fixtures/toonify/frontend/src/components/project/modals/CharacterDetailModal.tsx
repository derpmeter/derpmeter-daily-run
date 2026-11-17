'use client';
import { useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Sparkles, User, Tag, FileText, Activity, Trash2 } from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import { RadarChart } from '@/components/ui/radar-chart'; // New Import
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

// Redefine interface locally to match ProjectHome structure
interface Character {
    id?: string;
    name: string;
    description?: string;
    profile_image_url?: string;
    default_mood?: string | string[];
    sheet_status?: 'pending' | 'processing' | 'completed' | 'failed';
    appearance_tags?: string[];
    profile?: { // Made optional to match usage
        age?: string;
        personality?: string;
        pros?: string[];
        cons?: string[];
        background?: string;
        features?: string[];
        bio?: {
            origin?: string;
            goals?: string;
            quirk?: string;
        } | string;
        stats?: Record<string, number>;
    };
}

interface CharacterDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    character: Character | null;
    onRetry?: (characterId: string) => void;
    onDelete?: (characterId: string) => void;
}

import { useTranslations } from 'next-intl';

export default function CharacterDetailModal({ isOpen, onClose, character, onRetry, onDelete }: CharacterDetailModalProps) {
    const t = useTranslations('Modals.CharacterDetail');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const handleRemove = () => {
        setIsDeleteConfirmOpen(true);
    };

    const handleActualDelete = async () => {
        if (!character?.id) return;

        try {
            await api.delete(`/characters/${character.id}`);
            if (onDelete) onDelete(character.id);
            onClose();
        } catch (e) {
            console.error("Failed to delete character", e);
        }
    };

    if (!character) return null;

    const isGenerating = character.sheet_status === 'pending' || character.sheet_status === 'processing';
    const isFailed = character.sheet_status === 'failed';

    const moodDisplay = Array.isArray(character.default_mood)
        ? character.default_mood.join(", ")
        : (character.default_mood || "Neutral");

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent hideCloseButton className="max-w-5xl p-0 overflow-hidden bg-[#0F0F12] border border-gray-800 text-white sm:rounded-2xl max-h-[90vh] flex flex-col">
                <VisuallyHidden>
                    <DialogTitle>{character.name}</DialogTitle>
                </VisuallyHidden>
                <div className="flex flex-col md:flex-row h-full overflow-hidden">

                    {/* Left: Image / Status Area */}
                    <div className="w-full md:w-[45%] relative bg-black/40 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-800 overflow-hidden bg-[#13111C]">
                        {character.profile_image_url && !isGenerating ? (
                            <img
                                src={character.profile_image_url}
                                alt={character.name}
                                className="w-full h-auto max-h-[85vh] object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 p-8 text-center relative z-10 w-full min-h-[400px] justify-center">
                                {isGenerating ? (
                                    <>
                                        <CustomLoader size={64} />
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-xl font-bold text-white animate-pulse">{t('designing', { name: character.name })}</h3>
                                            <p className="text-sm text-gray-400">{t('designingDesc')}</p>
                                        </div>
                                    </>
                                ) : isFailed ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-2">
                                            <X size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{t('failed')}</h3>
                                        <p className="text-sm text-gray-400 max-w-xs mb-4">{t('failedDesc')}</p>
                                        {onRetry && (
                                            <Button
                                                onClick={() => onRetry(character.id!)}
                                                className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/20"
                                            >
                                                <Sparkles size={16} className="mr-2" /> {t('retry')}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    // Fallback for no image but not generating (shouldn't happen often)
                                    <div className="text-6xl font-bold text-white/10 select-none">
                                        {character.name[0]}
                                    </div>
                                )}
                                {/* Overlay Gradient for readability if needed (only for placeholder) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#13111C] via-transparent to-transparent opacity-60 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="w-full md:w-[55%] flex flex-col bg-[#0F0F12] h-full md:h-auto overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex items-start justify-between bg-white/[0.01]">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
                                    {character.name}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                                        isGenerating
                                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse"
                                            : isFailed
                                                ? "bg-red-500/20 text-red-300 border-red-500/30"
                                                : "bg-green-500/20 text-green-300 border-green-500/30"
                                    )}>
                                        {isGenerating ? t('processing') : isFailed ? t('error') : t('ready')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 -mr-2 -mt-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemove}
                                    className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                                    title={t('delete')}
                                >
                                    <Trash2 size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">

                            {/* Description / Background (Moved to Top) */}
                            {(character.profile?.bio || character.profile?.background || character.description) && (
                                <section>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText size={12} /> {t('bio')}
                                    </h4>
                                    {(() => {
                                        const bioContent = character.profile?.bio || character.profile?.background || character.description;

                                        if (!bioContent) return null;

                                        if (typeof bioContent === 'object') {
                                            return (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {Object.entries(bioContent).map(([key, value]) => {
                                                        if (!value) return null;
                                                        // Map keys to colors
                                                        const colorClass =
                                                            key === 'origin' ? 'text-blue-400' :
                                                                key === 'goals' ? 'text-purple-400' :
                                                                    key === 'quirk' ? 'text-yellow-500' : 'text-gray-400';

                                                        return (
                                                            <div key={key} className="bg-[#15151A] border border-gray-800 rounded-xl p-4">
                                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 block", colorClass)}>
                                                                    {key}
                                                                </span>
                                                                <p className="text-sm text-gray-300 leading-relaxed capitalize">{value}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }

                                        // It's a string, try to parse it
                                        const parseRawBio = (text: string) => {
                                            // Keys to look for. Order matters for split? 
                                            // We'll use a regex to find all "Key:" patterns
                                            const keyPattern = /(?:^|\.\s+|,\s+)(Age|Role|Personality|Visuals|Lore|Origin|Goals|Quirk|Background|History):\s*/gi;

                                            // Split logic is tricky with regex split.
                                            // Let's match all keys and their indices
                                            const matches = Array.from(text.matchAll(keyPattern));

                                            if (matches.length === 0) {
                                                // No structure found, return as single "Background"
                                                return { Background: text };
                                            }

                                            const result: Record<string, string> = {};

                                            matches.forEach((match, index) => {
                                                const key = match[1]; // e.g. "Age"
                                                const start = match.index! + match[0].length;
                                                const end = matches[index + 1] ? matches[index + 1].index! : text.length;
                                                let value = text.slice(start, end).trim();

                                                // Remove trailing dots or commas if they are clearly separators
                                                if (value.endsWith('.') || value.endsWith(',')) {
                                                    value = value.slice(0, -1);
                                                }

                                                // Capitalize Key
                                                const capKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
                                                result[capKey] = value;
                                            });

                                            return result;
                                        };

                                        const parsed = parseRawBio(bioContent);

                                        return (
                                            <div className="grid grid-cols-1 gap-3">
                                                {Object.entries(parsed).map(([key, value]) => {
                                                    // Skipping fields that are already displayed prominently elsewhere
                                                    // "Age" -> Already in header
                                                    // "Visuals" -> Already in tags
                                                    // "Personality" -> Already in Mood?
                                                    // User asked to "split and show like profile". Showing them all is safer for now.

                                                    const colorClass =
                                                        key === 'Lore' || key === 'Background' || key === 'History' ? 'text-indigo-400' :
                                                            key === 'Role' ? 'text-pink-400' :
                                                                key === 'Quirk' ? 'text-yellow-500' :
                                                                    key === 'Goals' ? 'text-purple-400' :
                                                                        key === 'Origin' ? 'text-blue-400' : 'text-gray-500';

                                                    return (
                                                        <div key={key} className="bg-[#15151A] border border-gray-800 rounded-xl p-4 transition-all hover:bg-[#1A1A20]">
                                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-2 block flex items-center gap-2", colorClass)}>
                                                                {key}
                                                            </span>
                                                            <p className="text-sm text-gray-300 leading-relaxed font-sans">{value}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </section>
                            )}

                            {/* Moods / Personality */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles size={12} /> {t('mood')}
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {character.profile?.personality && (
                                        <p className="text-sm text-gray-300 italic">
                                            "{character.profile.personality}"
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {moodDisplay.split(", ").map((mood, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                                                {mood}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Stats Radar Chart */}
                            {character.profile?.stats && (
                                <section>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Activity size={12} /> {t('stats')}
                                    </h4>
                                    <div className="bg-[#15151A] border border-gray-800 rounded-xl p-4 flex justify-center">
                                        <RadarChart
                                            data={Object.entries(character.profile.stats).map(([k, v]) => ({ label: k, value: v }))}
                                            size={200}
                                            color="#a855f7"
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Strengths & Weaknesses */}
                            {(character.profile?.pros || character.profile?.cons) && (
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {character.profile?.pros && (
                                        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">{t('strengths')}</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                                {character.profile.pros.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {character.profile?.cons && (
                                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">{t('weaknesses')}</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                                {character.profile.cons.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Appearance Tags */}
                            {(character.appearance_tags && character.appearance_tags.length > 0) && (
                                <section>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Tag size={12} /> {t('visuals')}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {character.appearance_tags.map((tag, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400 text-xs text-center">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-800 bg-white/[0.01] flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose} className="hover:bg-white/5 text-gray-400 hover:text-white">
                                {t('close')}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>

            <ConfirmationDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title={t('delete')}
                description={t('deleteConfirm')}
                confirmLabel={t('delete')}
                cancelLabel={t('close')}
                onConfirm={handleActualDelete}
                variant="destructive"
            />
        </Dialog>
    );
}
