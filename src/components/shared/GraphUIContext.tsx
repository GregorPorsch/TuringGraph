// src/components/ConfigGraph/ui/GraphUIContext.tsx
import {
  createContext,
  useContext,
  useState,
  useMemo,
  PropsWithChildren,
} from 'react';

type GraphUIContextValue = {
  // Currently highlighted edge (on hover)
  highlightedEdgeId: string | null;
  setHighlightedEdgeId: (id: string | null) => void;

  // Currently hovered state (on node hover) for legend highlighting
  hoveredState: string | null;
  setHoveredState: (s: string | null) => void;

  // Currently selected element (node or edge)
  selected: {
    type: 'node' | 'edge' | null;
    id: string | null;
    anchor?: { top: number; left: number };
  };
  setSelected: (s: GraphUIContextValue['selected']) => void;
};

const GraphUIContext = createContext<GraphUIContextValue | null>(null);

export function GraphUIProvider({ children }: PropsWithChildren) {
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    type: 'node' | 'edge' | null;
    id: string | null;
    anchor?: { top: number; left: number };
  }>({ type: null, id: null });

  const value = useMemo(
    () => ({
      highlightedEdgeId,
      setHighlightedEdgeId,
      hoveredState,
      setHoveredState,
      selected,
      setSelected,
    }),
    [highlightedEdgeId, hoveredState, selected]
  );

  return <GraphUIContext.Provider value={value}>{children}</GraphUIContext.Provider>;
}

export function useGraphUI() {
  const ctx = useContext(GraphUIContext);
  if (!ctx) throw new Error('useGraphUI must be used within <GraphUIProvider>');
  return ctx;
}
