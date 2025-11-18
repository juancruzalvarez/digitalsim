// WireDraft.tsx 

// TODO: extract duplicated logic from wire and wire draft.

import { useUIStore } from "../../Stores/uiStore";
import { useSimStore } from "../../Stores/simStore";
import type { Vec2 } from "../../Services/types";

const CORNER_RADIUS = 8;
const EXIT_DIST = 50;

function vecEq(a?: Vec2, b?: Vec2) {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

function manhattanIntermediate(a: Vec2, b: Vec2) {
  if (a.x === b.x || a.y === b.y) {
    return [a, b];
  }
  const mid = { x: b.x, y: a.y };
  return [a, mid, b];
}

function buildOrthogonalPoints(points: Vec2[]) {
  if (points.length === 0) return [];
  const out: Vec2[] = [];
  out.push(points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const seg = manhattanIntermediate(a, b);
    for (let j = 1; j < seg.length; j++) {
      const p = seg[j];
      const last = out[out.length - 1];
      if (!vecEq(last, p)) out.push(p);
    }
  }
  const compact: Vec2[] = [];
  for (let i = 0; i < out.length; i++) {
    if (i === 0 || i === out.length - 1) {
      compact.push(out[i]);
      continue;
    }
    const prev = out[i - 1], cur = out[i], next = out[i + 1];
    if ((prev.x === cur.x && cur.x === next.x) || (prev.y === cur.y && cur.y === next.y)) {
      continue;
    } else {
      compact.push(cur);
    }
  }
  if (!vecEq(compact[compact.length - 1], out[out.length - 1])) {
    compact.push(out[out.length - 1]);
  }
  return compact;
}

function roundedPathFromPoints(points: Vec2[], radius = CORNER_RADIUS) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const dParts: string[] = [];
  let prev = points[0];
  dParts.push(`M ${prev.x} ${prev.y}`);

  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    if (i < points.length - 1) {
      const next = points[i + 1];

      const inDir = { x: cur.x - prev.x, y: cur.y - prev.y };
      const outDir = { x: next.x - cur.x, y: next.y - cur.y };

      const inSign = {
        x: inDir.x === 0 ? 0 : inDir.x / Math.abs(inDir.x),
        y: inDir.y === 0 ? 0 : inDir.y / Math.abs(inDir.y),
      };
      const outSign = {
        x: outDir.x === 0 ? 0 : outDir.x / Math.abs(outDir.x),
        y: outDir.y === 0 ? 0 : outDir.y / Math.abs(outDir.y),
      };

      const isCorner = (inSign.x !== outSign.x) || (inSign.y !== outSign.y);
      if (!isCorner) {
        dParts.push(`L ${cur.x} ${cur.y}`);
        prev = cur;
        continue;
      }

      const maxBefore = Math.abs(inDir.x || inDir.y);
      const maxAfter = Math.abs(outDir.x || outDir.y);

      const rBefore = Math.min(radius, maxBefore);
      const rAfter = Math.min(radius, maxAfter);

      const before = { x: cur.x - inSign.x * rBefore, y: cur.y - inSign.y * rBefore };
      const after = { x: cur.x + outSign.x * rAfter, y: cur.y + outSign.y * rAfter };

      dParts.push(`L ${before.x} ${before.y}`);
      dParts.push(`Q ${cur.x} ${cur.y} ${after.x} ${after.y}`);

      prev = after;
    } else {
      dParts.push(`L ${cur.x} ${cur.y}`);
      prev = cur;
    }
  }

  return dParts.join(" ");
}

export const WireDraft = () => {
  const draft = useUIStore((s) => s.wireDraft);
  const pins = useSimStore((s) => s.pins);
  const nodePositions = useUIStore((s) => s.nodePositions);
  const pinPositions = useUIStore((s) => s.pinPositions);

  if (!draft) return null;

  const fromPin = pins[draft.fromPinId];
  if (!fromPin) return null;

  const nodePos = nodePositions[fromPin.nodeId];
  const pinPos = pinPositions[draft.fromPinId];
  if (!nodePos || !pinPos) return null;

  const startX = nodePos.x + pinPos.x;
  const startY = nodePos.y + pinPos.y;

  // Determine exit direction based on pin type
  // Output pins exit right, Input pins exit left
  const exitDirection = fromPin.type === "output" ? 1 : -1;

  const fromEscape: Vec2 = {
    x: startX + (EXIT_DIST * exitDirection),
    y: startY,
  };

  // Build ordered list: from → escape → anchors → currentPos
  const basePoints: Vec2[] = [
    { x: startX, y: startY },
    fromEscape,
    ...(draft.anchors ?? []),
    { x: draft.currentPos.x, y: draft.currentPos.y },
  ];

  const orthoPoints = buildOrthogonalPoints(basePoints);
  const path = roundedPathFromPoints(orthoPoints, CORNER_RADIUS);

  return (
    <>
      <path
        d={path}
        stroke="#2b7fff"
        strokeWidth={4}
        strokeDasharray="8,4"
        fill="none"
        pointerEvents="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {draft.anchors.map((a, i) => (
        <circle
          key={i}
          cx={a.x}
          cy={a.y}
          r={4}
          fill="#2b7fff"
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      ))}
    </>
  );
};