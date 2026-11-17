'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    LayoutGrid, Paintbrush, LayoutTemplate, FolderOpen, Settings,
    Plus, Search, MoreVertical, Clock, LogOut, User,
    HelpCircle, ChevronDown, Sparkles, Image as ImageIcon,
    Zap, Wand2, ArrowRight, Trash2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from 'next-intl';
import SectionTitle from "@/components/ui/SectionTitle";

// --- Interfaces ---

import ProjectCard, { Project } from '@/components/dashboard/ProjectCard';

interface Template {
    id: string;
    title: string;
    description: string;
    style_preset: string;
    category: string;
    is_premium: boolean;
    image_url?: string;
    isAction?: boolean; // For "Start from Scratch"
}

const TemplateCard = ({ template, onSelect }: { template: Template; onSelect: (t: Template | null) => void }) => {
    const t = useTranslations('Dashboard');
    return (
        <div
            onClick={() => onSelect(template.isAction ? null : template)}
            className={`
        group relative w-full aspect-square rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl
        ${template.isAction
                    ? 'border-dashed border-slate-700 bg-slate-900/30 hover:border-purple-500 hover:bg-purple-900/10 flex flex-col items-center justify-center gap-4'
                    : 'border-slate-800 bg-[#0f0f16] hover:border-slate-600'
                }
    `}>
            {template.isAction ? (
                <>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-110 transition-transform duration-300">
                        <Plus size={28} className="text-white" />
                    </div>
                    <div className="text-center">
                        <span className="block text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{template.title}</span>
                        <span className="block text-[10px] text-slate-500 mt-1">{template.description}</span>
                    </div>
                </>
            ) : (
                <>
                    <div className="w-full h-full relative">
                        {/* Use placebo/placeholder if no image */}
                        <img
                            src={template.image_url || `https://picsum.photos/seed/${template.id}/300/300`}
                            alt={template.title}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f16] via-transparent to-transparent opacity-90" />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white block truncate mb-0.5">
                            {template.title}
                        </span>
                        <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {t('useTemplate')} <ChevronDown size={10} className="-rotate-90" />
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Draft Card Component ---
const DraftCard = ({ draft, onClick }: { draft: any, onClick: () => void }) => {
    const t = useTranslations('Dashboard');
    return (
        <div
            onClick={onClick}
            className="group relative w-full aspect-[3/4] bg-[#0f0f16] rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1.5 shadow-lg hover:shadow-purple-900/20"
        >
            <div className="absolute top-3 left-3 z-20">
                <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-lg">{t('inProgress')}</span>
            </div>

            {/* Thumbnail Area - Placeholder for Draft */}
            <div className="flex-1 bg-slate-900/50 relative flex items-center justify-center overflow-hidden">
                <div className="flex flex-col items-center justify-center gap-3 h-full w-full bg-slate-900 group-hover:bg-slate-800 transition-colors relative">
                    {/* Abstract Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-black" />

                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-500 border border-purple-500/20">
                        <Wand2 size={32} />
                    </div>
                </div>

                {/* Hover Action */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all">
                        {t('resume')} <ArrowRight size={12} />
                    </div>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-5 border-t border-slate-800 bg-[#0f0f16] group-hover:bg-[#13131c] transition-colors relative z-10">
                <h3 className="text-white font-bold truncate mb-1.5 text-sm">{draft.title || t('untitledDraft')}</h3>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <Clock size={10} />
                        <span>{t('justNow')}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/20 text-purple-400 border border-purple-500/30">
                        {t('draft')}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const [projects, setProjects] = useState<Project[]>([]);

    const [customStyles, setCustomStyles] = useState<any[]>([]); // Added state for styles
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [draftProject, setDraftProject] = useState<any>(null);
    const { user } = useAuthStore();
    const router = useRouter();
    const { toast } = useToast();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            await api.delete(`/projects/${projectToDelete.id}`);
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            toast({ title: t('deleteSuccess') || "Project deleted" });
        } catch (error) {
            console.error(error);
            toast({ title: t('deleteFailed') || "Failed to delete project", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects', { timeout: 5000 });
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCustomStyles = async () => {
        try {
            const res = await api.get('/styles');
            setCustomStyles(res.data);
        } catch (err) {
            console.error("Failed to fetch styles", err);
        }
    };

    useEffect(() => {
        Promise.all([fetchProjects(), fetchCustomStyles()]).finally(() => setLoading(false));

        // Load Draft
        const savedDraft = localStorage.getItem('toontune_project_draft');
        if (savedDraft) {
            try {
                setDraftProject(JSON.parse(savedDraft));
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
    }, []);

    const handleTemplateSelect = (template: Template | null) => {
        router.push('/new-project');
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="flex-1 min-h-screen bg-[#05050a] text-slate-200 font-sans relative selection:bg-purple-500/30">
                {/* Background Ambience */}
                <div className="fixed top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-purple-900/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Top Header */}
                <header className="py-4 md:py-6 pl-16 md:pl-6 lg:pl-10 pr-4 md:pr-6 lg:pr-10 sticky top-0 bg-[#05050a]/80 backdrop-blur-md z-30 border-b border-slate-800/30">
                    <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-xl lg:text-3xl font-bold text-white leading-tight flex items-center gap-2">
                                <span className="hidden md:inline">{t('welcome')}</span>
                                <span className="md:hidden text-base">{t('welcomeBack')}</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{user?.email?.split('@')[0] || t('defaultUser')}!</span>
                                <span className="animate-pulse text-lg md:text-xl">👋</span>
                            </h1>
                            <p className="text-xs md:text-sm text-slate-400 mt-0.5 hidden md:block">{t('welcomeMessage')}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-6 w-px bg-slate-800 hidden md:block" />

                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-slate-900 border border-slate-700/50 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none w-40 md:w-64 transition-all placeholder:text-slate-600 focus:w-48 md:focus:w-80 focus:bg-slate-900/80"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 md:space-y-14 pb-20 relative z-10 overflow-x-hidden">

                    {/* Section: Recent Projects */}
                    <section className="animate-fade-in-up">
                        <SectionTitle
                            color="purple"
                            action={
                                <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                                    {t('viewAll')} <ChevronDown size={12} className="-rotate-90" />
                                </button>
                            }
                        >
                            {t('recentProjects')}
                        </SectionTitle>

                        {loading ? (
                            <div className="w-full h-40 flex items-center justify-center text-slate-600">
                                <span className="animate-pulse">{t('loadingProjects')}</span>
                            </div>
                        ) : (filteredProjects.length > 0 || draftProject) ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                                {draftProject && (
                                    <DraftCard draft={draftProject} onClick={() => router.push('/new-project')} />
                                )}
                                {filteredProjects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onDelete={(p) => {
                                            setProjectToDelete(p);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 bg-slate-900/20">
                                <FolderOpen size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">{t('noProjects')}</p>
                            </div>
                        )}
                    </section>

                    {/* Section: Start New */}
                    <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <SectionTitle color="indigo">
                            {t('startNew')}
                        </SectionTitle>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {/* Custom Styles Section */}
                            {customStyles.length > 0 ? (
                                <>
                                    {customStyles.map(style => (
                                        <TemplateCard
                                            key={style.id}
                                            template={{
                                                id: style.id,
                                                title: style.name,
                                                description: t('styles.myStyles'),
                                                style_preset: style.id, // Use ID as preset
                                                category: 'custom',
                                                is_premium: false,
                                                image_url: style.image_url
                                            }}
                                            onSelect={(t) => router.push(`/new-project?style_preset=${t?.style_preset}`)}
                                        />
                                    ))}
                                    {/* Always show Create Style as the last card if we have some styles */}
                                    <div
                                        onClick={() => router.push('/dashboard/styles')}
                                        className="group relative w-full aspect-square rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 hover:border-purple-500 hover:bg-purple-900/10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300">
                                            <Plus size={28} className="text-slate-400 group-hover:text-white" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                                {t('CreateStyle.title')}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Create Style Placeholder - Main Call to Action when empty */
                                <div
                                    onClick={() => router.push('/dashboard/styles')}
                                    className="group relative w-full aspect-square rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 hover:border-purple-500 hover:bg-purple-900/10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl"
                                >
                                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300">
                                        <Plus size={28} className="text-slate-400 group-hover:text-white" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                            {t('CreateStyle.title')}
                                        </span>
                                        <span className="block text-[10px] text-slate-500 mt-1">
                                            {t('CreateStyle.desc')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #334155;
                        border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #475569;
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-up {
                        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
            </div>

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title={t('deleteProjectTitle') || "Delete Project"}
                description={t('deleteProjectDesc') || "This action will soft delete the project. Please type the project name to confirm."}
                confirmLabel={t('delete') || "Delete"}
                variant="destructive"
                onConfirm={handleDeleteProject}
                verificationText={projectToDelete?.title}
            />
        </>
    );
}

