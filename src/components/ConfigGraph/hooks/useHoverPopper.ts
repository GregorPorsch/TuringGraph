// src/components/ConfigGraph/hooks/useHoverPopper.ts
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { VirtualElement } from '@popperjs/core';

import { HOVER_POPPER_DELAY_MS } from '@utils/constants';

import {
  getPointerSnapshot,
  subscribePointerTracker,
  type PointerSnapshot,
} from '@components/shared/pointerTracker';

/**
 * Custom hook to manage hover state and popper anchor
 * for configuration nodes.
 */
export function useHoverPopper(delayMs = HOVER_POPPER_DELAY_MS, selected = false) {
  // Is the mouse currently hovering over the element
  const [hovering, setHovering] = useState(false);
  // Whether the popper should be open (after delay or if selected)
  const [delayedOpen, setDelayedOpen] = useState(false);
  // Position of the anchor (follows mouse)
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number } | null>(
    null
  );

  // Ref to store timer ID for delayed opening
  const timerRef = useRef<number | null>(null);
  // Ref to store the latest pointer state
  const pointerStateRef = useRef<PointerSnapshot>(getPointerSnapshot());

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    setHovering(false);
    setDelayedOpen(false);
    setAnchorPos(null);
    clearTimer();
  }, [clearTimer]);

  // Subscribe to pointer tracker to monitor dragging state
  useEffect(() => {
    pointerStateRef.current = getPointerSnapshot();

    const unsubscribe = subscribePointerTracker(() => {
      const prev = pointerStateRef.current;
      const next = getPointerSnapshot();

      // If dragging started, close the popper
      if (!prev.isDragging && next.isDragging) {
        close();
      }

      pointerStateRef.current = next;
    });

    return () => {
      pointerStateRef.current = getPointerSnapshot();
      unsubscribe();
    };
  }, [close]);

  const getPointerState = useCallback(() => pointerStateRef.current, []);

  const onMouseEnter = useCallback(
    (evt: React.MouseEvent) => {
      if (selected) return;
      if (getPointerState().isDragging) return;

      setHovering(true);
      setAnchorPos({ top: evt.clientY, left: evt.clientX });

      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setDelayedOpen(true);
        timerRef.current = null;
      }, delayMs);
    },
    [selected, getPointerState, clearTimer, delayMs]
  );

  const onMouseMove = useCallback(
    (evt: React.MouseEvent) => {
      if (getPointerState().isDragging) {
        close();
        return;
      }
      if (hovering && !selected) {
        setAnchorPos({ top: evt.clientY + 8, left: evt.clientX + 8 });
      }
    },
    [getPointerState, close, hovering, selected]
  );

  const onMouseLeave = useCallback(() => {
    setHovering(false);

    if (!selected) {
      setDelayedOpen(false);
      setAnchorPos(null);
      clearTimer();
    }
  }, [selected, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (selected) setDelayedOpen(true);
    else setDelayedOpen(false);
  }, [selected]);

  const virtualAnchor = useMemo<VirtualElement>(() => {
    const top = anchorPos?.top ?? 0;
    const left = anchorPos?.left ?? 0;

    return {
      getBoundingClientRect: () =>
        ({
          width: 0,
          height: 0,
          x: left,
          y: top,
          top,
          left,
          right: left,
          bottom: top,
          toJSON: () => {},
        }) as DOMRect,
    };
  }, [anchorPos]);

  const currentPointerState = pointerStateRef.current;
  const open =
    (selected || (delayedOpen && !currentPointerState.isDragging)) && !!anchorPos;

  return {
    hovering,
    open,
    virtualAnchor,
    anchorPos,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    setAnchorPos,
    close,
  };
}
