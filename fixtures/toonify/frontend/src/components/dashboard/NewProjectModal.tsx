'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from '@/navigation';
import { sendGAEvent } from '@next/third-parties/google';
import api from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewProjectModalProps {
    onProjectCreated: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: {
        style_preset?: string;
    };
}

import { useTranslations } from 'next-intl';

export default function NewProjectModal({ onProjectCreated, open, onOpenChange, initialValues }: NewProjectModalProps) {
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
    const router = useRouter();
    const t = useTranslations('Modals.NewProject');

    const [error, setError] = useState('');
    const [genres, setGenres] = useState<any[]>([]);
    const [loadingGenres, setLoadingGenres] = useState(false);

    useEffect(() => {
        if (open) {
            fetchGenres();
        }
    }, [open]);

    const fetchGenres = async () => {
        setLoadingGenres(true);
        try {
            const res = await api.get('/genres');
            setGenres(res.data);
        } catch (err) {
            console.error("Failed to fetch genres", err);
        } finally {
            setLoadingGenres(false);
        }
    };

    const onSubmit = async (data: any) => {
        setError('');
        try {
            await api.post('/projects', {
                title: data.title,
                genre_ids: data.genre_id ? [data.genre_id] : [], // Convert single ID to array
                style_preset: initialValues?.style_preset || 'anime_webtoon'
            });
            onOpenChange(false);
            reset();
            onProjectCreated();
            sendGAEvent('event', 'create_project', {
                genre_id: data.genre_id,
                style_preset: initialValues?.style_preset || 'anime_webtoon'
            });
        } catch (err) {
            console.error(err);
            setError(t('error'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('desc')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="title">{t('titleLabel')}</Label>
                        <Input id="title" {...register('title', { required: true })} placeholder={t('placeholder')} />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="genre">{t('genreLabel')}</Label>
                        <select
                            id="genre"
                            {...register('genre_id', { required: true })}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">{t('selectGenre')}</option>
                            {genres.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-900/20 border border-red-900 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                            {isSubmitting ? t('creating') : t('create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
