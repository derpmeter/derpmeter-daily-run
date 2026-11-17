'use client';

import { useState, useCallback } from 'react';

/**
 * A hook for managing modal/dialog open state with optional data.
 * 
 * @example
 * const editModal = useModal<Character>();
 * 
 * // Open modal with data
 * editModal.open(selectedCharacter);
 * 
 * // In the component
 * <Modal isOpen={editModal.isOpen} onClose={editModal.close}>
 *   <CharacterForm data={editModal.data} />
 * </Modal>
 */
export function useModal<T = unknown>(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data to allow for exit animations
    setTimeout(() => setData(null), 300);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}
