import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import api from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';

interface CreateStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (style: unknown) => void;
    projectId?: string | null;
}

export default function CreateStyleModal({ isOpen, onClose, onCreated, projectId }: CreateStyleModalProps) {
    const t = useTranslations('Modals.CreateStyle');
    const locale = useLocale();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAugmenting, setIsAugmenting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAugment = async () => {
        if (!description.trim()) return;
        setIsAugmenting(true);
        try {
            const res = await api.post('/styles/augment', {
                prompt: description,
                projectId: projectId,
                language: locale
            });
            setDescription(res.data.result);
        } catch (err) {
            console.error(err);
            // Optional: visual error feedback for augmentation
        } finally {
            setIsAugmenting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await api.post('/styles', {
                name,
                description
            });
            onCreated(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            setError(t('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[500px] bg-[#0A0A0B] border-gray-800 text-white">
                <DialogHeader className="border-b border-gray-800 pb-4 mb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <span className="text-purple-500"><Sparkles size={18} fill="currentColor" /></span>
                        {t('title')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300">{t('nameLabel')}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('placeholders.name')}
                            className="bg-[#0F0F12] border-gray-800 text-white focus:ring-purple-500"
                            required
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="description" className="text-gray-300">{t('descLabel')}</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleAugment}
                                disabled={isAugmenting || !description.trim()}
                                className="h-6 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 px-2 gap-1"
                            >
                                <Wand2 size={12} className={isAugmenting ? "animate-spin" : ""} />
                                {isAugmenting ? "Enhancing..." : "AI Enhance"}
                            </Button>
                        </div>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('placeholders.desc')}
                            className="bg-[#0F0F12] border-gray-800 text-white focus:ring-purple-500 min-h-[120px]"
                            required
                        />
                        <p className="text-xs text-gray-500">{t('descHelp')}</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    {t('generating')}
                                </>
                            ) : (
                                t('generate')
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
