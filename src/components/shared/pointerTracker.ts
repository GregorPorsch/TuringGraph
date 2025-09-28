// src/components/shared/pointerTracker.ts
// Create one single global pointer tracker to track pointer down and dragging state
// across the entire application.
// Components can subscribe to changes in the pointer state.

// Small threshold to avoid treating small pointer movements as dragging
const DRAG_THRESHOLD = 8;
const DRAG_THRESHOLD_SQUARED = DRAG_THRESHOLD * DRAG_THRESHOLD;

// Type representing the current pointer state
export type PointerSnapshot = {
  isPointerDown: boolean;
  isDragging: boolean;
  pointerDownPos: { x: number; y: number } | null;
};

const initialSnapshot: PointerSnapshot = {
  isPointerDown: false,
  isDragging: false,
  pointerDownPos: null,
};

let snapshot: PointerSnapshot = initialSnapshot;
const listeners = new Set<() => void>();

// Whether the global event listeners are currently attached
let attached = false;

// Notify all subscribers of a change in pointer state
const notify = () => {
  listeners.forEach((listener) => listener());
};

// Shallow comparison of two PointerSnapshots
const pointersEqual = (a: PointerSnapshot, b: PointerSnapshot) => {
  if (a.isPointerDown !== b.isPointerDown) return false;
  if (a.isDragging !== b.isDragging) return false;
  const aPos = a.pointerDownPos;
  const bPos = b.pointerDownPos;
  if (!aPos && !bPos) return true;
  if (!aPos || !bPos) return false;
  return aPos.x === bPos.x && aPos.y === bPos.y;
};

// Update the global snapshot and notify listeners if it changed
const setSnapshot = (next: PointerSnapshot) => {
  if (pointersEqual(snapshot, next)) return;
  snapshot = next;
  notify();
};

// --- Global event handlers to track pointer state ---
const handlePointerDown = (event: PointerEvent) => {
  setSnapshot({
    isPointerDown: true,
    isDragging: false,
    pointerDownPos: { x: event.clientX, y: event.clientY },
  });
};

const handlePointerMove = (event: PointerEvent) => {
  if (!snapshot.isPointerDown || snapshot.isDragging || !snapshot.pointerDownPos)
    return;

  const dx = event.clientX - snapshot.pointerDownPos.x;
  const dy = event.clientY - snapshot.pointerDownPos.y;
  if (dx * dx + dy * dy >= DRAG_THRESHOLD_SQUARED) {
    setSnapshot({
      ...snapshot,
      isDragging: true,
    });
  }
};

const resetSnapshot = () => {
  if (pointersEqual(snapshot, initialSnapshot)) return;
  snapshot = initialSnapshot;
  notify();
};

const handlePointerUp = () => {
  resetSnapshot();
};

const handlePointerCancel = () => {
  resetSnapshot();
};

const handleWindowBlur = () => {
  resetSnapshot();
};

// Attach global event listeners
const attach = () => {
  if (attached || typeof window === 'undefined') return;

  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerup', handlePointerUp, { passive: true });
  window.addEventListener('pointercancel', handlePointerCancel, { passive: true });
  window.addEventListener('blur', handleWindowBlur, { passive: true });

  attached = true;
};

// Detach global event listeners
const detach = () => {
  if (!attached || typeof window === 'undefined') return;

  window.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerCancel);
  window.removeEventListener('blur', handleWindowBlur);

  attached = false;
};

// Subscribe to changes in the pointer state
// Returns an unsubscribe function
export function subscribePointerTracker(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1) {
    attach();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      detach();
      snapshot = initialSnapshot;
    }
  };
}

// Get the current pointer state snapshot
export function getPointerSnapshot(): PointerSnapshot {
  return snapshot;
}
