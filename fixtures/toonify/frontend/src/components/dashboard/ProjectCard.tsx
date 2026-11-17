'use client';

import { useRouter } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MoreVertical, Trash2, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Project {
    id: string;
    title: string;
    style_preset: string;
    created_at: string;
    thumbnail_url?: string;
    [key: string]: any;
}

interface ProjectCardProps {
    project: Project;
    onDelete?: (p: Project) => void;
}

// Format date based on locale
const formatDate = (dateStr: string, locale: string): string => {
    const date = new Date(dateStr);
    if (locale === 'ko') {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}년 ${month}월 ${day}일`;
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const router = useRouter();
    const t = useTranslations('Dashboard');
    const locale = useLocale();

    return (
        <div
            onClick={() => router.push(`/project/${project.id}`)}
            className="group relative w-full bg-[#0f0f16] rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1.5 shadow-lg hover:shadow-purple-900/20"
        >
            {/* Thumbnail Area */}
            <div className="w-full aspect-video bg-slate-900/50 relative flex items-center justify-center overflow-hidden">
                {project.thumbnail_url ? (
                    <div className="w-full h-full relative">
                        <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-transparent to-transparent opacity-60 pointer-events-none" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 h-full w-full bg-slate-900 group-hover:bg-slate-800 transition-colors relative overflow-hidden">
                        {/* Abstract Pattern BG */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500 via-slate-900 to-black" />

                        {/* Dynamic Character */}
                        <span className="text-6xl font-black text-slate-700 group-hover:text-slate-600 transition-colors select-none">
                            {project.title.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Overlay Actions */}
                {onDelete && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 translate-y-2 group-hover:translate-y-0 duration-300">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-purple-600 transition-colors border border-white/10"
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#15151A] border-slate-800" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(project);
                                    }}
                                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    {t('deleteProject')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Hover Play/Open Hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0">
                    <div className="bg-purple-600/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
                        {t('openEditor')}
                    </div>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-5 border-t border-slate-800 bg-[#0f0f16] group-hover:bg-[#13131c] transition-colors relative z-10">
                <h3 className="text-white font-bold truncate mb-1.5 text-sm">{project.title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-1">
                    <Clock size={10} />
                    <span className="whitespace-nowrap">{formatDate(project.created_at, locale)}</span>
                </div>
            </div>
        </div>
    );
}
