'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { User, Wand2, Plus, Trash2 } from 'lucide-react'; // Added Trash2
import CharacterCreateModal from '@/components/editor/CharacterCreateModal';
import { useCanvasStore } from '@/store/useCanvasStore';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTranslations } from 'next-intl';

interface Character {
    id: string;
    name: string;
    appearance_tags: string[];
    profile_image_url?: string;
}

export default function CharacterList() {
    const t = useTranslations('Modals.CharacterDetail');
    const tl = useTranslations('Project.Editor.CharacterList');
    const params = useParams();
    const projectId = params?.projectId as string;
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null); // Added state
    const { setActiveCharacter, activeCharacter } = useCanvasStore();

    const handleGenerate = async (charId: string) => {
        setGeneratingId(charId);
        try {
            await api.post(`/characters/${charId}/generate`);
            fetchCharacters(); // Refresh list to show new image
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingId(null);
        }
    };
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

    const handleDeleteConfirm = async (id: string) => {
        try {
            await api.delete(`/characters/${id}`);
            fetchCharacters();
        } catch (err) {
            console.error("Failed to delete character", err);
        }
    };

    const fetchCharacters = async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const res = await api.get(`/characters/?project_id=${projectId}`);
            setCharacters(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, [projectId]);

    return (
        <div className="flex flex-col h-full bg-[#0f0f16]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">{tl('title')}</h3>
                <span className="text-xs text-slate-500 font-mono">{characters.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 custom-scrollbar">
                {loading ? (
                    <div className="text-slate-500 text-xs text-center py-4">{tl('loading') || 'Loading...'}</div>
                ) : characters.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl m-2 italic">
                        {tl('empty')}
                    </div>
                ) : (
                    characters.map((char) => (
                        <div
                            key={char.id}
                            className={`p-2 rounded-lg cursor-pointer transition-all group border flex items-center gap-3 ${activeCharacter?.name === char.name
                                ? 'bg-purple-900/20 border-purple-500/50'
                                : 'bg-[#15151A] border-transparent hover:bg-slate-800 hover:border-slate-700'
                                }`}
                            onClick={() => setActiveCharacter({ name: char.name, tags: char.appearance_tags, profile_image_url: char.profile_image_url })}
                            title={char.appearance_tags.join(', ')}
                        >
                            <div className={`relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-700 ${!char.profile_image_url && 'bg-slate-800 flex items-center justify-center'}`}>
                                {char.profile_image_url ? (
                                    <img src={char.profile_image_url} alt={char.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} className="text-slate-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className={`text-sm font-bold truncate ${activeCharacter?.name === char.name ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                        {char.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate max-w-[100px]">
                                        {char.appearance_tags.slice(0, 2).join(', ')}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerate(char.id);
                                    }}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                    title={tl('generateImage')}
                                    disabled={generatingId === char.id}
                                >
                                    {generatingId === char.id ? (
                                        <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Wand2 size={14} />
                                    )}
                                </button>
                                <ConfirmationDialog
                                    open={deleteConfirmationId === char.id}
                                    onOpenChange={(open) => !open && setDeleteConfirmationId(null)}
                                    title={t('delete')}
                                    description={t('deleteConfirm')}
                                    confirmLabel={t('delete')}
                                    cancelLabel={t('close')}
                                    onConfirm={() => handleDeleteConfirm(char.id)}
                                    variant="destructive"
                                    trigger={
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmationId(char.id);
                                            }}
                                            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all ml-1"
                                            title={tl('deleteCharacter')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    }
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-[#0f0f16]">
                <CharacterCreateModal onCharacterCreated={fetchCharacters} />
            </div>
        </div>
    );
}
