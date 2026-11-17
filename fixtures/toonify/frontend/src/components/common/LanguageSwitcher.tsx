'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Settings'); // Reusing Settings namespace or Common

    const ct = useTranslations('Common.languages');

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-purple-500 hover:bg-purple-500/10">
                    <Languages size={20} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#15151A] border-gray-800 text-white">
                <DropdownMenuItem
                    className={`cursor-pointer ${locale === 'en' ? 'text-purple-400 font-bold' : 'text-gray-300'}`}
                    onClick={() => handleLocaleChange('en')}
                >
                    {ct('en')}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={`cursor-pointer ${locale === 'ko' ? 'text-purple-400 font-bold' : 'text-gray-300'}`}
                    onClick={() => handleLocaleChange('ko')}
                >
                    {ct('ko')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
