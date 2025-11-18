import { useEffect } from "react";
import { useUIStore } from "../Stores/uiStore";
import { useProjectStore } from "../Stores/projectStore";

export function useKeyboardShortcuts() {
  const copySelection = useUIStore((s) => s.copySelection);
  const pasteSelection = useUIStore((s) => s.pasteSelection);
  const duplicateSelection = useUIStore((s) => s.duplicateSelection);
  const deleteSelection = useUIStore((s) => s.deleteSelection);
  const clearSelection = useUIStore((s) => s.clearSelection);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const ctrl = e.ctrlKey || e.metaKey; // works for mac cmd ⌘ too
      const key = e.key.toLowerCase();

      // --- undo ---
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (useProjectStore.getState().canUndo()) {
          useProjectStore.getState().undo();
        }
      }

      // --- redo ---
      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (useProjectStore.getState().canRedo()) {
          useProjectStore.getState().redo();
        }
      }
      // --- COPY ---
      if (ctrl && key === "c") {
        e.preventDefault();
        copySelection();
      }

      // --- PASTE ---
      if (ctrl && key === "v") {
        e.preventDefault();

        // Optionally paste at mouse cursor position if available
        // For now, we just offset automatically
        pasteSelection();
      }

      // --- DUPLICATE ---
      if (ctrl && key === "d") {
        e.preventDefault();
        duplicateSelection();
      }

      // --- DELETE ---
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        deleteSelection();
      }

      // --- CLEAR SELECTION ---
      if (key === "escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection, copySelection, deleteSelection, duplicateSelection, pasteSelection]);
}
