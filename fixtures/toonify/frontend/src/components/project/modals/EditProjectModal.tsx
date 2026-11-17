'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Tag, Layers, FileText } from 'lucide-react';
import { SectionLabel } from '@/components/ui/section-label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Genre {
    id: string;
    name: string;
    description?: string;
}

interface Project {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    style_preset: string;
    worldview?: any;
    genre_id?: string | null; // deprecated
    genre_ids?: string[];
    genre?: string;

}

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: (updatedProject: Project) => void;
}

export default function EditProjectModal({ isOpen, onClose, project, onUpdate }: EditProjectModalProps) {
    const t = useTranslations('Modals.EditProject');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        worldview_content: '',
        style_preset: '',
        genre_ids: [] as string[],
        language: ''
    });

    // Detailed Worldview Data
    const [tones, setTones] = useState<string[]>([]);
    const [keyFeatures, setKeyFeatures] = useState<string[]>([]);

    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(false);
    const [genresLoading, setGenresLoading] = useState(false);

    // Initialize Data
    useEffect(() => {
        if (project) {
            // Parse Worldview
            let wvContent = '';
            let wvTones: string[] = [];
            let wvFeatures: string[] = [];

            if (project.worldview) {
                if (typeof project.worldview === 'string') {
                    wvContent = project.worldview;
                } else {
                    wvContent = project.worldview.content || project.worldview.description || '';
                    wvTones = Array.isArray(project.worldview.tone) ? project.worldview.tone : (project.worldview.tone ? [project.worldview.tone] : []);
                    wvFeatures = Array.isArray(project.worldview.key_features) ? project.worldview.key_features : [];
                }
            }

            setFormData({
                title: project.title || '',
                subtitle: project.subtitle || '',
                description: project.description || '',
                worldview_content: wvContent,
                style_preset: project.style_preset || '',
                genre_ids: project.genre_ids || (project.genre_id ? [project.genre_id] : []),
                // @ts-ignore
                language: project.language || 'en'
            });
            setTones(wvTones);
            setKeyFeatures(wvFeatures);
        }
    }, [project, isOpen]);

    // Fetch Genres
    useEffect(() => {
        if (isOpen && genres.length === 0) {
            setGenresLoading(true);
            api.get('/genres').then(res => {
                setGenres(res.data);
            }).catch(err => {
                console.error("Failed to fetch genres", err);
            }).finally(() => {
                setGenresLoading(false);
            });
        }
    }, [isOpen, genres.length]);

    const ct = useTranslations('Common.languages');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Reconstruct worldview object
            const worldviewUpdate = {
                content: formData.worldview_content,
                tone: tones,
                key_features: keyFeatures
            };

            const response = await api.patch(`/projects/${project.id}`, {
                title: formData.title,
                subtitle: formData.subtitle,
                description: formData.description,
                worldview: worldviewUpdate,
                genre_ids: formData.genre_ids,
                language: formData.language
            });
            onUpdate(response.data);
            onClose();
        } catch (error) {
            console.error("Failed to update project", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-[#0A0A0B] text-white border-gray-800 p-0 overflow-hidden gap-0 h-[85vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <SettingsIcon className="text-gray-400" /> {t('title')}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {t('description')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Form Body - Scrollable */}
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <SectionLabel icon={<FileText size={14} />}>{t('basicInfo')}</SectionLabel>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right text-gray-300">{t('titleLabel')}</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subtitle" className="text-right text-gray-300">{t('subtitleLabel')}</Label>
                                <Input
                                    id="subtitle"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="language" className="text-right text-gray-300">{t('languageLabel')}</Label>
                                <Select
                                    value={formData.language}
                                    onValueChange={(val) => setFormData({ ...formData, language: val })}
                                >
                                    <SelectTrigger id="language" className="col-span-3 bg-black/20 border-white/10 text-white">
                                        <SelectValue placeholder={t('selectLanguage')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#2c2c44] border-white/10 text-white">
                                        <SelectItem value="en">{ct('en')}</SelectItem>
                                        <SelectItem value="ko">{ct('ko')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="genre" className="text-right text-gray-300 mt-2">{t('genreLabel')}</Label>
                                <div className="col-span-3 flex flex-col gap-2">
                                    {/* Selected Genres */}
                                    <div className="flex flex-wrap gap-2">
                                        {formData.genre_ids.map(gid => {
                                            const g = genres.find(x => x.id === gid);
                                            return (
                                                <Badge key={gid} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                                                    {g?.name || gid}
                                                    <div
                                                        className="cursor-pointer hover:bg-black/20 rounded-full p-0.5"
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            genre_ids: formData.genre_ids.filter(id => id !== gid)
                                                        })}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                    </div>
                                                </Badge>
                                            );
                                        })}
                                    </div>

                                    <Select
                                        value="default"
                                        onValueChange={(val: string) => {
                                            if (val !== "default" && !formData.genre_ids.includes(val)) {
                                                setFormData({ ...formData, genre_ids: [...formData.genre_ids, val] })
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-black/20 border-white/10 text-white w-full">
                                            <SelectValue placeholder={t('selectGenrePlaceholder') || t('addGenre')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#2c2c44] border-white/10 text-white">
                                            {genres.filter(g => !formData.genre_ids.includes(g.id)).map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Worldview Section */}
                    <div className="space-y-4">
                        <SectionLabel icon={<Layers size={14} />}>{t('worldviewSection')}</SectionLabel>

                        {/* Description */}
                        <div>
                            <Label className="mb-2 block text-gray-300">{t('worldDescLabel')}</Label>
                            <Textarea
                                value={formData.worldview_content}
                                onChange={(e) => setFormData({ ...formData, worldview_content: e.target.value })}
                                placeholder={t('worldDescPlaceholder')}
                            />
                        </div>

                        {/* Tones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="mb-2 block text-gray-300 flex items-center gap-2"><Tag size={12} /> {t('tonesLabel')}</Label>
                                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-black/20 border border-white/5 min-h-[50px]">
                                    {tones.length > 0 ? tones.map((t, i) => (
                                        <Badge key={i} variant="tag">
                                            {t}
                                        </Badge>
                                    )) : <span className="text-gray-500 text-xs italic">{t('noTones')}</span>}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">{t('tonesHelp')}</p>
                            </div>

                            {/* Key Features */}
                            <div>
                                <Label className="mb-2 block text-gray-300 flex items-center gap-2"><Sparkles size={12} /> {t('keyFeaturesLabel')}</Label>
                                <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/20 border border-white/5 min-h-[50px]">
                                    {keyFeatures.length > 0 ? keyFeatures.map((f, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            {f}
                                        </div>
                                    )) : <span className="text-gray-500 text-xs italic">{t('noFeatures')}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 bg-[#0F0F12] flex justify-end gap-3 flex-none">
                    <Button type="button" variant="dark" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" variant="glow" onClick={handleSubmit} disabled={loading}>
                        {loading ? t('saving') : t('save')}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}

function SettingsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
