
import { useRef, useState } from "react";

import { StickyNote } from "lucide-react";
import { useUIStore } from "../../Stores/uiStore";
import { useSimStore } from "../../Stores/simStore";
import type { Vec2 } from "../../Services/types";


// TODO: maybe the styling does not fit the overall look of the app.
// TODO: it also has some weird resizing bugs
export const NoteNode = ({ id }: { id: number }) => {
  const scale = useUIStore((s) => s.view.scale);
  const node = useSimStore((s) => s.nodes[id]);
  const pos = useUIStore((s) => s.nodePositions[id]);

  const moveNode = useUIStore((s) => s.moveNode);
  const setNodeParam = useSimStore((s) => s.setNodeParam);
  const addSelection = useUIStore((s) => s.addSelection);
  const setSelection = useUIStore((s) => s.setSelection);
  const toggleSelection = useUIStore((s) => s.toogleSelection);
  const selectedIds = useUIStore((s) => s.selectedNodesIds);

  const dragging = useRef(false);
  const dragStart = useRef<Vec2>({ x: 0, y: 0 });
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingContent, setEditingContent] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>(
    (node.data && node.data["note"] ? node.data["note"].value : "") as string
  );

  const selected = selectedIds.includes(id);

  const move = (newPos: Vec2) => {
    moveNode(id, newPos);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking on textarea while editing
    if (editingContent) return;

    e.stopPropagation();
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: pos.x, y: pos.y };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    const selection = useUIStore.getState().selectedNodesIds;
    const isSelected = selection.includes(id);

    if (e.button === 0) {
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContent(true);
    // Focus textarea and move cursor to end after state updates
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Move cursor to end
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleTextareaDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Select all text on double click while editing
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  const handleBlur = () => {
    setNodeParam(id, "note", noteText);
    setEditingContent(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation so canvas shortcuts don't fire
    e.stopPropagation();

    // Exit edit mode on Escape
    if (e.key === "Escape") {
      setNodeParam(id, "note", noteText);
      setEditingContent(false);
    }
  };

  return (
    <div
      className={`
        absolute text-sm select-none rounded-lg shadow-lg transition-transform duration-150
        ${selected ? "ring-4 ring-yellow-400 scale-105" : "hover:scale-102"}
      `}
      style={{ left: pos.x, top: pos.y, minWidth: 200, maxWidth: 300 }}
      onMouseDown={onMouseDown}
      ref={containerRef}
    >
      {/* Header */}
      <div className="bg-yellow-400 px-3 py-1.5 rounded-t-lg flex items-center gap-2">
        <StickyNote size={14} className="text-yellow-900" />
        <span className="text-yellow-900 font-semibold text-xs">Note</span>
      </div>

      {/* Content */}
      <div
        className="bg-yellow-50 px-3 py-2 rounded-b-lg border-2 border-yellow-400 border-t-0 min-h-[60px]"
        onDoubleClick={handleDoubleClick}
      >
        {editingContent ? (
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onDoubleClick={handleTextareaDoubleClick} // Add this
            className="w-full bg-transparent text-gray-800 outline-none resize-none font-mono text-xs"
            rows={4}
            placeholder="Double-click to edit..."
            style={{ minHeight: 60 }}
          />
        ) : (
          <div className="text-gray-800 whitespace-pre-wrap font-mono text-xs min-h-[60px]">
            {noteText || (
              <span className="text-gray-400 italic">
                Double-click to edit...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
