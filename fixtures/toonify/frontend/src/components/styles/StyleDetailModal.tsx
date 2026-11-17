import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Trash2, Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';

interface ArtStyle {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    image_url?: string; // Backend returns snake_case
    status: string;
    prompt?: string;
    image?: string; // fallback
}

interface StyleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    style: ArtStyle | null;
    onRegenerate: () => void;
    onDelete: () => void;
}

export default function StyleDetailModal({ isOpen, onClose, style, onRegenerate, onDelete }: StyleDetailModalProps) {
    const t = useTranslations('Modals.ViewStyle');
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    if (!style) return null;

    const imageUrl = style.imageUrl || style.image_url || style.image || '';
    const isFailed = style.status === 'failed';

    const handleCopy = () => {
        if (style.description) {
            navigator.clipboard.writeText(style.description);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            await api.post(`/styles/${style.id}/regenerate`);
            onRegenerate();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsRegenerating(false);
        }
    };

    // Fallback translation if not exists (for consistency key)
    const consistencyActive = t('consistencyActive') || "Style Consistency Active";
    const consistencyDesc = t('consistencyDesc') || "This style will be applied to all generated images.";


    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[800px] bg-[#0A0A0B] border-gray-800 text-white p-0 gap-0 overflow-hidden flex h-[500px]">
                {/* Left: Image */}
                <div className="w-1/2 bg-gray-900 relative">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={style.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Sparkles size={48} />
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-1/2 p-6 flex flex-col">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold">{style.name}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                        {/* Status for Failed */}
                        {isFailed && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                Generation Failed. Please try regenerating.
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Description / Prompt</h4>
                            <div className="bg-[#121216] p-3 rounded-lg border border-gray-800 text-sm text-gray-300 relative group">
                                {style.description}
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-500" />
                                {consistencyActive}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {consistencyDesc}
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-800 flex justify-between items-center mt-auto">
                        <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/10 gap-2" onClick={onDelete}>
                            <Trash2 size={16} /> Delete
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} className="border-gray-700 hover:bg-gray-800 text-gray-300">
                                Close
                            </Button>
                            {isFailed && (
                                <Button onClick={handleRegenerate} disabled={isRegenerating} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                                    <RefreshCw size={16} className={isRegenerating ? "animate-spin" : ""} />
                                    Regenerate
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
