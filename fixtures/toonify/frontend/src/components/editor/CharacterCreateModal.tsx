'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface CharacterCreateModalProps {
    onCharacterCreated: () => void;
}

export default function CharacterCreateModal({ onCharacterCreated }: CharacterCreateModalProps) {
    const params = useParams();
    const projectId = params?.projectId as string;
    const [open, setOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const t = useTranslations('Project.Editor.CharacterCreateModal');

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const onSubmit = async (data: any) => {
        if (!projectId) return;
        try {
            await api.post('/characters', {
                name: data.name,
                project_id: projectId,
                appearance_tags: tags,
                default_mood: "neutral"
            });
            setOpen(false);
            reset();
            setTags([]);
            onCharacterCreated();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-2 text-gray-500 border border-dashed border-gray-600 hover:text-white hover:border-gray-500 hover:bg-gray-700">
                    <Plus size={16} className="mr-2" />{t('addCharacter')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="name">{t('nameLabel')}</Label>
                        <Input id="name" {...register('name', { required: true })} placeholder={t('namePlaceholder')} className="bg-gray-800 border-gray-600" />
                    </div>

                    <div className="space-y-2">
                        <Label>{t('tagsLabel')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                                placeholder={t('tagsPlaceholder')}
                                className="bg-gray-800 border-gray-600"
                            />
                            <Button type="button" onClick={addTag} variant="secondary">{t('addTag')}</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map(tag => (
                                <div key={tag} className="flex items-center bg-gray-700 px-2 py-1 rounded text-sm text-gray-200">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                            {isSubmitting ? t('creating') : t('create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
