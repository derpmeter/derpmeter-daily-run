'use client';

import { Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export interface Character {
    id?: string;
    name: string;
    default_mood?: string | string[];
    appearance_tags?: string[]; 
    profile_image_url?: string;
}

export default function CharacterCard({ character }: { character: Character }) {
    const t = useTranslations('Project.Home');
    
    // Check if the mood IS the translation key "Default Mood" or similar? 
    // Actually the user provided strings might be anything. 
    // However, "Neutral" is a common default.
    const moodDisplay = Array.isArray(character.default_mood) 
        ? character.default_mood.join(", ") 
        : (character.default_mood || t('neutral'));

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#1d1c27] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border border-gray-200 dark:border-transparent">
            {character.profile_image_url ? (
                <img className="h-48 w-full object-cover" alt={`Illustration of ${character.name}`} src={character.profile_image_url} />
            ) : (
                <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-4xl text-slate-400 dark:text-slate-600 font-bold opacity-30">{character.name.charAt(0)}</span>
                </div>
            )}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{character.name}</h3>
                <p className="text-sm text-gray-500 dark:text-[#a19db9]">{t('defaultMood')}: {moodDisplay}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {character.appearance_tags && character.appearance_tags.map((tag, index) => (
                        <span key={index} className={`rounded-full px-2 py-1 text-xs font-medium ${index === 0 ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#a19db9]'}`}>
                            {tag}
                        </span>
                    ))}
                    {(!character.appearance_tags || character.appearance_tags.length === 0) && (
                         <span className="rounded-full px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#a19db9]">
                            {t('protagonist')}
                        </span>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20">
                    <Edit size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20">
                    <Eye size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-red-500/50 hover:text-white">
                    <Trash2 size={20} />
                </Button>
            </div>
        </div>
    );
}
