import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  forceRadial,
  SimulationNodeDatum,
  SimulationLinkDatum,
  Simulation,
} from 'd3-force';
import {
  Node as RFNode,
  Edge as RFEdge,
  ReactFlowProps,
  ReactFlowState,
  useReactFlow,
  useStore,
  useNodesInitialized,
} from '@xyflow/react';
import { STATE_NODE_DIAMETER } from '../util/constants';

type Options = {
  charge?: number;
  linkDistance?: number;
  collidePadding?: number;
  radialBaseRadius?: number;
  radial?: boolean;
  maxMs?: number;
};

type SimNode = SimulationNodeDatum & RFNode;
type SimLink = SimulationLinkDatum<SimNode>;

const elementCountSelector = (s: ReactFlowState) => s.nodes.length + s.edges.length;
const decayForTicks = (alphaMin: number, ticks: number) =>
  1 - Math.pow(alphaMin, 1 / ticks);

export type LayoutAPI = {
  start: ReactFlowProps['onNodeDragStart'];
  drag: ReactFlowProps['onNodeDrag'];
  stop: ReactFlowProps['onNodeDragStop'];
  restart: () => void;
  running: boolean;
};

export default function useForceLayout({
  charge = -650,
  linkDistance = 160,
  collidePadding = 12,
  radialBaseRadius = 260,
  radial = true,
  maxMs = 500,
}: Options = {}): LayoutAPI {
  const nodesInitialized = useNodesInitialized();
  const elementCount = useStore(elementCountSelector);
  const { getNodes, getEdges, setNodes } = useReactFlow();

  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const idToSimNodeRef = useRef<Map<string, SimNode>>(new Map());
  const stopTimerRef = useRef<number | null>(null);

  const draggingNodeRef = useRef<RFNode | null>(null);

  // Positions-Cache (nur als Fallback; Quelle der Wahrheit sind RF-Node-Positionen)
  const posCache = useRef<Map<string, { x: number; y: number }>>(new Map());

  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const prevEdgeKeysRef = useRef<Set<string>>(new Set());

  const [running, setRunning] = useState(false);

  // ---------- Drag-Handler: aktualisiere auch den Cache mit der User-Position ----------
  const dragHandlers = useMemo<Pick<LayoutAPI, 'start' | 'drag' | 'stop'>>(
    () => ({
      start: (_evt, n) => {
        draggingNodeRef.current = n;
        const sn = idToSimNodeRef.current.get(n.id);
        if (sn) {
          sn.fx = n.position.x;
          sn.fy = n.position.y;
        }
      },
      drag: (_evt, n) => {
        draggingNodeRef.current = n;
        const sim = simRef.current;
        const sn = idToSimNodeRef.current.get(n.id);
        if (sn) {
          sn.fx = n.position.x;
          sn.fy = n.position.y;
          if (sim && sim.alpha() < 0.3) sim.alpha(0.3).restart();
        }
      },
      stop: (_evt, n) => {
        // neue User-Position **persistieren**
        posCache.current.set(n.id, { x: n.position.x, y: n.position.y });
        const sn = idToSimNodeRef.current.get(n.id);
        if (sn) {
          delete sn.fx;
          delete sn.fy;
        }
        draggingNodeRef.current = null;
      },
    }),
    []
  );

  const keyEdge = (e: RFEdge) => `${e.source}→${e.target}`;
  const jitter = (m = 18) => (Math.random() - 0.5) * m;

  // Nutze **aktuelle** RF-Positionen (nicht nur Cache), damit manuelle Moves bleiben
  function neighborCenter(
    id: string,
    edges: RFEdge[],
    currPos: Map<string, { x: number; y: number }>
  ) {
    const touched = edges.filter((e) => e.source === id || e.target === id);
    const pts: { x: number; y: number }[] = [];
    for (const e of touched) {
      const other = e.source === id ? (e.target as string) : (e.source as string);
      const p = currPos.get(other) ?? posCache.current.get(other);
      if (p) pts.push(p);
    }
    if (!pts.length) return null;
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const y = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    return { x, y };
  }

  // Bestehende Knoten werden **an ihrer aktuellen RF-Position gefixt**;
  // neue Knoten werden in Nachbarschaft oder ringförmig gesät.
  function seedPositions(
    simNodes: SimNode[],
    edges: RFEdge[],
    affected: Set<string>,
    currPos: Map<string, { x: number; y: number }>,
    freshSeedAll = false
  ) {
    for (const sn of simNodes) {
      const curr = currPos.get(sn.id);
      const cached = posCache.current.get(sn.id);

      if (curr && !freshSeedAll) {
        sn.x = curr.x;
        sn.y = curr.y;
        if (!affected.has(sn.id)) {
          sn.fx = curr.x;
          sn.fy = curr.y; // ← fixiere **alte** Knoten genau dort, wo der Nutzer sie gelassen hat
        } else {
          delete sn.fx;
          delete sn.fy;
        }
        continue;
      }

      // Kein currPos? (neuer Knoten)
      const npos = neighborCenter(sn.id, edges, currPos);
      if (npos) {
        sn.x = npos.x + jitter(24);
        sn.y = npos.y + jitter(24);
      } else if (cached) {
        sn.x = cached.x + jitter(10);
        sn.y = cached.y + jitter(10);
      } else {
        const idx = simNodes.findIndex((x) => x.id === sn.id);
        const ang = (idx / Math.max(1, simNodes.length)) * Math.PI * 2;
        const R = radialBaseRadius;
        sn.x = Math.cos(ang) * R + jitter(20);
        sn.y = Math.sin(ang) * R + jitter(20);
      }

      if (!affected.has(sn.id) && !freshSeedAll) {
        sn.fx = sn.x!;
        sn.fy = sn.y!;
      } else {
        delete sn.fx;
        delete sn.fy;
      }
    }
  }

  function buildLinks(edges: RFEdge[]): SimLink[] {
    const pairSet = new Set<string>();
    const revPair = new Set<string>();
    for (const e of edges) {
      pairSet.add(`${e.source}|${e.target}`);
      if (pairSet.has(`${e.target}|${e.source}`)) {
        revPair.add(
          (e.source as string) < (e.target as string)
            ? `${e.source}|${e.target}`
            : `${e.target}|${e.source}`
        );
      }
    }
    const deg = new Map<string, number>();
    for (const e of edges) {
      deg.set(e.source as string, (deg.get(e.source as string) ?? 0) + 1);
      deg.set(e.target as string, (deg.get(e.target as string) ?? 0) + 1);
    }
    return edges.map((e) => {
      const a = e.source as string;
      const b = e.target as string;
      const und = a < b ? `${a}|${b}` : `${b}|${a}`;
      const both = revPair.has(und);
      const dBase = linkDistance;
      const dBoth = both ? -20 : 0;
      const dDeg = Math.min(80, (deg.get(a)! + deg.get(b)!) * 4);
      const distance = Math.max(80, dBase + dBoth + dDeg * 0.25);
      return { source: a, target: b, distance } as unknown as SimLink;
    });
  }

  function runSimulation(affected: Set<string>, freshSeedAll = false) {
    const rfNodes = getNodes();
    const rfEdges = getEdges();
    if (!rfNodes.length) return;

    // **Aktuelle** RF-Positionen als Quelle der Wahrheit
    const currPos = new Map(
      rfNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }])
    );

    const simNodes: SimNode[] = rfNodes.map((n) => ({
      ...n,
      x: n.position.x,
      y: n.position.y,
    }));
    const simLinks = buildLinks(rfEdges);

    seedPositions(simNodes, rfEdges, affected, currPos, freshSeedAll);

    idToSimNodeRef.current = new Map(simNodes.map((n) => [n.id, n]));
    simRef.current?.stop();

    const sim = forceSimulation<SimNode>(simNodes)
      .force('charge', forceManyBody<SimNode>().strength(charge))
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id as string)
          .distance((l: any) => l.distance)
          .strength(0.08)
      )
      .force(
        'collide',
        forceCollide<SimNode>().radius(STATE_NODE_DIAMETER / 2 + collidePadding)
      )
      .force('x', forceX<SimNode>(0).strength(0.06))
      .force('y', forceY<SimNode>(0).strength(0.06));

    if (radial) {
      const R = radialBaseRadius;
      sim.force(
        'radial',
        forceRadial<SimNode>((_d, i) => R + (i % 3) * 12, 0, 0).strength(0.015)
      );
    }

    // ≈30 Ticks, danach < 0.5s Ruhe (siehe Alpha/Decay in D3) :contentReference[oaicite:2]{index=2}
    const alphaMin = 0.001;
    const targetTicks = 30;
    sim
      .alpha(0.9)
      .alphaDecay(decayForTicks(alphaMin, targetTicks))
      .alphaMin(alphaMin);

    sim.on('tick', () => {
      setNodes((nodes) =>
        nodes.map((n) => {
          const sn = idToSimNodeRef.current.get(n.id);
          if (!sn) return n;
          const x = sn.x ?? n.position.x;
          const y = sn.y ?? n.position.y;
          // Cache mitführen (hilft beim Seed, falls RF-State mal nicht verfügbar)
          posCache.current.set(n.id, { x, y });
          return { ...n, position: { x, y } };
        })
      );
    });

    const cleanup = () => {
      sim.stop();
      setRunning(false);
      // temporäre Fixes (die wir gesetzt haben) entfernen
      for (const sn of sim.nodes() as SimNode[]) {
        if (!affected.has(sn.id)) {
          delete sn.fx;
          delete sn.fy;
        }
      }
    };

    sim.on('end', cleanup);
    setRunning(true);
    window.clearTimeout(stopTimerRef.current ?? 0);
    stopTimerRef.current = window.setTimeout(cleanup, maxMs);

    simRef.current = sim;
  }

  // Nur **neue** Knoten bewegen (alte bleiben auf User-Position)
  function computeAffected(): { affected: Set<string>; fullRestart: boolean } {
    const currNodes = getNodes();
    const currEdges = getEdges();
    const currIds = new Set(currNodes.map((n) => n.id));
    const prevIds = prevNodeIdsRef.current;

    const addedNodes = [...currIds].filter((id) => !prevIds.has(id));
    const affected = new Set<string>(addedNodes);

    const fullRestart = addedNodes.length === currNodes.length;

    prevNodeIdsRef.current = currIds;
    prevEdgeKeysRef.current = new Set(currEdges.map(keyEdge));
    return { affected, fullRestart };
  }

  const restart = () => {
    const all = new Set<string>(getNodes().map((n) => n.id));
    runSimulation(all, true);
  };

  useEffect(() => {
    if (!nodesInitialized) return;

    const ns = getNodes();
    if (!posCache.current.size && ns.length) {
      ns.forEach((n) =>
        posCache.current.set(n.id, { x: n.position.x, y: n.position.y })
      );
      prevNodeIdsRef.current = new Set(ns.map((n) => n.id));
      prevEdgeKeysRef.current = new Set(getEdges().map(keyEdge));
    }

    const { affected, fullRestart } = computeAffected();
    if (!ns.length) return;

    runSimulation(affected, fullRestart);

    return () => {
      simRef.current?.stop();
      window.clearTimeout(stopTimerRef.current ?? 0);
      setRunning(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementCount, nodesInitialized]);

  return {
    ...dragHandlers,
    restart,
    running,
  };
}
