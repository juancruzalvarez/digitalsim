import { useRef, useState } from "react";
import { useSimStore } from "../../Stores/simStore";
import { useUIStore } from "../../Stores/uiStore";
import type { Vec2 } from "../../Services/types";
import { NodeTitleFromKind } from "../../Services/data";
import { Pin } from "../UI/Pin";


// TODO: Add phase param(for async clocks.)
export const ClockNode = ({ id }: { id: number }) => {

  const scale = useUIStore((s) => s.view.scale);
  const node = useSimStore((s) => s.nodes[id]);
  const pos = useUIStore((s) => s.nodePositions[id]);
  const setTitle = useUIStore((s) => s.setNodeTitle);
  const moveNode = useUIStore((s) => s.moveNode);
  const addSelection = useUIStore((s) => s.addSelection);
  const setSelection = useUIStore((s) => s.setSelection);
  const toggleSelection = useUIStore((s) => s.toogleSelection);
  const selectedIds = useUIStore((s) => s.selectedNodesIds);
  const selected = selectedIds.includes(id);

  const setNodeParam = useSimStore((s) => s.setNodeParam);
  const period = useSimStore(
    (s) => s.nodes[id].data?.["period"]?.value as number
  );
  const tick = useSimStore((s) => s.currentTick);


  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef<Vec2>({ x: 0, y: 0 });
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });
  const [editingTitle, setEditingTitle] = useState(false);


  const move = (newPos: Vec2) => moveNode(id, newPos);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: pos.x, y: pos.y };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    const selection = useUIStore.getState().selectedNodesIds;
    const isSelected = selection.includes(id);

    if (e.button === 0) {
      if (e.shiftKey) addSelection([id]);
      else if (e.ctrlKey) toggleSelection(id);
      else if (!isSelected) setSelection([id]);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;

    const dx = (e.clientX - dragStart.current.x) / scale;
    const dy = (e.clientY - dragStart.current.y) / scale;

    move({
      x: dragOffset.current.x + dx,
      y: dragOffset.current.y + dy,
    });
  };

  const onMouseUp = () => {
    dragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const updatePeriod = (val: number) => {
    setNodeParam(id, "period", val);
  };

  const progress = period > 1 ? (((tick - 1) % period) / (period - 1)) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      style={{ left: pos.x, top: pos.y }}
      className={`
        absolute select-none text-sm rounded-lg shadow-md transition-transform
        ${selected ? "ring-4 ring-blue-400 scale-105" : "hover:scale-102"}
      `}
    >
      <div
        className="bg-neutral-800 text-white font-semibold px-3 py-1 rounded-t-md border border-neutral-700 cursor-text"
        contentEditable={editingTitle}
        suppressContentEditableWarning
        onDoubleClick={() => setEditingTitle(true)}
        onBlur={(e) => {
          setTitle(id, e.currentTarget.innerText.trim());
          setEditingTitle(false);
        }}
      >
        {node.title || NodeTitleFromKind(node.kind)}
      </div>

      <div className="bg-neutral-900 border border-t-0 border-neutral-700 px-3 py-2 rounded-b-md w-[180px]">
        {/* Parameter Input */}
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-xs text-neutral-300 font-medium">
            Period
          </label>
          <input
            type="number"
            className="w-full px-2 py-1 text-sm rounded border border-neutral-600 bg-neutral-100 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={period ?? 0}
            min={1}
            onChange={(e) => updatePeriod(Number(e.target.value) || 1)}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-4 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-xs text-neutral-400 mt-1">
            {progress.toFixed(0)}%
          </div>
        </div>

        {/* Outputs */}
        <div className="flex flex-col items-end gap-2">
          {node.outputPins.map((pinId) => (
            <Pin
              key={pinId}
              id={pinId}
              isInput={false}
              nodeId={id}
              parentNodeRef={containerRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
};