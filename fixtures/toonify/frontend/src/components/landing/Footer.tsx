'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Landing.Footer');

    return (
        <footer className="bg-black py-12 border-t border-white/5">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-gray-500">
                    &copy; 2025 <a href="https://labs.workromancer.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Workromancer</a>. All rights reserved.
                </p>
                <div className="flex gap-6 items-center">
                    <a href="mailto:mincheol@workromancer.ai" className="text-sm text-gray-400 hover:text-white transition-colors">
                        mincheol@workromancer.ai
                    </a>
                    <a href="https://threads.com/@workromancer" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                        @workromancer
                    </a>
                </div>
            </div>
        </footer>
    );
}
