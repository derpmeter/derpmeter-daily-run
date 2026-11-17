'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Plus, Settings, Coins } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

interface WorkspaceSelectorProps {
    onOpenCreateWorkspace?: () => void;
    onOpenRecharge: () => void;
    isCollapsed?: boolean;
    readOnly?: boolean;
}

export default function WorkspaceSelector({
    onOpenCreateWorkspace,
    onOpenRecharge,
    isCollapsed,
    readOnly
}: WorkspaceSelectorProps) {
    const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('Dashboard');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentWorkspace) return null;

    if (isCollapsed) {
        if (readOnly) {
            return (
                <div className="flex justify-center py-2">
                    <button
                        onClick={onOpenRecharge}
                        className="size-10 rounded-xl bg-[#15151A] hover:bg-[#1A1A20] border border-gray-800 flex items-center justify-center text-yellow-500 cursor-pointer transition-colors"
                        title={`${currentWorkspace.name}: ${currentWorkspace.credits} Cr`}
                    >
                        <Coins size={18} />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex justify-center py-2 relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="size-10 rounded-xl bg-[#15151A] hover:bg-[#1A1A20] border border-gray-800 flex items-center justify-center text-white font-bold text-lg"
                    title={currentWorkspace.name}
                >
                    {currentWorkspace.name.substring(0, 1).toUpperCase()}
                </button>

                {/* Collapsed Dropdown */}
                {isOpen && (
                    <div className="absolute left-full top-0 ml-2 z-50 w-56 bg-[#15151A] rounded-xl border border-gray-800 shadow-xl py-2 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800/50 mb-1">
                            {currentWorkspace.name}
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {workspaces.map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => {
                                        setCurrentWorkspace(ws);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 transition-colors text-left"
                                >
                                    <span className={cn("truncate", ws.id === currentWorkspace.id && "text-white font-medium")}>{ws.name}</span>
                                    {ws.id === currentWorkspace.id && <Check size={14} className="text-primary" />}
                                </button>
                            ))}
                        </div>
                        <div className="h-px bg-gray-800 my-2 mx-3" />
                        <button
                            onClick={() => {
                                onOpenCreateWorkspace?.();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors text-left font-medium"
                        >
                            <Plus size={14} /> {t('workspace.create')}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative mx-1" ref={dropdownRef}>
            <div
                onClick={() => !readOnly && setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between text-left bg-[#15151A] rounded-xl p-3 border border-gray-800 transition-all duration-200 group",
                    !readOnly && "hover:bg-[#1A1A20] cursor-pointer"
                )}
            >
                <div className="min-w-0 flex-1">
                    <div className={cn("text-sm font-semibold text-gray-200 truncate mb-1.5 transition-colors", !readOnly && "group-hover:text-white")}>
                        {currentWorkspace.name}
                    </div>
                    <div
                        className="inline-flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-md text-yellow-500 text-xs font-semibold hover:bg-yellow-500/20 hover:text-yellow-400 transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenRecharge();
                        }}
                    >
                        <Coins size={12} />
                        <span>{currentWorkspace.credits.toLocaleString()} Cr</span>
                        <Plus size={10} className="bg-yellow-500/20 rounded-full p-0.5" />
                    </div>
                </div>
                {!readOnly && <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
            </div>

            {/* Dropdown Menu */}
            {isOpen && !readOnly && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#15151A] rounded-xl border border-gray-800 shadow-2xl shadow-black/50 py-2 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {t('workspace.switch')}
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => {
                                    setCurrentWorkspace(ws);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 transition-colors text-left"
                            >
                                <span className={cn("truncate", ws.id === currentWorkspace.id && "text-white font-medium")}>{ws.name}</span>
                                {ws.id === currentWorkspace.id && <Check size={14} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                    <div className="h-px bg-gray-800 my-2 mx-3" />
                    <button
                        onClick={() => {
                            onOpenCreateWorkspace?.();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors text-left font-medium"
                    >
                        <div className="size-6 rounded-md bg-gray-800 flex items-center justify-center">
                            <Plus size={14} />
                        </div>
                        {t('workspace.create')}
                    </button>
                    <Link
                        href="/dashboard/settings"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors text-left font-medium"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="size-6 rounded-md bg-gray-800 flex items-center justify-center">
                            <Settings size={14} />
                        </div>
                        {t('workspace.settings')}
                    </Link>
                </div>
            )}
        </div>
    );
}
