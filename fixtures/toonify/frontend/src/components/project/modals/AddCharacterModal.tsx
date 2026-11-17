'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { sendGAEvent } from '@next/third-parties/google';

interface AddCharacterModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onAdd: (newCharacter: any) => void;
}

export default function AddCharacterModal({ isOpen, onClose, projectId, onAdd }: AddCharacterModalProps) {
    const t = useTranslations('Modals.AddCharacter');
    const [formData, setFormData] = useState({
        name: '',
        age: 18,
        gender: '',
        personality: '',
        appearance: '',
        description: '', // used for generation prompt usually
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ideally we also trigger image generation, but for now just create the record.
            const response = await api.post(`/characters`, {
                ...formData,
                project_id: projectId
            });
            onAdd(response.data);
            sendGAEvent('event', 'create_character', {
                project_id: projectId,
                method: 'manual'
            });
            onClose();
        } catch (error) {
            console.error("Failed to add character", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('desc')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="char-name" className="text-right">{t('name')}</Label>
                        <Input id="char-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="char-age" className="text-right">{t('age')}</Label>
                        <Input id="char-age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="char-gender" className="text-right">{t('gender')}</Label>
                        <Input id="char-gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="col-span-3" placeholder={t('genderPlaceholder')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="char-personality" className="text-right">{t('personality')}</Label>
                        <Input id="char-personality" value={formData.personality} onChange={(e) => setFormData({ ...formData, personality: e.target.value })} className="col-span-3" placeholder={t('personalityPlaceholder')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="char-desc" className="text-right">{t('description')}</Label>
                        <Textarea id="char-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="col-span-3" placeholder={t('descPlaceholder')} />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>{loading ? t('creating') : t('create')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
