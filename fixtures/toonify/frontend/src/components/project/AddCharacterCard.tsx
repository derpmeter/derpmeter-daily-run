'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AddCharacterCard() {
    const t = useTranslations('Project.Home');
    return (
        <div className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-[#a19db9] transition-colors hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary">
            <Plus size={32} />
            <p className="mt-2 font-bold">{t('addNewChar')}</p>
        </div>
    );
}
