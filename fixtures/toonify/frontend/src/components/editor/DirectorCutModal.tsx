'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StoryCut {
    id: string;
    cut_order: number;
    script: string;
    aspect_ratio: string;
    image_path?: string;
}

interface DirectorCutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cut: StoryCut | null;
    onUpdate: () => void;
}

import { useTranslations } from 'next-intl';

export default function DirectorCutModal({ isOpen, onClose, cut, onUpdate }: DirectorCutModalProps) {
    const [instruction, setInstruction] = useState('');
    const [isModifying, setIsModifying] = useState(false);
    const { toast } = useToast();
    const t = useTranslations('Modals.DirectorCut');

    const handleModify = async () => {
        if (!cut || !cut.image_path || !instruction.trim()) return;

        setIsModifying(true);
        try {
            const res = await api.post('/scenes/modify', {
                original_image_url: cut.image_path,
                instruction: instruction
            });

            const newImageUrl = res.data.image_url;

            // Update the cut with the new image
            await api.put(`/cuts/${cut.id}`, {
                image_path: newImageUrl
            });

            onUpdate();
            onClose();
            setInstruction('');
            toast({
                title: t('success'),
                description: t('successDesc'),
            });
        } catch (err) {
            console.error("Modification Failed", err);
            toast({
                title: t('failed'),
                description: t('failedDesc'),
                variant: "destructive"
            });
        } finally {
            setIsModifying(false);
        }
    };

    if (!cut) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={20} /> {t('title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
                        {cut.image_path ? (
                            <img src={cut.image_path} alt="Current Cut" className="max-h-[300px] object-contain" />
                        ) : (
                            <div className="text-gray-500">{t('noImage')}</div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instruction" className="text-gray-300">{t('instructionLabel')}</Label>
                        <Textarea
                            id="instruction"
                            placeholder={t('placeholder')}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            className="bg-gray-800 border-gray-700 focus:border-purple-500"
                        />
                        <div className="flex gap-2 mt-2">
                            {['night', 'zoom', 'happy'].map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setInstruction(t(`suggestions.${key}` as any))}
                                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 rounded text-gray-400 transition-colors"
                                >
                                    {t(`suggestions.${key}` as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isModifying}>{t('cancel')}</Button>
                    <Button
                        onClick={handleModify}
                        disabled={isModifying || !instruction.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isModifying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('modify')}
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" /> {t('apply')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
