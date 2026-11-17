/**
 * Shared type definitions for CharacterCastingWizard components
 */

export type StepName = 'concept' | 'style' | 'analyzing' | 'role';

export interface CharacterCastingWizardProps {
  projectId: string;
  projectTitle?: string;
  projectGenre?: string;
}

export interface CharacterData {
  name: string;
  age: string;
  visualKeywords: string[];
  currentKeyword: string;
  themeColor: string;
  personalityTypes: string[];
  selectedRole: string;
  roleDescription: string;
  characterStats: Record<string, number> | null;
}

export interface Archetype {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  description: string;
  stats: Record<string, number>;
}

export const THEME_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#B49221', 
  '#8b5cf6', '#252830', '#9ca3af', '#be185d'
] as const;

export const PERSONALITY_TYPES = [
  'Cheerful', 'Serious',
  'Cold', 'Tsundere',
  'Mysterious', 'Melancholic',
  'Pure', 'Madness'
] as const;

export const stepVariants = {
  hidden: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 30 : -30,
    scale: 0.98
  }),
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 }
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir < 0 ? 30 : -30,
    scale: 0.98,
    transition: { duration: 0.2 }
  })
};

