// src/components/ConfigGraph/ConfigVisualization/useSyncedHorizontalScroll.ts
import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Manages synchronized horizontal scrolling across multiple viewports
 */
export function useSyncedHorizontalScroll(options?: { thumbMinWidth?: number }) {
  const { thumbMinWidth = 24 } = options ?? {};

  // Viewports (one per tape)
  const tapeViewportRefs = useRef<Array<HTMLDivElement | null>>([]);
  const setViewportRef = (i: number) => (el: HTMLDivElement | null) => {
    tapeViewportRefs.current[i] = el;
    if (el) {
      el.dataset.ctInteractive = 'true';
      el.classList.add('ct-scrollable');
    }
  };

  // Custom scrollbar pieces
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Visual state
  const [hasOverflow, setHasOverflow] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [thumb, setThumb] = useState({ width: 0, left: 0 });
  const [dragging, setDragging] = useState(false);

  // Internal guards & drag state
  const isSyncingRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; left: number }>({ x: 0, left: 0 });

  // Keep a ref of the latest thumb state so drag handlers don't capture stale closures
  const thumbStateRef = useRef(thumb);
  useEffect(() => {
    thumbStateRef.current = thumb;
  }, [thumb]);

  // Helper: first available viewport is the "master"
  const getMaster = useCallback(
    () => tapeViewportRefs.current.find((el) => !!el) ?? null,
    []
  );

  // Recompute thumb (size/position) from master viewport
  const updateThumb = useCallback(() => {
    const el = getMaster();
    const track = trackRef.current;
    if (!el || !track) return;

    const trackWidth = Math.max(0, track.clientWidth);
    const scrollW = el.scrollWidth;
    const clientW = el.clientWidth;

    const overflow = scrollW > clientW + 1;
    setHasOverflow(overflow);

    if (!overflow) {
      setThumb({ width: 0, left: 0 });
      return;
    }

    const ratio = clientW / scrollW;
    const width = Math.max(thumbMinWidth, Math.round(trackWidth * ratio));
    const maxLeft = Math.max(0, trackWidth - width);
    const left = maxLeft * (el.scrollLeft / Math.max(1, scrollW - clientW));
    setThumb({ width, left });
  }, [getMaster, thumbMinWidth]);

  // Sync all viewports to a given scrollLeft
  const syncAllScrollLeft = useCallback((left: number) => {
    isSyncingRef.current = true;
    for (const el of tapeViewportRefs.current) {
      if (el) el.scrollLeft = left;
    }
    isSyncingRef.current = false;
  }, []);

  // Scroll handler for each viewport; pass the source to avoid ping-pong
  const onViewportScroll = useCallback(
    (srcEl: HTMLDivElement | null) => {
      if (!srcEl) return;
      if (isSyncingRef.current) return;

      const left = srcEl.scrollLeft;

      isSyncingRef.current = true;
      for (const el of tapeViewportRefs.current) {
        if (el && el !== srcEl) el.scrollLeft = left;
      }
      isSyncingRef.current = false;

      updateThumb();
    },
    [updateThumb]
  );

  // Clicking the track jumps proportionally
  const handleTrackMouseDown = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    (e) => {
      e.stopPropagation();

      if (e.target === thumbRef.current) return;

      const master = getMaster();
      const track = trackRef.current;
      if (!master || !track) return;

      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = thumb.width;
      const maxLeft = Math.max(0, track.clientWidth - width);
      const newLeft = Math.min(maxLeft, Math.max(0, clickX - width / 2));

      const scrollMax = Math.max(1, master.scrollWidth - master.clientWidth);
      const scrollLeft = (newLeft / Math.max(1, maxLeft)) * scrollMax;
      syncAllScrollLeft(scrollLeft);
      updateThumb();
    },
    [getMaster, syncAllScrollLeft, updateThumb, thumb.width]
  );

  // Drag the thumb to scroll
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const master = getMaster();
      const track = trackRef.current;
      if (!master || !track) return;

      const dx = e.clientX - dragStartRef.current.x;
      const trackWidth = track.clientWidth;
      const width = thumbStateRef.current.width;
      const maxLeft = Math.max(0, trackWidth - width);
      const newLeft = Math.min(maxLeft, Math.max(0, dragStartRef.current.left + dx));

      const scrollMax = Math.max(1, master.scrollWidth - master.clientWidth);
      const scrollLeft = (newLeft / Math.max(1, maxLeft)) * scrollMax;
      syncAllScrollLeft(scrollLeft);
      updateThumb();
    };

    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        setDragging(false);
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
    };

    const onDown = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      draggingRef.current = true;
      setDragging(true);
      dragStartRef.current = { x: e.clientX, left: thumbStateRef.current.left };
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const el = thumbRef.current;
    if (el) el.addEventListener('mousedown', onDown);
    return () => {
      if (el) el.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [getMaster, syncAllScrollLeft, updateThumb]);

  // Attach "guard" listeners to each viewport: stop drag/zoom bubbling inside tape areas
  useEffect(() => {
    const viewports = tapeViewportRefs.current.filter(Boolean) as HTMLDivElement[];

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    const onMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
    };
    const onTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
    };

    for (const vp of viewports) {
      vp.addEventListener('wheel', onWheel, { passive: true });
      vp.addEventListener('mousedown', onMouseDown);
      vp.addEventListener('touchstart', onTouchStart, { passive: true });
      (vp.style as any).touchAction = 'pan-x';
    }

    return () => {
      for (const vp of viewports) {
        vp.removeEventListener('wheel', onWheel as any);
        vp.removeEventListener('mousedown', onMouseDown as any);
        vp.removeEventListener('touchstart', onTouchStart as any);
      }
    };
  }, []);

  // Observe master viewport + track for size changes
  useEffect(() => {
    const master = getMaster();
    if (!master) return;

    const onScroll = () => onViewportScroll(master);
    master.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateThumb());
    ro.observe(master);
    if (trackRef.current) ro.observe(trackRef.current);

    updateThumb();

    return () => {
      master.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [getMaster, onViewportScroll, updateThumb]);

  // Public helper: center all viewports to a specific scrollLeft
  const centerAllTo = useCallback(
    (left: number) => {
      syncAllScrollLeft(left);
      updateThumb();
    },
    [syncAllScrollLeft, updateThumb]
  );

  return {
    // Refs
    tapeViewportRefs,
    setViewportRef,
    trackRef,
    thumbRef,

    // Visual state
    hasOverflow,
    hovered,
    setHovered,
    thumb,
    dragging,

    // Handlers
    onViewportScroll,
    handleTrackMouseDown,

    // Helpers
    getMaster,
    updateThumb,
    syncAllScrollLeft,
    centerAllTo,
  };
}
