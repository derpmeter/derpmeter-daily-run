'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { StepName, CharacterData, Archetype } from '../types';

interface UseCharacterWizardOptions {
  projectId: string;
  archetypes: Archetype[];
}

interface UseCharacterWizardReturn {
  // Step State
  step: StepName;
  direction: number;
  
  // Character Data
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  age: string;
  setAge: React.Dispatch<React.SetStateAction<string>>;
  visualKeywords: string[];
  setVisualKeywords: React.Dispatch<React.SetStateAction<string[]>>;
  currentKeyword: string;
  setCurrentKeyword: React.Dispatch<React.SetStateAction<string>>;
  themeColor: string;
  setThemeColor: React.Dispatch<React.SetStateAction<string>>;
  personalityTypes: string[];
  setPersonalityTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedRole: string;
  setSelectedRole: React.Dispatch<React.SetStateAction<string>>;
  roleDescription: string;
  setRoleDescription: React.Dispatch<React.SetStateAction<string>>;
  characterStats: Record<string, number> | null;
  setCharacterStats: React.Dispatch<React.SetStateAction<Record<string, number> | null>>;
  
  // Loading State
  isGenerating: boolean;
  suggestionLoading: string | null;
  error: string | null;
  
  // Handlers
  handleNextStep: (next: StepName) => void;
  handlePrevStep: (prev: StepName) => void;
  handleAddKeyword: () => void;
  handleSuggestion: (type: 'name' | 'visuals' | 'lore') => Promise<void>;
  handleFinalize: () => Promise<void>;
  
  // Helpers
  getStepNumber: (s: StepName) => number;
  currentArchetype: Archetype;
}

export function useCharacterWizard({
  projectId,
  archetypes,
}: UseCharacterWizardOptions): UseCharacterWizardReturn {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('CharacterWizard');
  const locale = useLocale();

  // Step State
  const [step, setStep] = useState<StepName>('concept');
  const [direction, setDirection] = useState(0);

  // Character Data
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [visualKeywords, setVisualKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [themeColor, setThemeColor] = useState<string>('#3b82f6');
  const [personalityTypes, setPersonalityTypes] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('protagonist');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [characterStats, setCharacterStats] = useState<Record<string, number> | null>(null);

  // Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentArchetype = archetypes.find(a => a.id === selectedRole) || archetypes[0];

  // Helpers
  const getStepNumber = useCallback((s: StepName) => {
    switch (s) {
      case 'concept': return 1;
      case 'style': return 2;
      case 'analyzing': return 2;
      case 'role': return 3;
      default: return 1;
    }
  }, []);

  const handleNextStep = useCallback((next: StepName) => {
    setDirection(1);
    setStep(next);
    setError(null);
  }, []);

  const handlePrevStep = useCallback((prev: StepName) => {
    setDirection(-1);
    setStep(prev);
    setError(null);
  }, []);

  const handleAddKeyword = useCallback(() => {
    if (currentKeyword.trim() && !visualKeywords.includes(currentKeyword.trim())) {
      setVisualKeywords(prev => [...prev, currentKeyword.trim()]);
      setCurrentKeyword('');
    }
  }, [currentKeyword, visualKeywords]);

  const handleSuggestion = useCallback(async (type: 'name' | 'visuals' | 'lore') => {
    if (suggestionLoading) return;
    setSuggestionLoading(type);
    try {
      const res = await api.post('/characters/suggest', {
        project_id: projectId,
        type: type,
        current_name: name,
        age: age,
        role: currentArchetype?.title || selectedRole,
        visual_keywords: visualKeywords,
        personality: personalityTypes.join(', '),
        language: locale
      });

      if (type === 'name' && res.data) {
        if (res.data.name) setName(res.data.name);
        if (res.data.age) setAge(res.data.age.toString());
      } else if (type === 'visuals') {
        let newKeywords: string[] = [];
        if (Array.isArray(res.data)) newKeywords = res.data;
        else if (res.data.suggestion && Array.isArray(res.data.suggestion)) newKeywords = res.data.suggestion;
        else if (typeof res.data.suggestion === 'string') {
          try { newKeywords = JSON.parse(res.data.suggestion); } catch (e) { }
        }

        if (newKeywords.length > 0) {
          const unique = newKeywords.filter((k: string) => !visualKeywords.includes(k));
          setVisualKeywords(prev => [...prev, ...unique]);
        }
      } else if (type === 'lore' && res.data.suggestion) {
        setRoleDescription(res.data.suggestion);
      }
    } catch (e) {
      console.error(e);
      toast({ title: t('toasts.suggestionFailed'), description: t('toasts.suggestionFailedDesc'), variant: "destructive" });
    } finally {
      setSuggestionLoading(null);
    }
  }, [projectId, name, age, selectedRole, currentArchetype, visualKeywords, personalityTypes, locale, suggestionLoading, toast, t]);

  // Analyzing Effect
  useEffect(() => {
    if (step === 'analyzing') {
      const analyze = async () => {
        try {
          const res = await api.post('/characters/analyze', {
            project_id: projectId,
            name: name,
            age: age,
            visual_keywords: visualKeywords,
            personality: personalityTypes.join(', '),
            language: locale
          });

          if (res.data) {
            const { recommended_role, lore, stats } = res.data;

            const match = archetypes.find(a => a.title === recommended_role || recommended_role.includes(a.title));
            if (match) {
              setSelectedRole(match.id);
            } else {
              setSelectedRole(archetypes[0].id);
            }

            if (lore) setRoleDescription(lore);
            if (stats) setCharacterStats(stats);
          }
        } catch (e) {
          console.error("Analysis failed", e);
          setSelectedRole(archetypes[0].id);
        } finally {
          handleNextStep('role');
        }
      };
      analyze();
    }
  }, [step, projectId, name, age, visualKeywords, personalityTypes, locale, archetypes, handleNextStep]);

  // Initialize role when entering role step
  useEffect(() => {
    if (step === 'role' && !selectedRole) {
      setSelectedRole(archetypes[0].id);
    }
  }, [step, selectedRole, archetypes]);

  const handleFinalize = useCallback(async () => {
    if (!selectedRole) return;
    setIsGenerating(true);
    setError(null);

    const roleTitle = currentArchetype?.title || selectedRole;
    const descriptionComplete = roleDescription 
      ? `Age: ${age}. Role: ${roleTitle}. Personality: ${personalityTypes.join(', ')}. Visuals: ${visualKeywords.join(', ')}. Lore: ${roleDescription}` 
      : `Age: ${age}. Role: ${roleTitle}. Personality: ${personalityTypes.join(', ')}. Visuals: ${visualKeywords.join(', ')}.`;

    const profileData = {
      age: age,
      role: roleTitle,
      theme_color: themeColor,
      personality_type: personalityTypes.join(', '),
      lore: roleDescription,
      stats: characterStats
    };

    try {
      const charRes = await api.post(`/characters`, {
        name: name,
        project_id: projectId,
        default_mood: personalityTypes.length > 0 ? personalityTypes : ['Neutral'],
        appearance_tags: visualKeywords,
        description: descriptionComplete,
        profile: profileData
      });
      const newCharId = charRes.data.id;

      // Trigger Generation Async
      api.post(`/characters/${newCharId}/generate`, {});

      toast({
        title: t('toasts.createdTitle'),
        description: t('toasts.createdDesc', { name, role: roleTitle }),
      });

      router.push(`/project/${projectId}`);
    } catch (e) {
      console.error("Creation Error", e);
      setError(t('toasts.createFailed'));
      setIsGenerating(false);
    }
  }, [selectedRole, currentArchetype, name, age, visualKeywords, personalityTypes, themeColor, roleDescription, characterStats, projectId, toast, t, router]);

  return {
    step,
    direction,
    name,
    setName,
    age,
    setAge,
    visualKeywords,
    setVisualKeywords,
    currentKeyword,
    setCurrentKeyword,
    themeColor,
    setThemeColor,
    personalityTypes,
    setPersonalityTypes,
    selectedRole,
    setSelectedRole,
    roleDescription,
    setRoleDescription,
    characterStats,
    setCharacterStats,
    isGenerating,
    suggestionLoading,
    error,
    handleNextStep,
    handlePrevStep,
    handleAddKeyword,
    handleSuggestion,
    handleFinalize,
    getStepNumber,
    currentArchetype,
  };
}
