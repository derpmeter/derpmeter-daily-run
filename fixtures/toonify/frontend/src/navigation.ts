import { createNavigation } from 'next-intl/navigation';

export const locales = ['ko', 'en'] as const;
export const localePrefix = 'never';

export const { Link, redirect, usePathname, useRouter } =
    createNavigation({ locales, localePrefix });
