// src/components/ComputationTree/ComputationTree.tsx
import {
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useNodesInitialized,
  MarkerType,
  Panel,
  Background,
  Controls,
  type Node as RFNode,
  type Edge as RFEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Stack,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Box,
  Fab,
} from '@mui/material';
import { Cached, Adjust, ViewAgenda, Tune } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { toast } from 'sonner';

// Components
import { ConfigNode } from '@components/ConfigGraph/nodes/ConfigNode';
import { ConfigCardNode } from '@components/ConfigGraph/nodes/ConfigCardNode';
import { FloatingEdge } from '@components/ConfigGraph/edges/FloatingEdge';
import { LegendPanel } from '@components/shared/LegendPanel';

import {
  NodeType,
  EdgeType,
  CARDS_LIMIT,
  COLOR_STATE_SWITCH,
} from '../ConfigGraph/util/constants';
import type { ComputationTree } from '@tmfunctions/ComputationTree';
import { getComputationTree } from '@tmfunctions/ComputationTree';
import { useGlobalZustand } from '@zustands/GlobalZustand';
import {
  useComputationTreeNodeMode,
  useComputationTreeELKSettings,
  useGraphZustand,
} from '@zustands/GraphZustand';
import { CONTROL_HEIGHT } from './util/constants';
import { buildComputationTreeGraph } from './util/buildComputationTree';
import { ConfigNodeMode } from '@utils/constants';
import { useElkLayout } from './layout/useElkLayout';
import { TreeLayoutSettingsPanel } from './layout/LayoutSettingsPanel';
import { DEFAULT_ELK_OPTS } from '@utils/constants';
import { useDebouncedLayoutRestart } from '@hooks/useDebouncedLayoutRestart';

import { GraphUIProvider, useGraphUI } from '@components/shared/GraphUIContext';
import {
  PORTAL_BRIDGE_SWITCH_EVENT,
  type PortalBridgeSwitchDetail,
} from '@components/MainPage/PortalBridge';
import { reconcileNodes, reconcileEdges } from '@utils/reactflow';

const nodeTypes = {
  [NodeType.CONFIG]: ConfigNode,
  [NodeType.CONFIG_CARD]: ConfigCardNode,
};
const edgeTypes = {
  [EdgeType.FLOATING]: FloatingEdge,
};

const defaultEdgeOptions = {
  type: EdgeType.FLOATING,
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
};

type Props = { depth: number; compressing?: boolean };

export function ComputationTree({ depth, compressing = false }: Props) {
  // Global Zustand state
  const blank = useGlobalZustand((s) => s.blank);
  const transitions = useGlobalZustand((s) => s.transitions);
  const startState = useGlobalZustand((s) => s.startState);
  const stateColorMatching = useGlobalZustand((s) => s.stateColorMatching);

  // Graph Zustand state and setters
  const computationTreeNodeMode = useComputationTreeNodeMode();
  const setComputationTreeNodeMode = useGraphZustand(
    (s) => s.setComputationTreeNodeMode
  );
  const computationTreeELKSettings = useComputationTreeELKSettings();
  const setComputationTreeELKSettings = useGraphZustand(
    (s) => s.setComputationTreeELKSettings
  );

  const { selected, setSelected, hoveredState } = useGraphUI();

  // Base graph structure (nodes/edges) extraction
  // ELK will overwrite positions  const [model, setModel] = useState<ComputationTree | null>(null);
  const [model, setModel] = useState<ComputationTree | null>(null);
  const base = useMemo(() => {
    const tree = getComputationTree(depth, !!compressing);
    setModel(tree);
    return buildComputationTreeGraph(tree, transitions, computationTreeNodeMode);
  }, [depth, computationTreeNodeMode, transitions, blank, startState, compressing]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(base.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(base.edges);

  // ELK Layout Hook (sole positioning engine)
  const layout = useElkLayout({
    algorithm: 'layered',
    nodeSep: computationTreeELKSettings.nodeSep,
    rankSep: computationTreeELKSettings.rankSep,
    edgeSep: computationTreeELKSettings.edgeSep,
    edgeNodeSep: computationTreeELKSettings.edgeNodeSep,
    padding: computationTreeELKSettings.padding,
    direction: computationTreeELKSettings.direction,
  });
  const scheduleLayoutRestart = useDebouncedLayoutRestart(layout);

  // Adjust edgeNodeSep when node mode changes
  useEffect(() => {
    setComputationTreeELKSettings({
      ...computationTreeELKSettings,
      edgeNodeSep: computationTreeNodeMode === ConfigNodeMode.CARDS ? 300 : 100,
    });
  }, [computationTreeNodeMode]);

  // Performance measurement
  const didInitialPaintLog = useRef(false);
  const nodesCountRef = useRef(0);
  const edgesCountRef = useRef(0);

  const nodesReady = useNodesInitialized();
  const didInitialLayoutRef = useRef(false);
  const lastTopoKeyRef = useRef<string | null>(null);
  const fitAfterLayoutRef = useRef(false);
  const prevRunningRef = useRef(layout.running);
  const layoutRunningRef = useRef(layout.running);
  const nodesReadyRef = useRef(nodesReady);
  const manualFitPendingRef = useRef(false);

  useEffect(() => {
    nodesCountRef.current = nodes.length;
  }, [nodes.length]);
  useEffect(() => {
    edgesCountRef.current = edges.length;
  }, [edges.length]);
  useEffect(() => {
    layoutRunningRef.current = layout.running;
  }, [layout.running]);
  useEffect(() => {
    nodesReadyRef.current = nodesReady;
  }, [nodesReady]);

  // Disable cards mode if too many nodes
  const nodeCount = model?.nodes?.length ?? 0;
  const cardsDisabled = nodeCount > CARDS_LIMIT;

  useEffect(() => {
    if (computationTreeNodeMode === ConfigNodeMode.CARDS && cardsDisabled) {
      setComputationTreeNodeMode(ConfigNodeMode.CIRCLES);
      toast.warning(
        `Cards are disabled when there are more than ${CARDS_LIMIT} nodes (current: ${nodeCount}).`
      );
    }
  }, [
    cardsDisabled,
    computationTreeNodeMode,
    nodeCount,
    setComputationTreeNodeMode,
  ]);

  // If too many nodes, hide labels and only show colors
  const hideLabels = nodeCount >= COLOR_STATE_SWITCH;

  // Sync builder output into RF state; keep previous size/data;
  // ELK will set positions afterwards
  useEffect(() => {
    if (!model) return;

    if (!didInitialPaintLog.current && (base.nodes.length || base.edges.length)) {
      didInitialPaintLog.current = true;
    }

    setNodes((prev) =>
      reconcileNodes(prev, base.nodes, (node) => {
        const stateName = (node.data as any)?.label ?? '';
        const mappedColor =
          stateColorMatching.get?.(stateName) ??
          stateColorMatching.get?.(String(stateName)) ??
          undefined;

        return {
          ...(node.data as any),
          showLabel: !hideLabels,
          stateColor: mappedColor,
        };
      })
    );

    setEdges((prev) => reconcileEdges(prev, base.edges));
  }, [
    model,
    base.nodes,
    base.edges,
    hideLabels,
    stateColorMatching,
    setNodes,
    setEdges,
  ]);

  // Auto-Fit handling
  // - on first mount
  // - on first content (nodes/edges) set
  // - on topology change (base.topoKey)
  // - on container resize
  const rf = useReactFlow();

  // Topology key (nodes + edges, undirected)
  const topoKey = useMemo(() => {
    const nIds = nodes
      .map((n) => n.id)
      .sort()
      .join('|');
    const ePairs = Array.from(
      new Set(
        edges
          .filter((e) => e.source !== e.target)
          .map((e) => `${e.source}→${e.target}`)
      )
    )
      .sort()
      .join('|');
    return `${nIds}__${ePairs}`;
  }, [nodes, edges]);

  // On first mount
  useEffect(() => {
    if (!didInitialLayoutRef.current && nodesReady && nodes.length > 0) {
      didInitialLayoutRef.current = true;
      scheduleLayoutRestart();
      fitAfterLayoutRef.current = true;
    }
  }, [nodesReady, nodes.length, scheduleLayoutRestart]);

  // On topology change
  useEffect(() => {
    if (!nodesReady || nodes.length === 0) return;
    if (lastTopoKeyRef.current === null) {
      lastTopoKeyRef.current = topoKey;
      return;
    }
    if (lastTopoKeyRef.current === topoKey) return;
    lastTopoKeyRef.current = topoKey;

    scheduleLayoutRestart();
    fitAfterLayoutRef.current = true;
  }, [topoKey, nodesReady, nodes.length, scheduleLayoutRestart]);

  // On node mode change
  useEffect(() => {
    if (nodes.length === 0) return;
    scheduleLayoutRestart();
    fitAfterLayoutRef.current = true;
  }, [computationTreeNodeMode, scheduleLayoutRestart]);

  // On container resize
  const runFitView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rf.fitView({ padding: 0.2, duration: 0 });
      });
    });
  }, [rf]);

  useEffect(() => {
    const justFinished = prevRunningRef.current && !layout.running;
    if (justFinished) {
      if (fitAfterLayoutRef.current && nodes.length > 0) {
        fitAfterLayoutRef.current = false;
        runFitView();
      }

      if (manualFitPendingRef.current && nodesCountRef.current > 0) {
        manualFitPendingRef.current = false;
        runFitView();
      }
    }

    prevRunningRef.current = layout.running;
  }, [layout.running, nodes.length, runFitView]);

  // Handlers
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePaneClick = useCallback(() => {
    setSelected({ type: null, id: null });
    setSettingsOpen(false);
  }, []);

  const handleNodeClick = useCallback((evt: React.MouseEvent, node: RFNode) => {
    evt.stopPropagation();
    setSelected({
      type: 'node',
      id: node.id,
      anchor: { top: evt.clientY, left: evt.clientX },
    });
  }, []);

  const handleEdgeClick = useCallback((evt: React.MouseEvent, edge: RFEdge) => {
    evt.stopPropagation();
    setSelected({
      type: 'edge',
      id: edge.id,
      anchor: { top: evt.clientY, left: evt.clientX },
    });
  }, []);

  // Re-Layout Button
  const recalcLayout = useCallback(() => {
    scheduleLayoutRestart();
    fitAfterLayoutRef.current = true;
  }, [scheduleLayoutRestart]);

  const scheduleFitAfterSwitch = useCallback(() => {
    if (!nodesReadyRef.current || nodesCountRef.current === 0) return;
    if (layoutRunningRef.current) {
      manualFitPendingRef.current = true;
      return;
    }
    manualFitPendingRef.current = false;
    runFitView();
  }, [runFitView]);

  useEffect(() => {
    const handler: EventListener = (event) => {
      const detail = (event as CustomEvent<PortalBridgeSwitchDetail>).detail;
      if (!detail || detail.id !== 'computationTree') return;
      scheduleFitAfterSwitch();
    };
    window.addEventListener(PORTAL_BRIDGE_SWITCH_EVENT, handler);
    return () => {
      window.removeEventListener(PORTAL_BRIDGE_SWITCH_EVENT, handler);
    };
  }, [scheduleFitAfterSwitch]);

  // Legend (Color -> State) items (sorted for stable rendering)
  const legendItems = useMemo(() => {
    const entries = Array.from(stateColorMatching.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([state, color]) => ({ key: state, color }));
  }, [stateColorMatching]);

  const showLegend =
    (model?.nodes?.length ?? 0) >= COLOR_STATE_SWITCH &&
    computationTreeNodeMode === ConfigNodeMode.CIRCLES;

  return (
    <ReactFlow
      id="ComputationTree"
      style={{ width: '100%', height: '100%', minHeight: 360 }}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onPaneClick={handlePaneClick}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      proOptions={{ hideAttribution: true }}
      minZoom={0.05}
      defaultViewport={{ x: 0, y: 0, zoom: 0.1 }}
      onlyRenderVisibleElements
    >
      {/* Layout settings panel trigger button */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: (t) => t.zIndex.appBar + 1,
          pointerEvents: 'auto',
        }}
      >
        <Tooltip title="Layout settings">
          <Fab
            size="small"
            variant="extended"
            color="primary"
            onClick={() => setSettingsOpen((v) => !v)}
            sx={{
              textTransform: 'none',
              boxShadow: (t) => `0 4px 12px ${alpha(t.palette.common.black, 0.2)}`,
              '& .MuiSvgIcon-root': { mr: 0.75, fontSize: 18 },
              px: 1.5,
              minHeight: 32,
            }}
          >
            <Tune />
            Layout
          </Fab>
        </Tooltip>
      </Box>

      {/* Layout settings panel */}
      <TreeLayoutSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        value={computationTreeELKSettings}
        onChange={(next) => setComputationTreeELKSettings(next)}
        onReset={() => {
          setComputationTreeELKSettings({
            ...DEFAULT_ELK_OPTS,
            edgeNodeSep:
              computationTreeNodeMode === ConfigNodeMode.CARDS ? 300 : 100,
          });
        }}
        onRecalc={recalcLayout}
        running={layout.running}
      />

      {/* Top-left controls panel (recalculate layout and node mode switch) */}
      <Panel position="top-left">
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            onClick={recalcLayout}
            startIcon={<Cached fontSize="small" />}
            disabled={layout.running}
            sx={{
              height: CONTROL_HEIGHT,
              borderRadius: 1.5,
              textTransform: 'none',
              px: 1.25,
            }}
          >
            Recalculate layout
          </Button>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={computationTreeNodeMode}
            onChange={(_, v) => {
              if (!v) return;
              if (v === ConfigNodeMode.CARDS && cardsDisabled) {
                toast.info(
                  `Cards are disabled when there are more than ${CARDS_LIMIT} nodes (current: ${nodeCount}).`
                );
                return;
              }
              setComputationTreeNodeMode(v);
            }}
            aria-label="node rendering mode"
            sx={{
              height: CONTROL_HEIGHT,
              borderRadius: 1.5,
              overflow: 'hidden',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '& .MuiToggleButton-root': {
                height: CONTROL_HEIGHT,
                border: 'none',
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 500,
                px: 1.25,
                py: 0,
                boxShadow: (theme) => `inset 1px 0 0 ${theme.palette.divider}`,
                '&:first-of-type': { boxShadow: 'none' },
              },
              '& .Mui-selected': (theme) => ({
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
              }),
            }}
          >
            <ToggleButton value={ConfigNodeMode.CIRCLES} aria-label="circle nodes">
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Adjust fontSize="small" />
                <span>Circles</span>
              </Stack>
            </ToggleButton>

            {cardsDisabled ? (
              <Tooltip
                title={`Cards are disabled for trees with more than ${CARDS_LIMIT} nodes.`}
                placement="top"
                disableInteractive
              >
                <span>
                  <ToggleButton
                    value={ConfigNodeMode.CARDS}
                    aria-label="card nodes"
                    disabled
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <ViewAgenda fontSize="small" />
                      <span>Cards</span>
                    </Stack>
                  </ToggleButton>
                </span>
              </Tooltip>
            ) : (
              <ToggleButton value={ConfigNodeMode.CARDS} aria-label="card nodes">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <ViewAgenda fontSize="small" />
                  <span>Cards</span>
                </Stack>
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </Stack>
      </Panel>

      {/* Legend panel */}
      <LegendPanel
        items={legendItems}
        visible={showLegend}
        hoveredKey={hoveredState}
        contentClassName="ct-scrollable"
      />

      <Controls />
      <Background gap={10} size={1} />
    </ReactFlow>
  );
}

export function ComputationTreeWrapper({
  depth = 10,
  compressing = false,
}: {
  depth?: number;
  compressing?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <GraphUIProvider>
        <ComputationTree depth={depth} compressing={compressing} />
      </GraphUIProvider>
    </ReactFlowProvider>
  );
}
