'use client';

import { useEffect, useCallback, useRef } from 'react';

type KeyboardHandler = (event: KeyboardEvent) => void;

interface UseKeyboardOptions {
  /** Only trigger when these modifier keys are pressed */
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  /** Prevent default event behavior */
  preventDefault?: boolean;
  /** Stop event propagation */
  stopPropagation?: boolean;
  /** Only listen when this condition is true */
  enabled?: boolean;
  /** Target element (defaults to window) */
  target?: 'window' | 'document';
}

/**
 * A hook for handling keyboard events with a specific key or key combination.
 * 
 * @example
 * // Simple key press
 * useKeyboard('Escape', () => handleClose());
 * 
 * // With modifiers
 * useKeyboard('s', () => handleSave(), { modifiers: { ctrl: true }, preventDefault: true });
 * 
 * // Multiple keys with same handler
 * useKeyboard(['ArrowUp', 'k'], () => navigatePrev());
 */
export function useKeyboard(
  keys: string | string[],
  handler: KeyboardHandler,
  options: UseKeyboardOptions = {}
) {
  const {
    modifiers = {},
    preventDefault = false,
    stopPropagation = false,
    enabled = true,
    target = 'window',
  } = options;

  const handlerRef = useRef(handler);

  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const keyList = Array.isArray(keys) ? keys : [keys];
    
    // Check if the pressed key matches
    const keyMatches = keyList.some(key => 
      event.key === key || event.code === key
    );
    
    if (!keyMatches) return;

    // Check modifier keys
    if (modifiers.ctrl && !event.ctrlKey) return;
    if (modifiers.shift && !event.shiftKey) return;
    if (modifiers.alt && !event.altKey) return;
    if (modifiers.meta && !event.metaKey) return;

    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();

    handlerRef.current(event);
  }, [keys, modifiers, preventDefault, stopPropagation, enabled]);

  useEffect(() => {
    const targetElement = target === 'document' ? document : window;
    
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

/**
 * A hook for handling navigation with arrow keys or vim-style keys (j/k).
 * 
 * @example
 * const { currentIndex, setCurrentIndex } = useKeyboardNavigation({
 *   itemCount: items.length,
 *   onNavigate: (index) => scrollToItem(index),
 * });
 */
export function useKeyboardNavigation({
  itemCount,
  initialIndex = -1,
  onNavigate,
  enabled = true,
  wrap = true,
}: {
  itemCount: number;
  initialIndex?: number;
  onNavigate?: (index: number) => void;
  enabled?: boolean;
  wrap?: boolean;
}) {
  const indexRef = useRef(initialIndex);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (itemCount === 0) return;

    let newIndex = indexRef.current;

    if (direction === 'prev') {
      newIndex = newIndex <= 0 ? (wrap ? itemCount - 1 : 0) : newIndex - 1;
    } else {
      newIndex = newIndex >= itemCount - 1 ? (wrap ? 0 : itemCount - 1) : newIndex + 1;
    }

    indexRef.current = newIndex;
    onNavigate?.(newIndex);
  }, [itemCount, wrap, onNavigate]);

  useKeyboard(['ArrowUp', 'k'], () => navigate('prev'), { 
    enabled, 
    preventDefault: true 
  });
  
  useKeyboard(['ArrowDown', 'j'], () => navigate('next'), { 
    enabled, 
    preventDefault: true 
  });

  const setCurrentIndex = useCallback((index: number) => {
    indexRef.current = index;
  }, []);

  return {
    currentIndex: indexRef.current,
    setCurrentIndex,
    navigatePrev: () => navigate('prev'),
    navigateNext: () => navigate('next'),
  };
}
