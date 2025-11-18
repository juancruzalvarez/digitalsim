
import { useRef, useState } from "react";

import { Pin } from "../UI/Pin";
import { useSimStore } from "../../Stores/simStore";
import { useUIStore } from "../../Stores/uiStore";
import type { Vec2 } from "../../Services/types";
import { NodeTitleFromKind } from "../../Services/data";

export const SignalDisplayNode = ({ id }: { id: number }) => {
  const scale = useUIStore((s) => s.view.scale);
  const node = useSimStore((s) => s.nodes[id]);
  const pos = useUIStore((s) => s.nodePositions[id]);
  const moveNode = useUIStore((s) => s.moveNode);
  const setTitle = useUIStore((s) => s.setNodeTitle);
  const addSelection = useUIStore((s) => s.addSelection);
  const setSelection = useUIStore((s) => s.setSelection);
  const toggleSelection = useUIStore((s) => s.toogleSelection);
  const selectedIds = useUIStore((s) => s.selectedNodesIds);
  const selected = selectedIds.includes(id);

  const { value } = useSimStore((s) => s.pins[node.inputPins[0]]);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef<Vec2>({ x: 0, y: 0 });
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });

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
    move({ x: dragOffset.current.x + dx, y: dragOffset.current.y + dy });
  };

  const onMouseUp = () => {
    dragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      style={{ left: pos.x, top: pos.y }}
      className={`
        absolute select-none text-sm rounded-lg shadow-md transition-transform duration-150
        ${selected ? "ring-4 ring-blue-400 scale-[1.04]" : "hover:scale-[1.02]"}
      `}
    >
      <div
        className="bg-neutral-800 text-white font-semibold px-3 py-1.5 rounded-t-lg border border-neutral-700 cursor-text"
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

      <div className="bg-neutral-900 border border-t-0 border-neutral-700 rounded-b-lg px-3 py-3 flex flex-col items-center gap-3 min-w-[150px]">
        {/* Signal indicator */}
        <div
          className={`w-full h-10 rounded-md shadow-inner transition-colors duration-300 ${
            value === 1
              ? "bg-blue-500 shadow-blue-400/40"
              : "bg-neutral-700 border border-neutral-600"
          }`}
        />

        {/* Pins Row */}
        <div className="flex justify-between w-full px-1">
          {/* Inputs */}
          <div className="flex flex-col gap-2 items-start">
            {node.inputPins.map((pinId) => (
              <Pin
                key={pinId}
                id={pinId}
                isInput={true}
                nodeId={id}
                parentNodeRef={containerRef}
              />
            ))}
          </div>

          {/* Outputs */}
          <div className="flex flex-col gap-2 items-end">
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
    </div>
  );
}