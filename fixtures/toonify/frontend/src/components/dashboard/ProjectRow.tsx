'use client';

import { useRouter } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MoreVertical, Trash2, Clock, Calendar } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from './ProjectCard';

interface ProjectRowProps {
    project: Project;
    onDelete: (p: Project) => void;
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

export default function ProjectRow({ project, onDelete }: ProjectRowProps) {
    const router = useRouter();
    const t = useTranslations('Dashboard');
    const locale = useLocale();

    return (
        <div
            onClick={() => router.push(`/project/${project.id}`)}
            className="group flex justify-between h-28 bg-[#0f0f16] border border-slate-800 rounded-xl hover:border-purple-500/50 hover:bg-[#13131c] transition-all duration-200 cursor-pointer overflow-hidden pr-4"
        >
            <div className="flex gap-6 flex-1 min-w-0 h-full">
                {/* Thumbnail - Full Height */}
                <div className="h-full aspect-video bg-slate-900 shrink-0 relative border-r border-slate-800">
                    {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 font-bold text-xl">
                            {project.title.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center min-w-0 py-2">
                    <h3 className="text-white font-bold truncate text-base mb-1.5 group-hover:text-purple-400 transition-colors">
                        {project.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(project.created_at, locale)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pl-4 self-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
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
        </div>
    );
}
