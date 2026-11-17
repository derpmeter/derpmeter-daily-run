'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronRight, ChevronLeft,
  Type, Hash, Sparkles, Check, X,
  Ghost, Heart, Sword, Skull, Smile, Monitor, Clock,
  Wand2, RefreshCw, Clapperboard, Camera
} from 'lucide-react';
import api from '@/lib/api';
import { AiSuggestionCard } from '@/components/project/AiSuggestionCard';
import { useTranslations, useLocale } from 'next-intl';
import { ProcessingOverlay } from "@/components/ui/processing-overlay";
import { CustomLoader } from '@/components/ui/custom-loader';

const GENRES = [
  { id: 'fantasy', label: 'Fantasy', icon: Sparkles, color: 'bg-amber-600' },
  { id: 'romance', label: 'Romance', icon: Heart, color: 'bg-pink-600' },
  { id: 'sciFi', label: 'Sci-Fi', icon: Monitor, color: 'bg-cyan-600' },
  { id: 'sliceOfLife', label: 'Slice of Life', icon: BookOpen, color: 'bg-orange-500' },
  { id: 'action', label: 'Action', icon: Sword, color: 'bg-red-600' },
  { id: 'thriller', label: 'Thriller', icon: Skull, color: 'bg-purple-600' },
  { id: 'historical', label: 'Historical', icon: Clock, color: 'bg-stone-600' },
  { id: 'comedy', label: 'Comedy', icon: Smile, color: 'bg-yellow-500' },
  { id: 'mystery', label: 'Mystery', icon: Ghost, color: 'bg-indigo-600' },
  { id: 'horror', label: 'Horror', icon: Ghost, color: 'bg-slate-700' },
  { id: 'variety', label: 'Variety', icon: Clapperboard, color: 'bg-green-500' },
  { id: 'documentary', label: 'Documentary', icon: Camera, color: 'bg-zinc-600' },
];

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  const t = useTranslations('NewProject');
  const steps = [t('steps.title'), t('steps.subtitle'), t('steps.genre'), t('steps.world')];

  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -z-0 -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-[2px] bg-purple-600 -z-0 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((label, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 mb-2 ${idx <= currentStep
                ? 'bg-purple-600 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)] scale-110'
                : 'bg-slate-900 border-slate-700'
                }`}
            />
            <span className={`text-[10px] font-mono font-bold tracking-wider absolute top-6 whitespace-nowrap ${idx <= currentStep ? 'text-white' : 'text-slate-600'
              }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function NewProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('NewProject');
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const locale = useLocale();

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [worldDesc, setWorldDesc] = useState<string | any>('');
  // Language follows user's locale setting automatically

  // Genre Database State
  const [genreMap, setGenreMap] = useState<Record<string, string>>({});

  // AI State
  const [showAiResults, setShowAiResults] = useState(false);
  const [augmentOptions, setAugmentOptions] = useState<any[]>([]);
  const [currentAiIndex, setCurrentAiIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Genres from DB
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/genres');
        const map: Record<string, string> = {};
        res.data.forEach((g: any) => {
          map[g.name.toLowerCase().replace(/\s/g, '')] = g.id;
        });
        setGenreMap(map);
      } catch (err) {
        console.error('Failed to fetch genres', err);
      }
    };
    fetchGenres();
  }, []);

  // Local Storage Logic: Load Draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('toontune_project_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Only restore if valid data exists
        if (parsed.title) setTitle(parsed.title);
        if (parsed.subtitle) setSubtitle(parsed.subtitle);
        if (parsed.selectedGenres) setSelectedGenres(parsed.selectedGenres);
        if (parsed.worldDesc) setWorldDesc(parsed.worldDesc);
        // Language now follows user locale, no need to restore
        if (typeof parsed.step === 'number') setStep(parsed.step);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Local Storage Logic: Save Draft
  useEffect(() => {
    // Debounce or just save on every change (simple for now)
    // Don't save if empty to avoid overwriting with empty state initially if not careful, 
    // but the initial state is empty so it's fine.
    // We only save if there is at least SOME data to save to avoid clearing a valid draft with a fresh reload race condition
    if (title || subtitle || selectedGenres.length > 0 || worldDesc) {
      const draftData = {
        step,
        title,
        subtitle,
        selectedGenres,
        worldDesc,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('toontune_project_draft', JSON.stringify(draftData));
    }
  }, [step, title, subtitle, selectedGenres, worldDesc]);


  // Handlers
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      createProject();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else {
      router.push('/dashboard');
    }
  };

  const handleExit = () => {
    router.push('/dashboard');
  };

  const toggleGenre = (label: string) => {
    if (isProcessing || aiLoading || showAiResults) return; // Locking
    if (selectedGenres.includes(label)) {
      setSelectedGenres(selectedGenres.filter(g => g !== label));
    } else {
      if (selectedGenres.length < 3) {
        setSelectedGenres([...selectedGenres, label]);
      }
    }
  };

  // AI Logic
  const handleAugmentWorldview = async () => {
    if (isProcessing || aiLoading || showAiResults) return; // Locking
    setAiLoading(true);
    setError('');
    // Clear previous options
    setAugmentOptions([]);
    setCurrentAiIndex(0);

    try {
      const desc = typeof worldDesc === 'string' ? worldDesc : worldDesc.content || JSON.stringify(worldDesc);

      const response = await api.post('/projects/worldview/augment', {
        description: desc,
        title: title,
        subtitle: subtitle,
        genres: selectedGenres,
        language: locale
      });

      if (response.data.options && response.data.options.length > 0) {
        setAugmentOptions(response.data.options);
        setShowAiResults(true);
      } else if (response.data.augmented_worldview) {
        // Fallback for single response
        setWorldDesc(response.data.augmented_worldview);
      } else {
        setError(t('errors.noSuggestions'));
      }

    } catch (error: any) {
      console.error("Augmentation failed", error);
      setError(t('errors.augmentFailed'));
    } finally {
      setAiLoading(false);
    }
  };

  const createProject = async (overrideData?: any) => {
    setIsProcessing(true);
    setError('');

    // Use override data or state data
    const dataTitle = overrideData?.title || title;
    const dataSubtitle = overrideData?.subtitle || subtitle;
    const dataGenre = overrideData?.genre || selectedGenres;
    const dataWorldview = overrideData?.worldview || worldDesc;

    try {
      let finalWorldview: any = dataWorldview;
      // Ensure format
      if (typeof dataWorldview === 'string') {
        finalWorldview = {
          title: dataTitle + " World",
          content: dataWorldview,
          tone: "General",
          key_features: []
        };
      } else if (typeof dataWorldview === 'object' && dataWorldview !== null) {
        finalWorldview = dataWorldview;
      }

      // Map genre labels to IDs
      const genreIds = dataGenre.map((genreLabel: string) => genreMap[genreLabel]).filter(Boolean);

      const response = await api.post('/projects', {
        title: dataTitle,
        subtitle: dataSubtitle,
        genre_ids: genreIds, // Send genre IDs array
        worldview: finalWorldview,
        style_preset: searchParams.get('style_preset') || "anime_webtoon", // Use param or default
        language: locale
      });

      // Clear Draft on Success
      localStorage.removeItem('toontune_project_draft');

      const projectId = response.data.id;
      router.push(`/project/${projectId}?setup=true`);
    } catch (err: any) {
      console.error("Failed to create project", err);
      const msg = err.response?.data?.detail
        ? (typeof err.response.data.detail === 'object' ? JSON.stringify(err.response.data.detail) : err.response.data.detail)
        : err.message;
      setError(`${t('errors.createFailed')}${msg}`);
      setIsProcessing(false); // Only unset processing if error, otherwise we are navigating
    }
  };

  const handleAiSelect = async (suggestion: any) => {
    // Logic: Update state AND instantly create project
    const desc = suggestion.content || suggestion.description || "";
    setWorldDesc(desc);
    let newTitle = title;
    if (suggestion.title && (!title || title.length < 3)) {
      newTitle = suggestion.title;
      setTitle(newTitle);
    }
    setShowAiResults(false);

    await createProject({
      title: newTitle,
      subtitle: subtitle,
      genre: selectedGenres,
      worldview: desc, // Pass simple string, createProject normalizes it
      language: locale
    });
  };

  const handleAiPrev = () => {
    setCurrentAiIndex(prev => (prev === 0 ? augmentOptions.length - 1 : prev - 1));
  };

  const handleAiNext = () => {
    setCurrentAiIndex(prev => (prev === augmentOptions.length - 1 ? 0 : prev + 1));
  };

  // Mapping for AiSuggestionCard
  const currentSuggestion = augmentOptions[currentAiIndex];
  const mappedSuggestion = currentSuggestion ? {
    id: currentAiIndex,
    title: currentSuggestion.title,
    tagline: currentSuggestion.tone || "AI GENERATED",
    logline: currentSuggestion.description || "No summary available.",
    tags: currentSuggestion.key_features || [],
    description: currentSuggestion.content || currentSuggestion.description || "",
    accentColor: "purple"
  } : null;

  // UI Locking State
  const isLocked = isProcessing || aiLoading || showAiResults;
  // Language selection UI removed - follows user locale automatically


  return (
    <div className="min-h-screen w-full bg-[#05050a] text-slate-200 font-sans flex flex-col items-center justify-center p-6 relative selection:bg-purple-500/30 overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px]" />

      {/* Header */}
      <div className="absolute top-8 left-8 z-20">
        <button
          onClick={handleExit}
          disabled={isLocked}
          className={`flex items-center gap-2 transition-colors ${isLocked ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">{t('backToDashboard')}</span>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-3xl flex flex-col items-center relative z-10">

        {/* Dynamic Header Text */}
        {!showAiResults && (
          <div className={`text-center mb-8 animate-fade-in-up ${isLocked ? 'opacity-50 blur-sm duration-500' : ''}`}>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              {step === 0 && t('headers.title')}
              {step === 1 && t('headers.subtitle')}
              {step === 2 && t('headers.genre')}
              {step === 3 && t('headers.world')}
            </h1>
            <p className="text-slate-500 text-lg">
              {step === 0 && t('descriptions.title')}
              {step === 1 && t('descriptions.subtitle')}
              {step === 2 && t('descriptions.genre')}
              {step === 3 && t('descriptions.world')}
            </p>
          </div>
        )}

        {/* AI Suggestions Overlay Mode */}
        {showAiResults && mappedSuggestion ? (
          <div className="w-full animate-fade-in-up my-10 relative z-50">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-sm font-bold text-purple-400 tracking-wider uppercase">{t('aiSuggestions')}</h2>
              <button onClick={() => setShowAiResults(false)} className="text-xs text-slate-500 hover:text-white">{t('dismiss')}</button>
            </div>
            <AiSuggestionCard
              suggestion={mappedSuggestion}
              index={currentAiIndex}
              total={augmentOptions.length}
              onNext={handleAiNext}
              onPrev={handleAiPrev}
              onSelect={handleAiSelect}
              onDismiss={() => setShowAiResults(false)}
            />
          </div>
        ) : (
          /* Standard Wizard Card */
          <div className={`w-full bg-[#0f0f16] border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col transition-all duration-300 ${isLocked ? 'opacity-50 grayscale-[0.5] pointer-events-none' : ''}`}>

            <ProgressBar currentStep={step} />

            {/* Content Area */}
            <div className="flex-1 flex flex-col justify-start pt-16 mb-8 animate-fade-in">

              {/* Step 0: Title */}
              {step === 0 && (
                <div className="space-y-4">
                  <label className="text-xs font-mono font-bold text-slate-500 ml-1 uppercase">{t('inputs.titleLabel')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('inputs.titlePlaceholder')}
                      disabled={isLocked}
                      className="w-full bg-transparent border-2 border-slate-700 rounded-xl px-6 py-5 text-2xl font-bold text-white placeholder-slate-700 focus:border-purple-500 outline-none transition-all group-hover:border-slate-600 disabled:opacity-50"
                      autoFocus
                      data-testid="project-title-input"
                      onKeyDown={(e) => e.key === 'Enter' && title && handleNext()}
                    />
                    <Type className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600" />
                  </div>
                </div>
              )}

              {/* Step 1: Subtitle */}
              {step === 1 && (
                <div className="space-y-4">
                  <label className="text-xs font-mono font-bold text-slate-500 ml-1 uppercase">{t('inputs.subtitleLabel')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder={t('inputs.subtitlePlaceholder')}
                      disabled={isLocked}
                      className="w-full bg-transparent border-2 border-slate-700 rounded-xl px-6 py-5 text-xl font-medium text-white placeholder-slate-700 focus:border-purple-500 outline-none transition-all group-hover:border-slate-600 disabled:opacity-50"
                      autoFocus
                      data-testid="project-subtitle-input"
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    />
                    <Hash className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600" />
                  </div>
                </div>
              )}

              {/* Step 2: Genre */}
              {step === 2 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.id)}
                        disabled={isLocked}
                        data-testid={`genre-select-${genre.id}`}
                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 group relative overflow-hidden ${isSelected
                          ? 'bg-purple-900/20 border-purple-500'
                          : 'bg-slate-900/30 border-slate-800 hover:border-slate-600'
                          } ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                          }`}>
                          <genre.icon size={16} />
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {t(`genres.${genre.id}`)}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 3: Worldview */}
              {step === 3 && (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono font-bold text-slate-500 ml-1 uppercase">{t('inputs.worldLabel')}</label>
                    <button
                      onClick={handleAugmentWorldview}
                      disabled={aiLoading || isLocked}
                      className={`
                                text-xs font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full border 
                                ${aiLoading
                          ? 'bg-purple-900/50 border-purple-500/50 text-purple-300 cursor-wait'
                          : 'bg-purple-900/30 border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:border-purple-500 hover:text-white'
                        }
                                ${isLocked && !aiLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                    >
                      {aiLoading ? (
                        <CustomLoader size={12} />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      {aiLoading ? t('buttons.generating') : t('buttons.aiAugment')}
                    </button>
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      value={typeof worldDesc === 'string' ? worldDesc : (worldDesc.content || JSON.stringify(worldDesc))}
                      onChange={(e) => setWorldDesc(e.target.value)}
                      placeholder={t('inputs.worldPlaceholder')}
                      disabled={isLocked}
                      className="w-full h-40 bg-slate-900/30 border-2 border-slate-700 rounded-xl p-5 text-base text-white placeholder-slate-700 focus:border-purple-500 outline-none resize-none transition-all leading-relaxed disabled:opacity-50"
                      autoFocus
                      data-testid="worldview-input"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-xs mt-2">{error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={step === 0 || isLocked}
                className={`
                    px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2
                    ${step === 0 || isLocked
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <ArrowLeft size={18} /> {t('buttons.back')}
              </button>

              <button
                onClick={handleNext}
                disabled={
                  (step === 0 && !title) ||
                  (step === 2 && selectedGenres.length === 0) ||
                  isLocked
                }
                data-testid="wizard-next-button"
                className={`
                    px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all
                    ${(step === 0 && !title) || (step === 2 && selectedGenres.length === 0) || isLocked
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30 hover:translate-y-[-1px]'
                  }
                `}
              >
                {isProcessing ? (
                  <>{t('buttons.processing')}</>
                ) : step === 3 ? (
                  <>{t('buttons.createProject')} <Check size={18} /></>
                ) : (
                  <>{t('buttons.next')} <ArrowRight size={18} /></>
                )}
              </button>
            </div>

          </div>
        )
        }
        <ProcessingOverlay
          isVisible={isProcessing}
          title={t('buttons.processing')}
        />
        <ProcessingOverlay
          isVisible={aiLoading}
          title={t('buttons.generating')}
          description={t('inputs.worldLabel')}
        />
      </div >

      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div >
  );
}
