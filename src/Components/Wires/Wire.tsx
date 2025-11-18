import React from "react";
import { useSimStore } from "../../Stores/simStore";
import { useShallow } from "zustand/shallow";
import { useUIStore } from "../../Stores/uiStore";
import type { Pin, Vec2 } from "../../Services/types";

type WireProps = {
  wireId: number;
  fromPinId: number;
  toPinId: number;
  anchors?: Vec2[];
};

const DEFAULT_CORNER_RADIUS = 8;
const DEFAULT_GRID_SNAP = 8;

function vecEq(a?: Vec2, b?: Vec2) {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

/*
 * A -> (B.x, A.y) -> B  (horizontal-first).
 * For purely vertical/horizontal it will return direct segment.
 */
function manhattanIntermediate(a: Vec2, b: Vec2) {
  if (a.x === b.x || a.y === b.y) {
    return [a, b];
  }
  // horizontal then vertical (A.x -> B.x at A.y, then B.x,B.y)
  const mid = { x: b.x, y: a.y };
  return [a, mid, b];
}

/** Merge a list of points with Manhattan routing between consecutive points.
 *  Keeps duplicates removed.
 */
function buildOrthogonalPoints(points: Vec2[]) {
  if (points.length === 0) return [];
  const out: Vec2[] = [];
  out.push(points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const seg = manhattanIntermediate(a, b);
    // seg includes a and b, skip first element because it's already in out
    for (let j = 1; j < seg.length; j++) {
      const p = seg[j];
      const last = out[out.length - 1];
      if (!vecEq(last, p)) out.push(p);
    }
  }
  // compact collinear points: remove points that are exactly on the same line between neighbors
  // TODO: maybe add allowance for nearly collinear points, as if its a bit off it look horrible
  const compact: Vec2[] = [];
  for (let i = 0; i < out.length; i++) {
    if (i === 0 || i === out.length - 1) {
      compact.push(out[i]);
      continue;
    }
    const prev = out[i - 1],
      cur = out[i],
      next = out[i + 1];
    // if prev->cur and cur->next are in same axis direction, cur is redundant
    if (
      (prev.x === cur.x && cur.x === next.x) ||
      (prev.y === cur.y && cur.y === next.y)
    ) {
      // skip cur
      continue;
    } else {
      compact.push(cur);
    }
  }
  // ensure last is present
  if (!vecEq(compact[compact.length - 1], out[out.length - 1])) {
    compact.push(out[out.length - 1]);
  }
  return compact;
}

/** Convert orthogonal points to a rounded SVG path.
 * Uses small quadratic curves (Q) to round corners.
 */
function roundedPathFromPoints(points: Vec2[], radius = DEFAULT_CORNER_RADIUS) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const dParts: string[] = [];
  let prev = points[0];
  dParts.push(`M ${prev.x} ${prev.y}`);

  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    // If we're at a corner (i < points.length - 1), attempt rounding
    if (i < points.length - 1) {
      const next = points[i + 1];

      // directions
      const inDir = { x: cur.x - prev.x, y: cur.y - prev.y };
      const outDir = { x: next.x - cur.x, y: next.y - cur.y };

      // normalize to unit direction sign
      const inSign = {
        x: inDir.x === 0 ? 0 : inDir.x / Math.abs(inDir.x),
        y: inDir.y === 0 ? 0 : inDir.y / Math.abs(inDir.y),
      };
      const outSign = {
        x: outDir.x === 0 ? 0 : outDir.x / Math.abs(outDir.x),
        y: outDir.y === 0 ? 0 : outDir.y / Math.abs(outDir.y),
      };

      const isCorner = inSign.x !== outSign.x || inSign.y !== outSign.y;
      if (!isCorner) {
        // straight continuation; line to cur and move on
        dParts.push(`L ${cur.x} ${cur.y}`);
        prev = cur;
        continue;
      }

      // compute before/after points offset by radius along incoming/outgoing segments
      // length available in each segment
      const maxBefore = Math.abs(inDir.x || inDir.y); // since orthogonal, only one is non-zero
      const maxAfter = Math.abs(outDir.x || outDir.y);

      const rBefore = Math.min(radius, maxBefore);
      const rAfter = Math.min(radius, maxAfter);

      // before point: move from cur backwards along inDir by rBefore
      const before = {
        x: cur.x - inSign.x * rBefore,
        y: cur.y - inSign.y * rBefore,
      };
      // after point: move from cur forwards along outDir by rAfter
      const after = {
        x: cur.x + outSign.x * rAfter,
        y: cur.y + outSign.y * rAfter,
      };

      // line to before, quadratic curve to after with control point at cur
      dParts.push(`L ${before.x} ${before.y}`);
      dParts.push(`Q ${cur.x} ${cur.y} ${after.x} ${after.y}`);

      // advance pointers: pretend prev is after and skip cur
      prev = after;
    } else {
      // last point, simple line
      dParts.push(`L ${cur.x} ${cur.y}`);
      prev = cur;
    }
  }

  return dParts.join(" ");
}

export const WireElement = ({
  wireId,
  fromPinId,
  toPinId,
  anchors,
}: WireProps) => {
  // value used to change color
  const value = useSimStore((s) => s.pins[fromPinId]?.value);
  const [fromPin, toPin] = useSimStore(
    useShallow((s) => [s.pins[fromPinId], s.pins[toPinId]])
  );

  const selectedWireId = useUIStore((s) => s.selectedWireId);
  const editingWireId = useUIStore((s) => s.editingWireId);
  const startEditingWire = useUIStore((s) => s.startEditingWire);
  const moveWireAnchor = useUIStore((s) => s.moveWireAnchor);
  const removeWireAnchor = useUIStore((s) => s.removeWireAnchor);
  const view = useUIStore((s) => s.view);

  // positions (from nodePositions and pinPositions like in your original)
  const [fromX, fromY, toX, toY] = useUIStore(
    useShallow((s) => {
      const getPos = (id: number, pin: Pin | undefined) => {
        if (!pin) return [0, 0];
        const nodePos = s.nodePositions[pin.nodeId];
        const rel = s.pinPositions[id];
        if (!nodePos || !rel) return [0, 0];
        return [nodePos.x + rel.x, nodePos.y + rel.y];
      };
      const [fx, fy] = getPos(fromPinId, fromPin);
      const [tx, ty] = getPos(toPinId, toPin);
      return [fx, fy, tx, ty];
    })
  );

  const isSelected = selectedWireId === wireId;
  const isEditing = editingWireId === wireId;

  // dragging anchors state
  const [draggingAnchorIndex, setDraggingAnchorIndex] = React.useState<
    number | null
  >(null);

  const radius = DEFAULT_CORNER_RADIUS;
  const gridSnap = DEFAULT_GRID_SNAP;

  // How far to pull wires out horizontally from nodes
  const EXIT_DIST = 50;
  const fromExitDir = fromPin?.type === "output" ? 1 : -1;
  const toApproachDir = toPin?.type === "input" ? -1 : 1;

  const fromEscape: Vec2 = {
    x: fromX + EXIT_DIST * fromExitDir,
    y: fromY,
  };

  const toApproach: Vec2 = {
    x: toX + EXIT_DIST * toApproachDir,
    y: toY,
  };

  // Build ordered list:
  // from → escape → anchors → approach → to
  const basePoints: Vec2[] = [
    { x: fromX, y: fromY },
    fromEscape,
    ...(anchors ?? []),
    toApproach,
    { x: toX, y: toY },
  ];

  const orthoPoints = buildOrthogonalPoints(basePoints);
  const pathD = roundedPathFromPoints(orthoPoints, radius);

  const offsetForClick = 12; // thicker invisible stroke for hit test

  const handleWireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    startEditingWire(wireId);
  };

  const handleAnchorMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    // left button only
    if (e.button !== 0) return;
    setDraggingAnchorIndex(index);
  };

  const handleAnchorRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeWireAnchor(wireId, index);
  };

  React.useEffect(() => {
    if (draggingAnchorIndex === null) return;

    const handleMouseMove = (ev: MouseEvent) => {
      const container = document.getElementById("canvas-container");
      if (!container) return;

      const parentRect = container.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      // convert screen coords to world coords
      const worldX =
        (ev.clientX - parentRect.left - view.position.x) / view.scale;
      const worldY =
        (ev.clientY - parentRect.top - view.position.y) / view.scale;

      /*const snappedX =
        gridSnap > 0 ? Math.round(worldX / gridSnap) * gridSnap : worldX;
      const snappedY =
        gridSnap > 0 ? Math.round(worldY / gridSnap) * gridSnap : worldY;
*/
      moveWireAnchor(wireId, draggingAnchorIndex, { x: worldX, y: worldY });
    };

    const handleMouseUp = () => {
      setDraggingAnchorIndex(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingAnchorIndex, wireId, moveWireAnchor, view]);

  // Render anchor circles only while editing.
  return (
    <g>
      {/* Invisible thicker path for easier clicking */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={offsetForClick}
        fill="none"
        pointerEvents="stroke"
        onClick={handleWireClick}
        style={{ cursor: "pointer" }}
      />

      {/* Visible wire */}
      <path
        d={pathD}
        stroke={isSelected ? "#ff6b35" : value ? "#2b7fff" : "#888"}
        strokeWidth={isSelected ? 5 : 4}
        fill="none"
        pointerEvents="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Anchor handles (visible/editable) */}
      {isEditing &&
        anchors &&
        anchors.map((anchor, i) => (
          <g key={i}>
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={6}
              fill="white"
              stroke="#ff6b35"
              strokeWidth={2}
              style={{ cursor: "move" }}
              onMouseDown={(e) => handleAnchorMouseDown(e, i)}
              onContextMenu={(e) => handleAnchorRightClick(e, i)}
            />
          </g>
        ))}
    </g>
  );
};
