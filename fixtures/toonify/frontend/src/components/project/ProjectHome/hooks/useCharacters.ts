'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { Character } from '../types';

interface UseCharactersOptions {
  characters: Character[];
  onRefreshCharacters?: () => void;
}

interface UseCharactersReturn {
  selectedCharacter: Character | null;
  setSelectedCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  isCharacterDetailOpen: boolean;
  setIsCharacterDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleCharacterClick: (char: Character) => void;
  handleCharacterRetry: (charId: string) => Promise<void>;
}

export function useCharacters({
  characters,
  onRefreshCharacters,
}: UseCharactersOptions): UseCharactersReturn {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCharacterDetailOpen, setIsCharacterDetailOpen] = useState(false);
  
  const { toast } = useToast();
  const t = useTranslations('Project.Home');

  const handleCharacterClick = useCallback((char: Character) => {
    setSelectedCharacter(char);
    setIsCharacterDetailOpen(true);
  }, []);

  const handleCharacterRetry = useCallback(async (charId: string) => {
    try {
      await api.post(`/characters/${charId}/generate`);
      if (onRefreshCharacters) onRefreshCharacters();
    } catch (e) {
      console.error(e);
      toast({
        title: t('retryFailed'),
        description: t('charRetryFailed'),
        variant: 'destructive',
      });
    }
  }, [onRefreshCharacters, toast, t]);

  // Poll for pending characters
  useEffect(() => {
    const hasPendingChars = characters.some(c => c.sheet_status === 'pending' || c.sheet_status === 'processing');
    let intervalId: NodeJS.Timeout;

    if (hasPendingChars && onRefreshCharacters) {
      intervalId = setInterval(onRefreshCharacters, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [characters, onRefreshCharacters]);

  // Update selected character when list updates (polling)
  useEffect(() => {
    if (selectedCharacter && isCharacterDetailOpen) {
      const upToDateChar = characters.find(c => c.id === selectedCharacter.id || c.name === selectedCharacter.name);
      if (upToDateChar) {
        setSelectedCharacter(upToDateChar);
      }
    }
  }, [characters, selectedCharacter, isCharacterDetailOpen]);

  return {
    selectedCharacter,
    setSelectedCharacter,
    isCharacterDetailOpen,
    setIsCharacterDetailOpen,
    handleCharacterClick,
    handleCharacterRetry,
  };
}
