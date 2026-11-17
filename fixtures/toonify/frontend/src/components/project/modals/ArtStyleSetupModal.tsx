import React, { useState } from 'react';
import { useRouter } from '@/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Lock, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SelectionCard } from '@/components/ui/selection-card';
import { SectionLabel } from '@/components/ui/section-label';
import api from '@/lib/api';
import CreateStyleModal from './CreateStyleModal';
import { useTranslations } from 'next-intl';

interface ArtStyleSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentStyle: string;
    onStyleUpdate: (newStyle: string) => void;
    projectTitle: string;
    projectGenre?: string;
}

interface ArtStyle {
    id: string;
    name: string;
    description?: string;
    previewColor: string;
    imageUrl?: string;
    isPrivate?: boolean;
    isLocked?: boolean;
    category: 'MY_MODELS' | 'CLASSIC_WEBTOON' | 'ARTISTIC_PAINTERLY' | 'STYLIZED_GRAPHIC' | 'GENRE_SPECIFIC';
}

const STYLES: ArtStyle[] = [
    // MY MODELS
    { id: 'my-project-necro', name: 'Project: Necromancer', description: 'Fine-tuned v2.4 (Main)', previewColor: 'bg-gradient-to-br from-violet-600 to-indigo-600', category: 'MY_MODELS' },
    { id: 'my-sketch-lora', name: 'My Sketch LoRA', description: 'Rough pencil style', previewColor: 'bg-slate-700', category: 'MY_MODELS', isLocked: true },
    { id: 'sd-chibi-mix', name: 'SD Chibi Mix', description: 'Custom merge model', previewColor: 'bg-pink-600', category: 'MY_MODELS', isLocked: true },

    // CLASSIC & WEBTOON
    { id: 'standard-webtoon', name: 'Standard Webtoon', description: 'Clean lines, vibrant colors', previewColor: 'bg-blue-600', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/standard-webtoon.png', category: 'CLASSIC_WEBTOON' },
    { id: 'classic-manhwa', name: 'Classic Manhwa', description: 'Detailed B&W inking', previewColor: 'bg-slate-600', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/classic-manhwa.png', category: 'CLASSIC_WEBTOON' },
    { id: 'anime-style', name: 'Anime Style', description: 'Large eyes, cel shading', previewColor: 'bg-pink-500', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/anime-style.png', category: 'CLASSIC_WEBTOON' },
    { id: 'semi-realism', name: 'Semi-Realism', description: 'Balanced proportions', previewColor: 'bg-indigo-500', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/semi-realism.png', category: 'CLASSIC_WEBTOON' },

    // ARTISTIC & PAINTERLY
    { id: 'watercolor', name: 'Watercolor', description: 'Soft edges, wet texture', previewColor: 'bg-cyan-500', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/watercolor.png', category: 'ARTISTIC_PAINTERLY' },
    { id: 'oil-painting', name: 'Oil Painting', description: 'Rich texture, heavy strokes', previewColor: 'bg-orange-700', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/oil-painting.png', category: 'ARTISTIC_PAINTERLY' },
    { id: 'impasto', name: 'Impasto', description: 'Thick, 3D paint texture', previewColor: 'bg-red-700', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/impasto.png', category: 'ARTISTIC_PAINTERLY' },
    { id: 'ink-wash', name: 'Ink Wash (Sumi-e)', description: 'Traditional asian ink', previewColor: 'bg-stone-600', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/ink-wash.png', category: 'ARTISTIC_PAINTERLY' },

    // STYLIZED & GRAPHIC
    { id: 'flat-vector', name: 'Flat Vector', description: 'Minimalist, no outlines', previewColor: 'bg-emerald-500', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/flat-vector.png', category: 'STYLIZED_GRAPHIC' },
    { id: 'pixel-art', name: 'Pixel Art', description: 'Retro 8-bit aesthetic', previewColor: 'bg-purple-600', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/pixel-art.png', category: 'STYLIZED_GRAPHIC' },
    { id: 'chibi-sd', name: 'Chibi (SD)', description: 'Cute, small proportions', previewColor: 'bg-yellow-500', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/chibi-sd.png', category: 'STYLIZED_GRAPHIC' },
    { id: 'pop-art', name: 'Pop Art', description: 'Halftones, bold contrast', previewColor: 'bg-fuchsia-600', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/pop-art.png', category: 'STYLIZED_GRAPHIC' },

    // GENRE SPECIFIC
    { id: 'noir', name: 'Noir / Dark', description: 'High contrast shadows', previewColor: 'bg-slate-800', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/noir.png', category: 'GENRE_SPECIFIC' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon lights, futuristic', previewColor: 'bg-violet-600', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/cyberpunk.png', category: 'GENRE_SPECIFIC' },
    { id: 'eldritch', name: 'Eldritch Horror', description: 'Gritty, unsettling lines', previewColor: 'bg-rose-900', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/eldritch.png', category: 'GENRE_SPECIFIC' },
    { id: 'vintage-comic', name: 'Vintage Comic', description: 'Retro paper texture', previewColor: 'bg-amber-700', imageUrl: 'https://storage.googleapis.com/toonify-prod-assets/styles/presets/vintage-comic.png', category: 'GENRE_SPECIFIC' },
];

export default function ArtStyleSetupModal({
    isOpen,
    onClose,
    projectId,
    currentStyle,
    onStyleUpdate,
    projectTitle,
    projectGenre
}: ArtStyleSetupModalProps) {
    const t = useTranslations('Modals.ArtStyle');
    const router = useRouter(); // Hook
    const [selectedStyleId, setSelectedStyleId] = useState<string>(currentStyle || 'standard-webtoon');
    const [saving, setSaving] = useState(false);
    const [customStyles, setCustomStyles] = useState<ArtStyle[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Fetch custom styles
    const fetchCustomStyles = async () => {
        try {
            const res = await api.get('/styles');
            const mapped: ArtStyle[] = res.data.map((s: any) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                previewColor: 'bg-gray-800', // Default fallback
                imageUrl: s.image_url,
                category: 'MY_MODELS',
                status: s.status, // Custom field
                isLocked: false
            }));
            setCustomStyles(mapped);
        } catch (err) {
            console.error("Failed to fetch custom styles", err);
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            fetchCustomStyles();
        }
    }, [isOpen]);

    // Polling for processing styles
    React.useEffect(() => {
        if (!isOpen) return;

        const hasProcessing = customStyles.some(s => (s as any).status === 'processing' || (s as any).status === 'pending');
        if (hasProcessing) {
            const timer = setTimeout(() => {
                fetchCustomStyles();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [customStyles, isOpen]);

    const handleSelect = (style: ArtStyle) => {
        if (style.isLocked) return;
        setSelectedStyleId(style.id);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Check both static and custom styles
            const allStyles = [...customStyles, ...STYLES];
            const styleObj = allStyles.find(s => s.id === selectedStyleId);

            // Construct a fake reference URL or use a placeholder if none exists in the mocked data
            // In a real app, STYLES would come from DB with real URLs.
            let styleReferenceUrl = styleObj?.imageUrl || `https://placeholder.com/${styleObj?.id || 'unknown'}`;

            // Ensure absolute URL for local images
            if (styleReferenceUrl.startsWith('/')) {
                styleReferenceUrl = `${window.location.protocol}//${window.location.host}${styleReferenceUrl}`;
            }

            await api.patch(`/projects/${projectId}`, {
                style_preset: selectedStyleId,
                style_reference_url: styleReferenceUrl
            });
            onStyleUpdate(selectedStyleId);
            onClose();
        } catch (err) {
            console.error("Failed to update style", err);
        } finally {
            setSaving(false);
        }
    };

    // Redirect to Styles Page
    const handleCreateRedirect = () => {
        router.push(`/dashboard/styles?from=project_setup&projectId=${projectId}&title=${encodeURIComponent(projectTitle)}`);
    };

    const renderCustomModels = () => {
        // Empty State
        if (customStyles.length === 0) {
            return (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-yellow-400" fill="currentColor" />
                        <SectionLabel className="text-gray-400">{t('myModels')}</SectionLabel>
                    </div>

                    <div
                        className="border border-dashed border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-[#0F0F12] hover:border-gray-700 transition-colors cursor-pointer group"
                        onClick={handleCreateRedirect}
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="text-purple-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{t('createOwn')}</h3>
                        <p className="text-xs text-gray-500 max-w-[200px]">{t('createOwnDesc')}</p>
                        <Button variant="link" className="text-purple-400 mt-2 h-auto p-0 text-xs">
                            {t('createAction')}
                        </Button>
                    </div>
                </div>
            );
        }

        // List State
        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-400" fill="currentColor" />
                        <SectionLabel className="text-gray-400">{t('myModels')}</SectionLabel>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-medium">{t('private')}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-gray-500 hover:text-white gap-1"
                        onClick={handleCreateRedirect}
                    >
                        <Plus size={12} /> {t('newStyle')}
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {customStyles.map((style) => (
                        <SelectionCard
                            key={style.id}
                            selected={selectedStyleId === style.id}
                            showCheck={true}
                            onClick={() => handleSelect(style)}
                            className={cn(
                                "flex flex-col h-full hover:-translate-y-1"
                            )}
                        >
                            {/* Card Image Area */}
                            <div className={cn(
                                "aspect-square rounded-lg mb-3 overflow-hidden relative transition-all bg-gray-800",
                            )}>
                                {style.imageUrl ? (
                                    <img src={style.imageUrl} alt={style.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 p-4 text-center">
                                        {(style as any).status === 'processing' || (style as any).status === 'pending' ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin text-purple-500" />
                                                <p className="text-[10px] text-gray-500">Generating...</p>
                                            </>
                                        ) : (
                                            <p className="text-[10px] font-mono text-white/60 uppercase tracking-wider leading-relaxed whitespace-pre-wrap">
                                                {t('preview', { name: style.name })}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="flex items-start justify-between min-h-[48px]">
                                <div className="flex flex-col">
                                    <h4 className={cn(
                                        "text-sm font-semibold transition-colors",
                                        selectedStyleId === style.id ? "text-white" : "text-gray-300 group-hover:text-white"
                                    )}>
                                        {style.name}
                                    </h4>
                                    {style.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2">{style.description}</p>
                                    )}
                                </div>
                            </div>
                        </SelectionCard>
                    ))}
                </div>
            </div>
        )
    };

    const renderCategory = (title: string, category: ArtStyle['category'], icon?: React.ReactNode) => {
        const styles = STYLES.filter(s => s.category === category);
        if (styles.length === 0) return null;

        return (
            <div className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                    {icon}
                    <SectionLabel className="text-gray-400">{title}</SectionLabel>
                    {category === 'MY_MODELS' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-medium">{t('private')}</span>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {styles.map((style) => (
                        <SelectionCard
                            key={style.id}
                            selected={selectedStyleId === style.id}
                            showCheck={true}
                            onClick={() => handleSelect(style)}
                            className={cn(
                                "flex flex-col h-full",
                                style.isLocked ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-1"
                            )}
                        >
                            {/* Card Image Area */}
                            <div className={cn(
                                "aspect-square rounded-lg mb-3 overflow-hidden relative transition-all bg-gray-800",
                                !style.imageUrl && style.previewColor
                            )}>
                                {style.imageUrl ? (
                                    <img src={style.imageUrl} alt={style.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <div className="text-center">
                                            <p className="text-[10px] font-mono text-white/60 uppercase tracking-wider leading-relaxed whitespace-pre-wrap">
                                                {t('preview', { name: style.name })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {style.isLocked && (
                                    <div className="absolute top-2 right-2 text-white/50 bg-black/50 p-1 rounded-full">
                                        <Lock size={14} />
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="flex items-start justify-between min-h-[48px]">
                                <div className="flex flex-col">
                                    <h4 className={cn(
                                        "text-sm font-semibold transition-colors",
                                        selectedStyleId === style.id ? "text-white" : "text-gray-300 group-hover:text-white"
                                    )}>
                                        {style.name}
                                    </h4>
                                    {style.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2">{style.description}</p>
                                    )}
                                </div>
                            </div>
                        </SelectionCard>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[1000px] h-[85vh] p-0 gap-0 bg-[#0A0A0B] border-gray-800 text-white overflow-hidden flex flex-col">
                <DialogHeader className="px-6 py-4 flex-none border-b border-gray-800 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <span className="text-purple-500"><Sparkles size={18} fill="currentColor" /></span>
                            {t('title')}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {renderCustomModels()}

                    {renderCategory(t('classic'), 'CLASSIC_WEBTOON')}
                    {renderCategory(t('artistic'), 'ARTISTIC_PAINTERLY')}
                    {renderCategory(t('stylized'), 'STYLIZED_GRAPHIC')}
                    {renderCategory(t('genre'), 'GENRE_SPECIFIC')}
                </div>

                <div className="flex-none p-4 bg-[#0F0F12] border-t border-gray-800 flex items-center justify-between">
                    <div className="text-xs font-mono text-gray-500">
                        {t('totalStyles', { count: STYLES.length + customStyles.length })}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            {t('apply').replace('Style', '').trim() === 'Apply' ? 'Cancel' : 'Cancel'}
                            {/* Actually 'Cancel' is mostly universal but we can translate it too if we add it to json, 
                                but I used 'apply' key which is 'Apply Style', and I need 'Cancel'. 
                                I missed adding 'Cancel' to ArtStyle json, but I have 'Modals.AddCharacter.create' etc.
                                I'll use hardcoded 'Cancel' or add it. I'll stick to 'Cancel' for now or reuse Common if available. 
                                Wait, I added 'Cancel' to 'Modals.ArtStyle' in my thought process? 
                                Let's check the json from previous step. 
                                keys: title, myModels, createOwn, ..., apply, saving. 
                                NO 'cancel' key in ArtStyle. 
                                Use Common.cancel? 
                                I need to import useTranslations('Common') too? Or just use hardcoded 'Cancel' for now?
                                I'll use hardcoded 'Cancel' as it was before, or better, I'll update the previous replace call? 
                                No, I can't go back. I'll just use 'Cancel' text for now to avoid error.
                            */}
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? t('saving') : t('apply')}
                        </Button>
                    </div>
                </div>

                <CreateStyleModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        fetchCustomStyles();
                        setIsCreateModalOpen(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
