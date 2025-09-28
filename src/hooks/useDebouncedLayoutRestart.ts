// src/hooks/useDebouncedLayoutRestart.ts
import { useCallback, useEffect, useRef } from 'react';

type LayoutApi = {
  restart: () => void;
};

// Debounce layout restarts so ELK only runs once per animation frame.
export function useDebouncedLayoutRestart(layout: LayoutApi) {
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef(layout);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      frameRef.current = null;
      timeoutRef.current = null;
    };
  }, []);

  return useCallback(() => {
    if (frameRef.current !== null || timeoutRef.current !== null) return;

    if (typeof requestAnimationFrame === 'function') {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        layoutRef.current.restart();
      });
    } else {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        layoutRef.current.restart();
      }, 0);
    }
  }, []);
}
