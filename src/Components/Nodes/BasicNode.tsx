import { useSimStore } from "../../Stores/simStore";
import type { Vec2 } from "../../Services/types";
import { useEffect, useRef, useState } from "react";
import { NodeTitleFromKind } from "../../Services/data";
import { DigitalToggle } from "../UI/DigitalToggle";
import { Pin } from "../UI/Pin";
import { useUIStore } from "../../Stores/uiStore";

export const BasicNode = ({ id }: { id: number }) => {
  const scale = useUIStore((s) => s.view.scale);

  const node = useSimStore((s) => s.nodes[id]);
  const pos = useUIStore((s) => s.nodePositions[id]);
  const params = node.data ? Object.values(node.data) : [];

  const moveNode = useUIStore((s) => s.moveNode);
  const setNodeParam = useSimStore((s) => s.setNodeParam);
  const setTitle = useUIStore((s) => s.setNodeTitle);

  const dragging = useRef(false);
  const dragStart = useRef<Vec2>({ x: 0, y: 0 });
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const addSelection = useUIStore((s) => s.addSelection);
  const setSelection = useUIStore((s) => s.setSelection);
  const toggleSelection = useUIStore((s) => s.toogleSelection);

  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  const updateParam = (i: number, val: number | boolean) => {
    setNodeParam(id, params[i].name, val);
  };

  const move = (newPos: Vec2) => {
    moveNode(id, newPos);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    dragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    dragOffset.current = {
      x: pos.x,
      y: pos.y,
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    const selection = useUIStore.getState().selectedNodesIds;
    const isSelected = selection.includes(id);
    if (e.button == 0) {
      if (e.shiftKey) {
        addSelection([id]);
      } else if (e.ctrlKey) {
        toggleSelection(id);
      } else if (!isSelected) {
        setSelection([id]);
      }
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
  const selectedIds = useUIStore((s) => s.selectedNodesIds);
  const selected = selectedIds.includes(id);

  const [tempTitle, setTempTitle] = useState("");

  useEffect(() => {
    if (!editingTitle) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Save on outside click instead of cancel
        setTitle(id, tempTitle.trim());
        setEditingTitle(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [editingTitle, tempTitle, id, setTitle]);

  return (
    <div
      ref={containerRef}
      className={`absolute rounded-lg select-none cursor-default transition-colors duration-150
        ${
          selected ? "ring-4 ring-blue-400 scale-[1.05]" : "hover:scale-[1.02]"
        }`}
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translateZ(0)",
        minWidth: 180,
      }}
      onMouseDown={onMouseDown}
    >
      {/* === Title === */}
      {editingTitle ? (
        <input
          autoFocus
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onBlur={(e) => {
            // Treat blur as confirm if still inside container
            setTitle(id, tempTitle.trim());
            setEditingTitle(false);
            if (containerRef.current?.contains(e.relatedTarget)) return;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur(); // save
            } else if (e.key === "Escape") {
              // cancel edit
              setEditingTitle(false);
              setTempTitle(node.title || "");
            }
          }}
          className="px-3 py-1 font-semibold text-sm rounded-t-md border 
                    bg-neutral-800 text-white border-blue-400 w-full outline-none
                    ring-1 ring-blue-400"
        />
      ) : (
        <div
          className="px-3 py-1 font-semibold text-sm rounded-t-md border 
                 bg-neutral-800 text-white border-neutral-600 cursor-text"
          onDoubleClick={() => {
            setTempTitle(node.title || "");
            setEditingTitle(true);
          }}
        >
          {node.title || NodeTitleFromKind(node.kind)}
        </div>
      )}

      <div className="bg-neutral-900 border border-t-0 border-neutral-700 px-3 py-2 rounded-b-md">
        {/* Parameters */}
        {params.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {params.map((param, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm text-white gap-2"
              >
                <span>{param.name}</span>
                {param.kind === "digital" && (
                  <DigitalToggle
                    value={Number(param.value)}
                    onChange={(n) => updateParam(i, n)}
                  />
                )}
                {param.kind === "bool" && (
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-500"
                    checked={Boolean(param.value)}
                    onChange={(e) => updateParam(i, e.target.checked)}
                  />
                )}
                {param.kind === "numerical" && (
                  <input
                    type="number"
                    className="w-20 px-1 text-sm text-black rounded-sm"
                    value={param.value as number}
                    onChange={(e) => updateParam(i, Number(e.target.value))}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pins */}
        <div className="flex justify-between gap-8">
          {/* Inputs */}
          <div className="flex flex-col gap-2 items-start">
            {node.inputPins.map((pinId) => (
              <Pin
                key={pinId}
                id={pinId}
                isInput
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
};
