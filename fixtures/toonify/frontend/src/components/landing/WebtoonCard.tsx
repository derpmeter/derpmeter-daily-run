'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Eye } from 'lucide-react';
import { Webtoon } from '@/lib/mockLandingData';
import { useRouter } from '@/navigation';

interface WebtoonCardProps {
    webtoon: Webtoon;
    index: number;
}

export default function WebtoonCard({ webtoon, index }: WebtoonCardProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative flex flex-col gap-2 cursor-pointer"
            onClick={() => router.push('/login')}
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800">
                <Image
                    src={webtoon.image}
                    alt={webtoon.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Hover Overlay Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
                    <p className="text-xs font-semibold text-indigo-400 mb-1">{webtoon.genre}</p>
                    <p className="text-xs text-gray-300 line-clamp-2">
                        {webtoon.author}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {webtoon.title}
                </h3>
                <p className="text-xs text-gray-500">{webtoon.author}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{webtoon.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{webtoon.views}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
