'use client';

import { useState, useEffect } from 'react';

import { Wand2, Smartphone, Square, Monitor, Check, RectangleHorizontal, RectangleVertical, MessageSquare, Cloud, Megaphone, Plus, X, ChevronDown, ChevronUp, Settings, Save } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Character {
    id: string;
    name: string;
    profile_image_url?: string;
    tags: string[];
}

interface Dialogue {
    speaker: string;
    text: string;
    type: 'speech' | 'thought' | 'shout';
}

const AspectRatioSelector = ({ current, onChange }: { current: string, onChange: (r: string) => void }) => (
    <div className="grid grid-cols-5 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
        {[
            { id: '9:16', icon: Smartphone, label: '9:16' },
            { id: '2:3', icon: RectangleVertical, label: '2:3' },
            { id: '3:4', icon: RectangleVertical, label: '3:4' },
            { id: '4:5', icon: RectangleVertical, label: '4:5' },
            { id: '1:1', icon: Square, label: '1:1' },
            { id: '5:4', icon: RectangleHorizontal, label: '5:4' },
            { id: '4:3', icon: RectangleHorizontal, label: '4:3' },
            { id: '3:2', icon: RectangleHorizontal, label: '3:2' },
            { id: '16:9', icon: Monitor, label: '16:9' },
            { id: '21:9', icon: Monitor, label: '21:9' },
        ].map((ratio) => (
            <button
                key={ratio.id}
                onClick={() => onChange(ratio.id)}
                className={`flex flex-col items-center justify-center py-2 rounded-md text-[9px] transition-all gap-1 ${current === ratio.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                title={ratio.label}
            >
                <ratio.icon size={12} />
                {ratio.label}
            </button>
        ))}
    </div>
);

const EpisodeContextEditor = ({ episodeId, projectId, characters, disabled, t }: { episodeId: string | null, projectId: string, characters: Character[], disabled?: boolean, t: (key: string, values?: Record<string, string>) => string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [bgInfo, setBgInfo] = useState('');
    const [outfits, setOutfits] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasReferenceBoard, setHasReferenceBoard] = useState(false);

    // Fetch initial data
    useEffect(() => {
        if (!episodeId || !isOpen) return;

        const fetchEp = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/episodes/${episodeId}`);
                const ep = res.data;
                setBgInfo(ep.background_info || '');
                setOutfits(ep.character_outfits || {});
                // Check if reference board exists (outfits are locked)
                setHasReferenceBoard(!!(ep.character_reference_board_urls && ep.character_reference_board_urls.length > 0));
            } catch (e) {
                console.error("Failed to load episode context", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEp();
    }, [episodeId, isOpen]);

    const handleSave = async () => {
        if (!episodeId) return;
        setSaving(true);
        try {
            await api.put(`/episodes/${episodeId}`, {
                background_info: bgInfo,
                character_outfits: hasReferenceBoard ? undefined : outfits  // Don't send outfits if locked
            });
            // Optional: Toast success
        } catch (e) {
            console.error("Failed to save context", e);
        } finally {
            setSaving(false);
            setIsOpen(false);
        }
    };



    const updateOutfit = (name: string, desc: string) => {
        if (hasReferenceBoard) return; // Prevent updates if locked
        setOutfits(prev => ({
            ...prev,
            [name.toLowerCase()]: desc
        }));
    };

    if (!episodeId) return null;

    return (
        <div className="border-b border-slate-800 bg-[#13131c]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Settings size={14} className="text-purple-500" />
                    {t('episodeContextSettings')}
                </span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {disabled && (
                        <div className="text-[10px] text-amber-500 bg-amber-900/20 p-2 rounded border border-amber-900/50 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t('generationLocked')}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center text-xs text-slate-500 py-2">{t('loading')}</div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">{t('globalBackgroundInfo')}</label>
                                <textarea
                                    value={bgInfo}
                                    onChange={(e) => setBgInfo(e.target.value)}
                                    placeholder={t('backgroundPlaceholder')}
                                    disabled={loading || saving || disabled}
                                    className="w-full h-20 bg-[#0f0f16] border border-slate-700 rounded p-2 text-xs text-slate-300 focus:border-purple-500 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                    {t('characterOutfits')}
                                    {hasReferenceBoard && (
                                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                            🔒 {t('outfitsLocked') || 'Locked'}
                                        </span>
                                    )}
                                </label>
                                {hasReferenceBoard && (
                                    <div className="text-[10px] text-amber-500 bg-amber-900/20 p-2 rounded border border-amber-900/50 mb-2">
                                        {t('outfitsLockedDesc') || 'Character outfits are locked after image generation. Create a new episode to use different outfits.'}
                                    </div>
                                )}
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                    {characters.map(char => (
                                        <div key={char.id} className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-400 font-bold">{char.name}</span>
                                            <input
                                                value={outfits[char.name.toLowerCase()] || ''}
                                                onChange={(e) => updateOutfit(char.name, e.target.value)}
                                                placeholder={t('outfitPlaceholder', { name: char.name })}
                                                disabled={loading || saving || disabled || hasReferenceBoard}
                                                className={`w-full bg-[#0f0f16] border rounded px-2 py-1 text-xs text-slate-300 focus:border-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${hasReferenceBoard ? 'border-amber-900/50' : 'border-slate-700'}`}
                                            />
                                        </div>
                                    ))}
                                    {characters.length === 0 && <div className="text-xs text-slate-600 italic">{t('noCharactersAvailable')}</div>}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading || saving || disabled}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                {saving ? t('saving') : <><Save size={12} /> {t('saveChanges')}</>}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};


export default function InspectorPanel({ episodeId: propEpisodeId }: { episodeId?: string }) {
    const { 
        activeCutId, 
        activeEpisodeId: storeEpisodeId, 
        updateCut, 
        generatingIdsSet, 
        addGeneratingId, 
        removeGeneratingId, 
        activeEpisodeStatus 
    } = useCanvasStore();
    
    const activeEpisodeId = propEpisodeId || storeEpisodeId;
    // const selectedElement = elements.find(el => el.id === selectedId); // Removed
    const params = useParams();
    const projectId = params?.projectId as string;
    const t = useTranslations('Project.Editor.inspectorPanel');

    const [prompt, setPrompt] = useState('');
    // Track cut status from server to disable regenerate button when cut is generating
    const [cutStatus, setCutStatus] = useState<string | null>(null);
    // Check if this cut is generating (from client-side tracking OR server-side status)
    const isCutGenerating = (activeCutId ? generatingIdsSet.has(activeCutId) : false) || cutStatus === 'generating';
    // Disable generation when episode is in batch generation mode
    const isEpisodeGenerating = activeEpisodeStatus === 'generating';
    // Combined generating state
    const generating = isCutGenerating || isEpisodeGenerating;

    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [appearingCharIds, setAppearingCharIds] = useState<Set<string>>(new Set());
    const [dialogues, setDialogues] = useState<Dialogue[]>([]);
    const [usePreviousContext, setUsePreviousContext] = useState(true);

    const [hasImage, setHasImage] = useState(false);

    // Sync specific to activeCut
    useEffect(() => {
        const fetchCutDetails = async () => {
            if (!activeCutId) return;
            try {
                const res = await api.get(`/cuts/${activeCutId}`);
                const cut = res.data;
                setPrompt(cut.script || '');
                setAspectRatio(cut.aspect_ratio || '1:1');
                setHasImage(!!(cut.image_path || cut.image_url));
                setDialogues(cut.dialogues || []);
                // Track cut status from server
                setCutStatus(cut.status || null);

                // robust handling for both old (string[]) and new ({id, name}[]) formats
                const ids = new Set<string>();
                if (Array.isArray(cut.appearing_characters)) {
                    cut.appearing_characters.forEach((c: any) => {
                        if (typeof c === 'string') {
                            // legacy migration: try to find char by name
                            const found = characters.find(ch => ch.name === c);
                            if (found) ids.add(found.id);
                        } else if (c && c.id) {
                            ids.add(c.id);
                        }
                    });
                }
                setAppearingCharIds(ids);
            } catch (err) {
                console.error("Failed to fetch cut details", err);
            }
        };

        fetchCutDetails();
    }, [activeCutId, characters]); // added characters dependency for legacy mapping

    // Fetch characters
    useEffect(() => {
        const fetchChars = async () => {
            if (!projectId) return;
            try {
                const res = await api.get('/characters', { params: { project_id: projectId } });
                setCharacters(res.data);
            } catch (err) {
                console.error("Failed to fetch characters", err);
            }
        };
        fetchChars();
    }, [projectId]);

    const handlePromptChange = (val: string) => {
        setPrompt(val);
        if (activeCutId) {
            updateCut({ script: val });
        }
    };

    const handleRatioChange = (ratio: string) => {
        setAspectRatio(ratio);
        if (activeCutId) {
            updateCut({ aspect_ratio: ratio });
        }
    };

    const updateDialogues = (newDialogues: Dialogue[]) => {
        setDialogues(newDialogues);
        if (activeCutId) {
            updateCut({ dialogues: newDialogues });
        }
    };

    const updateSingleDialogue = (index: number, field: keyof Dialogue, value: string) => {
        const updated = [...dialogues];
        updated[index] = { ...updated[index], [field]: value };
        updateDialogues(updated);
    };

    const addDialogue = () => {
        updateDialogues([...dialogues, { speaker: 'Unknown', text: '', type: 'speech' }]);
    };

    const removeDialogue = (index: number) => {
        const updated = dialogues.filter((_, i) => i !== index);
        updateDialogues(updated);
    };

    const cycleDialogueType = (index: number) => {
        const types: Dialogue['type'][] = ['speech', 'thought', 'shout'];
        const current = dialogues[index].type || 'speech';
        const next = types[(types.indexOf(current) + 1) % types.length];
        updateSingleDialogue(index, 'type', next);
    };

    const toggleCharById = (charId: string) => {
        setAppearingCharIds(prev => {
            const next = new Set(prev);
            if (next.has(charId)) next.delete(charId);
            else next.add(charId);

            // Sync with backend
            if (activeCutId) {
                // Reconstruct {id, name} objects
                const minimalChars = Array.from(next).map(id => {
                    const char = characters.find(c => c.id === id);
                    return { id, name: char?.name || 'Unknown' };
                });
                updateCut({ appearing_characters: minimalChars });
            }
            return next;
        });
    };

    const handleGenerate = async () => {
        if (!activeEpisodeId || !activeCutId) return;
        try {
            addGeneratingId(activeCutId);
            await api.post(`/episodes/${activeEpisodeId}/cuts/${activeCutId}/generate-image`, {
                prompt_override: prompt || undefined,
                use_previous_context: usePreviousContext
            });
            // StoryboardView poller will handle success and removal of ID

        } catch (err) {
            console.error("Generation failed", err);
            removeGeneratingId(activeCutId);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0f0f16] md:border-l border-slate-800">
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white mb-1">{t('title')}</h2>
                <p className="text-xs text-slate-500">
                    {activeCutId
                        ? t('selected', { id: String(activeCutId).slice(0, 8) })
                        : t('episodeSettings')}
                </p>
            </div>

            {/* Episode Context Settings (Collapsible) - Always Visible */}
            <EpisodeContextEditor
                episodeId={activeEpisodeId}
                projectId={projectId}
                characters={characters}
                disabled={activeEpisodeStatus === 'generating' || activeEpisodeStatus === 'fetching'}
                t={t}
            />

            {activeCutId ? (
                <>
                    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 custom-scrollbar">

                        {/* Prompt Section */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 flex justify-between">
                                <span>{t('imagePrompt')}</span>
                                <span className="text-purple-400 cursor-pointer hover:underline">{t('autoEnhance')}</span>
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => handlePromptChange(e.target.value)}
                                placeholder={t('promptPlaceholder')}
                                className="w-full h-32 bg-[#15151a] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none leading-relaxed placeholder:text-slate-600"
                            />
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">{t('aspectRatio')}</label>
                            <AspectRatioSelector
                                current={aspectRatio}
                                onChange={handleRatioChange}
                            />
                        </div>

                        {/* Character Casting */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 flex justify-between items-center">
                                <span>{t('activeCharacters')}</span>
                                <span className="text-[10px] text-slate-500">{appearingCharIds.size}/{characters.length}</span>
                            </label>
                            <div className="space-y-2">
                                {characters.map(char => (
                                    <div
                                        key={char.id}
                                        onClick={() => toggleCharById(char.id)}
                                        className="flex items-center justify-between p-2 bg-[#13131c] border border-slate-800 rounded-lg hover:border-slate-600 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                                                {char.profile_image_url ? (
                                                    <img src={char.profile_image_url} alt={char.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">{char.name[0]}</div>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-slate-300">{char.name}</span>
                                        </div>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${appearingCharIds.has(char.id) ? 'bg-purple-600 border-purple-500' : 'border-slate-600'}`}>
                                            {appearingCharIds.has(char.id) && <Check size={10} className="text-white" />}
                                        </div>
                                    </div>
                                ))}
                                {characters.length === 0 && <div className="text-xs text-slate-600 italic">{t('noCharacters')}</div>}
                            </div>
                        </div>

                        {/* Dialogues */}
                        <div className="pt-4 border-t border-slate-800">
                            <label className="text-xs font-bold text-slate-400 mb-2 flex justify-between items-center">
                                <span>{t('dialogues')}</span>
                                <button onClick={addDialogue} className="text-purple-400 hover:text-purple-300 p-1 hover:bg-slate-800 rounded">
                                    <Plus size={14} />
                                </button>
                            </label>
                            <div className="space-y-2">
                                {dialogues.map((d, idx) => (
                                    <div key={idx} className="bg-[#13131c] border border-slate-800 rounded-lg p-2 flex gap-2 items-start group hover:border-slate-600 transition-colors">
                                        {/* Type Selector Icon */}
                                        <button
                                            onClick={() => cycleDialogueType(idx)}
                                            title={d.type}
                                            className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded mt-0.5"
                                        >
                                            {d.type === 'thought' ? <Cloud size={14} /> : d.type === 'shout' ? <Megaphone size={14} /> : <MessageSquare size={14} />}
                                        </button>

                                        <div className="flex-1 space-y-1">
                                            <input
                                                value={d.speaker}
                                                onChange={(e) => updateSingleDialogue(idx, 'speaker', e.target.value)}
                                                className="w-full bg-transparent text-[11px] font-bold text-slate-400 focus:text-white outline-none placeholder:text-slate-700"
                                                placeholder={t('speakerPlaceholder')}
                                            />
                                            <textarea
                                                value={d.text}
                                                onChange={(e) => updateSingleDialogue(idx, 'text', e.target.value)}
                                                className="w-full bg-transparent text-xs text-slate-300 focus:text-white outline-none resize-none placeholder:text-slate-600"
                                                rows={2}
                                                placeholder={t('dialoguePlaceholder')}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeDialogue(idx)}
                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {dialogues.length === 0 && <div className="text-xs text-slate-600 italic">{t('noDialogues')}</div>}
                            </div>
                        </div>

                    </div>

                    {/* Action Footer */}
                    <div className="p-4 border-t border-slate-800 bg-[#0f0f16]">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <input
                                type="checkbox"
                                id="usePreviousContext"
                                checked={usePreviousContext}
                                onChange={(e) => setUsePreviousContext(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 accent-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                            />
                            <label htmlFor="usePreviousContext" className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                                {t('referencePreviousCut')}
                            </label>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={`
                   w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
                   ${generating
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                                }
                 `}
                        >
                            {isCutGenerating ? (
                                <>{t('processing')}</>
                            ) : isEpisodeGenerating ? (
                                <>{t('batchInProgress') || '전체 생성 중...'}</>
                            ) : (
                                <>
                                    <Wand2 size={16} fill="currentColor" /> {hasImage ? t('regenerateImage') : t('generateImage')}
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-slate-600 text-center mt-2">
                            {t('cost')}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                    {t('empty')}
                </div>
            )}
        </div>
    );
}
