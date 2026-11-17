import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Palette, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ViewStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    styleName: string;
    styleImageUrl?: string;
    description?: string;
}

export default function ViewStyleModal({
    isOpen,
    onClose,
    styleName,
    styleImageUrl,
    description
}: ViewStyleModalProps) {
    const t = useTranslations('Modals.ViewStyle');
    // Helper to get formatted name
    const formattedName = styleName ? styleName.replace(/_/g, ' ').replace(/-/g, ' ') : 'Unknown Style';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[500px] p-0 gap-0 bg-[#0A0A0B] border-gray-800 text-white overflow-hidden flex flex-col">
                <DialogHeader className="px-6 py-4 flex-none border-b border-gray-800 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <span className="text-purple-500"><Palette size={18} fill="currentColor" /></span>
                            {t('title')}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto">
                    <div className="relative group rounded-xl overflow-hidden aspect-square border-2 border-primary/50 shadow-[0_0_30px_rgba(142,68,173,0.3)] mb-6">
                        {styleImageUrl && !styleImageUrl.includes('placeholder.com') ? (
                             <img 
                                src={styleImageUrl} 
                                alt={formattedName} 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                            />
                        ) : (
                            <div className={cn(
                                "w-full h-full flex flex-col items-center justify-center gap-3",
                                // Generate a deterministic color based on name if no image
                                "bg-gradient-to-br from-indigo-900 via-purple-900 to-black"
                            )}>
                                <Sparkles className="text-white/20 w-16 h-16" />
                                <span className="text-white/40 font-mono text-sm uppercase tracking-wider">{formattedName}</span>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                            <h3 className="text-2xl font-bold text-white capitalize shadow-black drop-shadow-md">
                                {formattedName}
                            </h3>
                            {description && (
                                <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 p-4 rounded-lg bg-[#0F0F12] border border-gray-800">
                        <Info className="shrink-0 text-blue-400 mt-0.5" size={16} />
                        <div className="text-xs text-gray-400 leading-relaxed">
                            <span className="text-gray-200 font-semibold block mb-1">{t('consistencyActive')}</span>
                            {t('consistencyDesc')}
                        </div>
                    </div>
                </div>

                <div className="flex-none p-4 bg-[#0F0F12] border-t border-gray-800 flex justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        {t('close')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
