import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X, Lock, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SelectionCard } from '@/components/ui/selection-card';
import { SectionLabel } from '@/components/ui/section-label';

interface ArtStyle {
    id: string;
    name: string;
    description?: string;
    previewColor: string;
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
    { id: 'standard-webtoon', name: 'Standard Webtoon', description: 'Clean lines, vibrant colors', previewColor: 'bg-blue-600', category: 'CLASSIC_WEBTOON' },
    { id: 'classic-manhwa', name: 'Classic Manhwa', description: 'Detailed B&W inking', previewColor: 'bg-slate-600', category: 'CLASSIC_WEBTOON' },
    { id: 'anime-style', name: 'Anime Style', description: 'Large eyes, cel shading', previewColor: 'bg-pink-500', category: 'CLASSIC_WEBTOON' },
    { id: 'semi-realism', name: 'Semi-Realism', description: 'Balanced proportions', previewColor: 'bg-indigo-500', category: 'CLASSIC_WEBTOON' },

    // ARTISTIC & PAINTERLY
    { id: 'watercolor', name: 'Watercolor', description: 'Soft edges, wet texture', previewColor: 'bg-cyan-500', category: 'ARTISTIC_PAINTERLY' },
    { id: 'oil-painting', name: 'Oil Painting', description: 'Rich texture, heavy strokes', previewColor: 'bg-orange-700', category: 'ARTISTIC_PAINTERLY' },
    { id: 'impasto', name: 'Impasto', description: 'Thick, 3D paint texture', previewColor: 'bg-red-700', category: 'ARTISTIC_PAINTERLY' },
    { id: 'ink-wash', name: 'Ink Wash (Sumi-e)', description: 'Traditional asian ink', previewColor: 'bg-stone-600', category: 'ARTISTIC_PAINTERLY' },

    // STYLIZED & GRAPHIC
    { id: 'flat-vector', name: 'Flat Vector', description: 'Minimalist, no outlines', previewColor: 'bg-emerald-500', category: 'STYLIZED_GRAPHIC' },
    { id: 'pixel-art', name: 'Pixel Art', description: 'Retro 8-bit aesthetic', previewColor: 'bg-purple-600', category: 'STYLIZED_GRAPHIC' },
    { id: 'chibi-sd', name: 'Chibi (SD)', description: 'Cute, small proportions', previewColor: 'bg-yellow-500', category: 'STYLIZED_GRAPHIC' },
    { id: 'pop-art', name: 'Pop Art', description: 'Halftones, bold contrast', previewColor: 'bg-fuchsia-600', category: 'STYLIZED_GRAPHIC' },

    // GENRE SPECIFIC
    { id: 'noir', name: 'Noir / Dark', description: 'High contrast shadows', previewColor: 'bg-slate-800', category: 'GENRE_SPECIFIC' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon lights, futuristic', previewColor: 'bg-violet-600', category: 'GENRE_SPECIFIC' },
    { id: 'eldritch', name: 'Eldritch Horror', description: 'Gritty, unsettling lines', previewColor: 'bg-rose-900', category: 'GENRE_SPECIFIC' },
    { id: 'vintage-comic', name: 'Vintage Comic', description: 'Retro paper texture', previewColor: 'bg-amber-700', category: 'GENRE_SPECIFIC' },
];

interface ArtStyleSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (style: ArtStyle) => void;
}

export default function ArtStyleSelectionModal({ open, onOpenChange, onSelect }: ArtStyleSelectionModalProps) {
    const [selectedStyleId, setSelectedStyleId] = useState<string>('my-project-necro');

    const handleSelect = (style: ArtStyle) => {
        if (style.isLocked) return;
        setSelectedStyleId(style.id);
        if (onSelect) onSelect(style);
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
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-medium">Private</span>
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
                                "aspect-square rounded-lg mb-3 overflow-hidden relative transition-all",
                                style.previewColor
                            )}>
                                {style.isLocked && (
                                    <div className="absolute top-2 right-2 text-white/50">
                                        <Lock size={14} />
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                     <div className="text-center">
                                        <p className="text-[10px] font-mono text-white/60 uppercase tracking-wider leading-relaxed">
                                            {style.name}<br/>Preview
                                        </p>
                                     </div>
                                </div>
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1000px] h-[85vh] p-0 gap-0 bg-[#0A0A0B] border-gray-800 text-white overflow-hidden flex flex-col">
                <DialogHeader className="px-6 py-4 flex-none border-b border-gray-800 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <span className="text-purple-500"><Sparkles size={18} fill="currentColor" /></span>
                            Select Art Style
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {renderCategory('My AI Models', 'MY_MODELS', <Sparkles size={14} className="text-yellow-400" fill="currentColor" />)}
                    {renderCategory('Classic & Webtoon', 'CLASSIC_WEBTOON')}
                    {renderCategory('Artistic & Painterly', 'ARTISTIC_PAINTERLY')}
                    {renderCategory('Stylized & Graphic', 'STYLIZED_GRAPHIC')}
                    {renderCategory('Genre Specific', 'GENRE_SPECIFIC')}
                </div>

                <div className="flex-none p-4 bg-[#0F0F12] border-t border-gray-800 flex items-center justify-between">
                    <div className="text-xs font-mono text-gray-500">
                        Total Styles: {STYLES.length}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    >
                        <Plus size={14} className="mr-1.5" />
                        Train New Model
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
