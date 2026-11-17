'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Hammer } from 'lucide-react';

export default function TemplatesPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 min-h-screen bg-[#05050a] text-slate-200 font-sans relative selection:bg-purple-500/30 overflow-x-hidden">
                {/* Background Ambience */}
                <div className="fixed top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-purple-900/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Header Section */}
                <header className="py-4 md:py-6 pl-16 md:pl-6 lg:pl-10 pr-4 md:pr-6 lg:pr-10 sticky top-0 bg-[#05050a]/80 backdrop-blur-md z-30 border-b border-slate-800/30">
                    <div className="max-w-[1600px] mx-auto">
                        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight mb-1">
                            Templates
                        </h1>
                        <p className="text-sm text-slate-400">Choose a template to start your next masterpiece.</p>
                    </div>
                </header>

                {/* Main Content */}
                <div className="p-4 md:p-6 lg:p-10 flex-1 flex flex-col items-center justify-center text-center h-[calc(100vh-100px)] relative z-10 animate-fade-in-up">
                    <div className="w-24 h-24 bg-[#15151A] rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-2xl shadow-purple-900/20">
                        <Hammer className="w-10 h-10 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-3 tracking-wide">Templates are under construction</h2>
                    <p className="text-slate-400 max-w-md leading-relaxed">
                        We are currently building a library of amazing templates to help you create your webtoons faster. <br />
                        Check back soon for updates!
                    </p>
                </div>

                <style jsx global>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-up {
                        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
            </div>
        </DashboardLayout>
    );
}
