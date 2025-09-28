// src/components/TMGraph/edges/useEdgeHoverPopper.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VirtualElement } from '@popperjs/core';

import {
  getPointerSnapshot,
  subscribePointerTracker,
  type PointerSnapshot,
} from '@components/shared/pointerTracker';
import { HOVER_POPPER_DELAY_MS } from '@utils/constants';

/**
 * Hover popper with optional "lock" mode for selection.
 * - hovering flips to true immediately on mouse enter (for instant highlight).
 * - open is delayed to show the popper after delayMs.
 * - When lock is true, the popper stays open and ignores mouseleave.
 * - When lock flips back to false, we actively close AND clear hover.
 */
export function useEdgeHoverPopper(delayMs = HOVER_POPPER_DELAY_MS, lock = false) {
  const [hovering, setHovering] = useState(false);
  const [open, setOpen] = useState(false);
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number } | null>(
    null
  );

  const timerRef = useRef<number | null>(null);
  const pointerStateRef = useRef<PointerSnapshot>(getPointerSnapshot());

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    pointerStateRef.current = getPointerSnapshot();

    const unsubscribe = subscribePointerTracker(() => {
      const prev = pointerStateRef.current;
      const next = getPointerSnapshot();

      if (!lock && !prev.isDragging && next.isDragging) {
        clearTimer();
        setHovering(false);
        setOpen(false);
        setAnchorPos(null);
      }

      pointerStateRef.current = next;
    });

    return () => {
      pointerStateRef.current = getPointerSnapshot();
      unsubscribe();
    };
  }, [lock, clearTimer]);

  const getPointerState = useCallback(() => pointerStateRef.current, []);

  const onMouseEnter = useCallback(
    (evt: React.MouseEvent<SVGPathElement, MouseEvent>) => {
      if (lock) return;
      if (getPointerState().isDragging) return;

      const { clientX, clientY } = evt;
      setHovering(true);
      clearTimer();

      const run = () => {
        setOpen(true);
        setAnchorPos({ top: clientY, left: clientX });
      };

      if (delayMs > 0) {
        timerRef.current = window.setTimeout(run, delayMs);
      } else {
        run();
      }
    },
    [lock, getPointerState, clearTimer, delayMs]
  );

  const onMouseMove = useCallback(
    (evt: React.MouseEvent<SVGPathElement, MouseEvent>) => {
      if (lock) return;
      if (getPointerState().isDragging) return;
      if (!hovering) setHovering(true);

      setAnchorPos({ top: evt.clientY + 8, left: evt.clientX + 8 });
    },
    [lock, getPointerState, hovering]
  );

  const onMouseLeave = useCallback(() => {
    if (lock) return;
    clearTimer();
    setHovering(false);
    setOpen(false);
    setAnchorPos(null);
  }, [lock, clearTimer]);

  useEffect(() => {
    if (lock) {
      setOpen(true);
      return;
    }

    clearTimer();
    setOpen(false);
    setHovering(false);
    setAnchorPos(null);
  }, [lock, clearTimer]);

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

  return {
    hovering,
    open,
    anchorPos,
    virtualAnchor,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    setAnchorPos,
  };
}
