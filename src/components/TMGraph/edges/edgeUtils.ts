// src/components/TMGraph/edges/edgeUtils.ts
import { Position, InternalNode } from '@xyflow/react';

// Get the radius of a circular node based on its width
function getNodeRadius(node: InternalNode) {
  const w =
    (node.measured?.width as number | undefined) ??
    (node.width as number | undefined) ??
    0;
  return w / 2;
}

// Get the center coordinates of a circular node
export function getNodeCenter(node: InternalNode) {
  const r = getNodeRadius(node);
  const pos = node.internals.positionAbsolute; // top-left of the node box
  return { cx: pos.x + r, cy: pos.y + r };
}

/**
 * Returns the intersection point on the circumference of a circular node (source)
 * along the line to the center of another node (target).
 */
export function getCircleIntersection(source: InternalNode, target: InternalNode) {
  const r = getNodeRadius(source);
  const { cx, cy } = getNodeCenter(source);
  const { cx: tx, cy: ty } = getNodeCenter(target);

  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy) || 1;

  return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
}

/**
 * Intersection on the TARGET node along the line connecting the centers.
 * (Arrow tip: lies on the target node's boundary along the source→target line.)
 */
export function getTargetIntersectionAlongCenters(
  source: InternalNode,
  target: InternalNode
) {
  const rt = getNodeRadius(target);
  const { cx: sx, cy: sy } = getNodeCenter(source);
  const { cx: tx, cy: ty } = getNodeCenter(target);

  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;

  return { x: tx - (dx / len) * rt, y: ty - (dy / len) * rt };
}

// Intersection offset by a small angle around the circle.
export function getOffsetIntersection(
  node: InternalNode,
  other: InternalNode,
  deltaAngle: number
) {
  const r = getNodeRadius(node);
  const { cx, cy } = getNodeCenter(node);
  const { cx: tx, cy: ty } = getNodeCenter(other);

  const base = Math.atan2(ty - cy, tx - cx);
  const angle = base + deltaAngle;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

/**
 * Computes the loop point for a circular node, which is the point on the top
 * of the circle with an offset. This is used for drawing loop edges.
 * The offset allows the loop edge to be drawn slightly above the node.
 */
export function getLoopPoint(node: InternalNode, offset = 10) {
  const r = getNodeRadius(node);
  const { cx, cy } = getNodeCenter(node);

  const angle = -Math.PI / 2;
  const sx = cx + Math.cos(angle) * (r + offset);
  const sy = cy + Math.sin(angle) * (r + offset);

  return { x: sx, y: sy, position: Position.Top };
}

/**
 * Computes the source / target coordinates for drawing a floating edge:
 *  - source: center of the source node
 *  - target: point on the target node's boundary along the center-to-center line
 */
export function getFloatingEdgeParams(
  source: InternalNode,
  target: InternalNode,
  _isReverse = false,
  _sign = 1
) {
  const { cx: sx, cy: sy } = getNodeCenter(source);
  const t = getTargetIntersectionAlongCenters(source, target);
  return { sx, sy, tx: t.x, ty: t.y };
}

/**
 * Computes the start and end coordinates for a loop edge on a circular node.
 * The loop edge is drawn from the top of the circle, with an offset angle
 * to create a loop effect.
 */
export function getLoopEdgeParams(node: InternalNode, offsetAngle = Math.PI / 6) {
  const r = getNodeRadius(node);
  const { cx, cy } = getNodeCenter(node);

  const base = -Math.PI / 2;
  const angle1 = base + offsetAngle;
  const angle2 = base - offsetAngle;

  const sx = cx + Math.cos(angle1) * r;
  const sy = cy + Math.sin(angle1) * r;
  const ex = cx + Math.cos(angle2) * r;
  const ey = cy + Math.sin(angle2) * r;

  return { sx, sy, ex, ey };
}
