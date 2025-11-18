import React, { useRef, useState, useEffect, memo } from "react";
import { type Vec2 } from "../../Services/types";
import { AddNodeSearch } from "../UI/AddNodeSearch";
import { useSimStore } from "../../Stores/simStore";
import { Wires } from "../Wires/Wires";
import { Grid } from "./Grid";
import { WireDraftWatcher } from "../Wires/WireDraftWatcher";
import { Node } from "../Nodes/Node";
import { useShallow } from "zustand/shallow";
import { useUIStore } from "../../Stores/uiStore";
import { useViewport } from "../../Hooks/useViewport";
import { SelectionSquare } from "../UI/SelectionSquare";
import { useKeyboardShortcuts } from "../../Hooks/useKeyboardShortcuts";

const Canvas = () => {
  
  const [addNodePos, setAddNodePos] = useState<Vec2 | null>(null);
  const nodesIds = useSimStore(
    useShallow((s) => Object.keys(s.nodes).map(Number))
  );
  const addNode = useUIStore((s) => s.addNode);
  const setPanOffset = useUIStore((s) => s.setPosition);
  const setScale = useUIStore((s) => s.setScale);
  const startSquareSelection = useUIStore((s) => s.startSquareSelection);
  const updateSquareSelection = useUIStore((s) => s.updateSquareSelection);
  const endSquareSelection = useUIStore((s) => s.endSquareSelection);

  // Only subscribe to wireDraft existence, not the whole object
  const hasWireDraft = useUIStore((s) => s.wireDraft !== null);
  const addWireAnchor = useUIStore((s) => s.addWireAnchor);

  const isSelecting = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodesContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gridRef = useRef<SVGSVGElement>(null);

  const viewport = useViewport(
    containerRef,
    nodesContainerRef,
    svgRef,
    gridRef,
    setPanOffset,
    setScale
  );

  useKeyboardShortcuts();
  
  // ESC key handler - access store without subscribing
  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const selectedWireId = useUIStore.getState().selectedWireId;
    const wireDraft = useUIStore.getState().wireDraft; // ✅ Add this

    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedWireId !== null) {
        e.preventDefault();
        useSimStore.getState().disconnectWire(selectedWireId);
        useUIStore.getState().selectWire(null);
        useUIStore.getState().finishEditingWire();
      }
    }

    if (e.key === "Escape") {
      // Check wire draft first, then editing
      if (wireDraft) {
        e.preventDefault();
        useUIStore.getState().removeLastAnchor();
      } else {
        const editingWireId = useUIStore.getState().editingWireId;
        if (editingWireId !== null) {
          e.preventDefault();
          useUIStore.getState().finishEditingWire();
        }
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []); // Empty deps

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = (mx - viewport.pan.current.x) / viewport.scale.current;
    const worldY = (my - viewport.pan.current.y) / viewport.scale.current;
    const selectWire = useUIStore.getState().selectWire;
    const finishEditingWire = useUIStore.getState().finishEditingWire;

    if (e.button === 2) {
      // Right click - open add node menu
      setAddNodePos({ x: worldX, y: worldY });
      return;
    } else if (e.button === 0) {
      if (hasWireDraft) {
        addWireAnchor({ x: worldX, y: worldY });
      } else {
        // Clear wire selection when starting square selection
        selectWire(null);
        finishEditingWire();

        startSquareSelection(
          { x: worldX, y: worldY },
          e.shiftKey ? "shift" : e.ctrlKey ? "ctrl" : "none"
        );
        isSelecting.current = true;
      }
    }
    setAddNodePos(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting.current) {
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const worldX = (mx - viewport.pan.current.x) / viewport.scale.current;
      const worldY = (my - viewport.pan.current.y) / viewport.scale.current;
      updateSquareSelection({ x: worldX, y: worldY });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting.current) {
      isSelecting.current = false;
      endSquareSelection();
    }
  };

  return (
    <div className="w-full h-full overflow-hidden bg-neutral-900 relative">
      {/* Main grid */}
      <div
        ref={containerRef}
        className="w-full h-full absolute top-0 left-0 bg-neutral-50"
        onWheel={viewport.handleWheel}
        onMouseDown={(e) => {
          viewport.handleMouseDown(e);
          handleMouseDown(e);
        }}
        onMouseMove={(e) => {
          viewport.handleMouseMove(e);
          handleMouseMove(e);
        }}
        onMouseUp={() => {
          viewport.handleMouseUp();
          handleMouseUp();
        }}
        onMouseLeave={viewport.handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <WireDraftWatcher
          containerRef={containerRef}
          pan={viewport.pan}
          scale={viewport.scale}
        />

        {/* grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <g ref={gridRef}>
            <Grid />
          </g>
        </svg>

        <svg className="absolute inset-0 w-full h-full">
          <g
            ref={svgRef}
            transform={`translate(${viewport.pan.current.x},${viewport.pan.current.y}) scale(${viewport.scale.current})`}
          >
            <Wires />
          </g>
        </svg>

        {/* Node layer */}
        <div
          ref={nodesContainerRef}
          id="canvas-container"
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            transform: `translate(${viewport.pan.current.x}px, ${viewport.pan.current.y}px) scale(${viewport.scale.current})`,
          }}
        >
          {addNodePos && (
            <AddNodeSearch
              x={addNodePos.x}
              y={addNodePos.y}
              onSelect={(val) => {
                addNode(val, addNodePos);
                setAddNodePos(null);
              }}
              onCancel={() => setAddNodePos(null)}
            />
          )}

          <SelectionSquare />
          {nodesIds.map((id) => {
            return <Node key={id} id={id} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(Canvas);
