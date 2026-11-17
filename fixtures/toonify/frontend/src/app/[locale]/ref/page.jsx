'use client'

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Save, Download, Layers, Users, Image as ImageIcon,
    Settings, ChevronDown, ChevronRight, Play, Square, Smartphone,
    Monitor, RefreshCw, Wand2, MoreVertical, Plus, Trash2, Maximize2
} from 'lucide-react';

/**
 * WEBTOON EPISODE EDITOR
 * * Concept: Professional Webtoon Authoring Tool
 * * Layout: 3-Column (Navigation | Storyboard/Canvas | Properties)
 */

// --- Mock Data ---

const CHARACTERS = [
    { id: 'char1', name: 'Protagonist', image: 'https://picsum.photos/seed/hero/100/100', active: true },
    { id: 'char2', name: 'Rival', image: 'https://picsum.photos/seed/rival/100/100', active: false },
    { id: 'char3', name: 'Sidekick', image: 'https://picsum.photos/seed/side/100/100', active: true },
];

const INITIAL_CUTS = [
    {
        id: 1,
        script: "Close-up of the protagonist's eyes opening wide in shock. The glowing blue screen reflects in their pupils.",
        prompt: "extreme close up, anime style, shocked eyes, reflection of blue screen, dark room, cinematic lighting",
        image: null,
        ratio: "9:16",
        status: "empty"
    },
    {
        id: 2,
        script: "Wide shot of the messy office. Pizza boxes and energy drinks are scattered everywhere. A spectral figure looms in the background.",
        prompt: "wide shot, messy developer office, pizza boxes, energy drinks, ghost silhouette in background, cyberpunk atmosphere",
        image: "https://picsum.photos/seed/office/400/600",
        ratio: "9:16",
        status: "done"
    },
    {
        id: 3,
        script: "The ghost points a bony finger at the monitor. 'You forgot a semicolon on line 404.'",
        prompt: "ghost character pointing finger, scary but comical, dark aura, glowing code effects",
        image: null,
        ratio: "1:1",
        status: "empty"
    }
];

// --- Components ---

const AspectRatioSelector = ({ current, onChange }) => (
    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700/50">
        {[
            { id: '9:16', icon: Smartphone, label: 'Scroll' },
            { id: '1:1', icon: Square, label: 'Square' },
            { id: '16:9', icon: Monitor, label: 'Wide' },
        ].map((ratio) => (
            <button
                key={ratio.id}
                onClick={() => onChange(ratio.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-md text-[10px] transition-all gap-1 ${current === ratio.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
            >
                <ratio.icon size={14} />
                {ratio.label}
            </button>
        ))}
    </div>
);

// --- Main Editor ---

export default function EpisodeEditor() {
    const [cuts, setCuts] = useState(INITIAL_CUTS);
    const [selectedCutId, setSelectedCutId] = useState(1);
    const [selectedCut, setSelectedCut] = useState(INITIAL_CUTS[0]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Update selected cut when ID changes
    useEffect(() => {
        const cut = cuts.find(c => c.id === selectedCutId);
        if (cut) setSelectedCut(cut);
    }, [selectedCutId, cuts]);

    // Handle Input Changes
    const handlePromptChange = (text) => {
        const updated = { ...selectedCut, prompt: text };
        setSelectedCut(updated);
        updateCutInList(updated);
    };

    const updateCutInList = (updatedCut) => {
        setCuts(prev => prev.map(c => c.id === updatedCut.id ? updatedCut : c));
    };

    // Simulation: Image Generation
    const handleGenerate = () => {
        setIsGenerating(true);

        // Simulate API call
        setTimeout(() => {
            const newImage = `https://picsum.photos/seed/${Date.now()}/400/${selectedCut.ratio === '1:1' ? '400' : selectedCut.ratio === '16:9' ? '225' : '600'}`;
            const updated = { ...selectedCut, image: newImage, status: 'done' };

            setSelectedCut(updated);
            updateCutInList(updated);
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className="flex h-screen w-full bg-[#05050a] text-slate-200 font-sans overflow-hidden selection:bg-purple-500/30">

            {/* 1. Header Navigation */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a10] border-b border-slate-800 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-4 w-px bg-slate-800" />
                    <div>
                        <h1 className="text-sm font-bold text-white flex items-center gap-2">
                            Ep. 04: The Compile Error
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Draft</span>
                        </h1>
                        <p className="text-[10px] text-slate-500">Last saved: Just now</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                        <Save size={14} /> Save
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-black bg-white hover:bg-slate-200 rounded-lg transition-colors">
                        <Download size={14} /> Export
                    </button>
                </div>
            </header>

            {/* 2. Left Sidebar: Navigation */}
            <aside className="w-16 mt-14 flex-shrink-0 bg-[#0a0a10] border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-40">
                <button className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Layers size={20} />
                </button>
                <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                    <Users size={20} />
                </button>
                <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                    <ImageIcon size={20} />
                </button>
                <div className="flex-1" />
                <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                    <Settings size={20} />
                </button>
            </aside>

            {/* 3. Center: Storyboard Canvas */}
            <main className="flex-1 mt-14 relative bg-[#05050a] overflow-y-auto custom-scrollbar flex justify-center p-8">

                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />

                <div className="w-full max-w-2xl space-y-6 relative z-10 pb-20">

                    {cuts.map((cut, index) => (
                        <div
                            key={cut.id}
                            onClick={() => setSelectedCutId(cut.id)}
                            className={`
                group relative bg-[#0f0f16] border rounded-xl overflow-hidden transition-all cursor-pointer
                ${selectedCutId === cut.id
                                    ? 'border-purple-500 ring-1 ring-purple-500/50 shadow-2xl scale-[1.01]'
                                    : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'}
              `}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#13131c] border-b border-slate-800">
                                <span className="text-xs font-bold text-slate-400 font-mono">CUT #{String(index + 1).padStart(2, '0')}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:text-white text-slate-500"><Maximize2 size={12} /></button>
                                    <button className="p-1 hover:text-red-400 text-slate-500"><Trash2 size={12} /></button>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="flex">
                                {/* Image Placeholder / Result */}
                                <div className={`w-1/2 aspect-[3/4] bg-slate-900 relative flex items-center justify-center border-r border-slate-800 overflow-hidden`}>
                                    {cut.image ? (
                                        <img src={cut.image} alt="Cut" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-slate-600 flex flex-col items-center gap-2">
                                            <ImageIcon size={32} className="opacity-50" />
                                            <span className="text-[10px]">No Image Generated</span>
                                        </div>
                                    )}

                                    {/* Generating Overlay */}
                                    {selectedCutId === cut.id && isGenerating && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                            <RefreshCw className="text-purple-500 animate-spin mb-2" />
                                            <span className="text-xs text-purple-300 animate-pulse">Rendering...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Script Area */}
                                <div className="w-1/2 p-4 flex flex-col">
                                    <span className="text-[10px] uppercase text-slate-500 font-bold mb-2">Script / Dialogue</span>
                                    <p className="text-sm text-slate-300 leading-relaxed flex-1">
                                        {cut.script}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        <span className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">Settings</span>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">{cut.ratio}</span>
                                            <span className="text-[10px] bg-purple-900/20 px-2 py-1 rounded text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                                <Wand2 size={8} /> AI Generated
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Cut Button */}
                    <button className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-600 hover:bg-slate-900/30 transition-all flex items-center justify-center gap-2 text-sm font-bold">
                        <Plus size={16} /> Add New Cut
                    </button>

                </div>
            </main>

            {/* 4. Right Sidebar: Properties & Tools */}
            <aside className="w-80 mt-14 bg-[#0a0a10] border-l border-slate-800 flex flex-col z-40">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white mb-1">Properties</h2>
                    <p className="text-xs text-slate-500">Selected: Cut #{String(selectedCutId).padStart(2, '0')}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                    {/* Prompt Section */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 flex justify-between">
                            <span>IMAGE PROMPT</span>
                            <span className="text-purple-400 cursor-pointer hover:underline">Auto-Enhance</span>
                        </label>
                        <textarea
                            value={selectedCut.prompt}
                            onChange={(e) => handlePromptChange(e.target.value)}
                            className="w-full h-32 bg-[#0f0f16] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none leading-relaxed"
                        />
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">ASPECT RATIO</label>
                        <AspectRatioSelector
                            current={selectedCut.ratio}
                            onChange={(r) => {
                                const updated = { ...selectedCut, ratio: r };
                                setSelectedCut(updated);
                                updateCutInList(updated);
                            }}
                        />
                    </div>

                    {/* Character Casting */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 flex justify-between items-center">
                            <span>ACTIVE CHARACTERS</span>
                            <span className="text-[10px] text-slate-500">2/3</span>
                        </label>
                        <div className="space-y-2">
                            {CHARACTERS.map(char => (
                                <div key={char.id} className="flex items-center justify-between p-2 bg-[#0f0f16] border border-slate-800 rounded-lg hover:border-slate-600 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <img src={char.image} alt={char.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                                        <span className="text-xs font-medium text-slate-300">{char.name}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${char.active ? 'bg-purple-600 border-purple-500' : 'border-slate-600'}`}>
                                        {char.active && <Check size={10} className="text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Action Footer */}
                <div className="p-4 border-t border-slate-800 bg-[#0f0f16]">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`
               w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
               ${isGenerating
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                            }
             `}
                    >
                        {isGenerating ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Wand2 size={16} fill="currentColor" /> Generate Image
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-600 text-center mt-2">
                        Cost: 1 Credit • Est. Time: ~5s
                    </p>
                </div>
            </aside>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
      `}</style>
        </div>
    );
}

function Check({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
