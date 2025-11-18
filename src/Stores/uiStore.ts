import type { NodeKind, Vec2, View, WireDraft } from "../Services/types";
import { create } from "zustand";
import { useSimStore } from "./simStore";
import { immer } from "zustand/middleware/immer";

import { getClipboard, setClipboard } from "./editorClipboard";
import { useProjectStore } from "./projectStore";

type UIStore = {
  view: View;
  nodePositions: Record<number, Vec2>;
  pinPositions: Record<number, Vec2>;
  selectedNodesIds: number[];
  wireDraft: WireDraft | null;
  selectedWireId: number | null;
  editingWireId: number | null; // Wire currently being edited
  squareSelection: {
    mods: "none" | "ctrl" | "shift";
    origin: Vec2;
    start: Vec2;
    end: Vec2;
  } | null;

  addNode: (kind: NodeKind, position: Vec2) => void;
  moveNode: (id: number, position: Vec2) => void;
  setPinPos: (id: number, position: Vec2) => void;
  setSelection: (ids: number[]) => void; // when click on node, or square select.
  addSelection: (ids: number[]) => void; // same but when shift is pressed.
  toogleSelection: (id: number) => void; // when node is clicked with ctrl pressed.
  clearSelection: () => void;
  startSquareSelection: (start: Vec2, mods: "none" | "ctrl" | "shift") => void;
  updateSquareSelection: (end: Vec2) => void;
  endSquareSelection: () => void;
  copySelection: () => void;
  pasteSelection: () => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;
  setScale: (zoom: number) => void;
  setPosition: (pan: Vec2) => void;
  movePosition: (transform: (prev: Vec2) => Vec2) => void;
  startWire: (fromPinId: number, startPos: Vec2) => void;
  addWireAnchor: (pos: Vec2) => void;
  updateWirePos: (pos: Vec2) => void;
  removeLastAnchor: () => void;
  completeWire: (toPinId: number) => void;
  cancelWire: () => void;
  selectWire: (wireId: number | null) => void;
  startEditingWire: (wireId: number) => void;
  addAnchorToWire: (
    wireId: number,
    anchorIndex: number,
    position: Vec2
  ) => void;
  moveWireAnchor: (wireId: number, anchorIndex: number, position: Vec2) => void;
  removeWireAnchor: (wireId: number, anchorIndex: number) => void;
  finishEditingWire: () => void;
  setNodeTitle: (id: number, title: string) => void;
};

const pushHistoryDebounced = (() => {
  let timeout: number;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      useProjectStore.getState().pushHistory();
    }, 500); // Push to history 500ms after last change
  };
})();

export const useUIStore = create(
  immer<UIStore>((set, get) => ({
    view: { position: { x: 0, y: 0 }, scale: 1 },

    nodePositions: {},
    pinPositions: {},

    selectedNodesIds: [],
    wireDraft: null,
    squareSelection: null,
    selectedWireId: null,
    editingWireId: null,
    addNode: (kind: NodeKind, position: Vec2) => {
      const id = useSimStore.getState().addNode(kind);
      set((s) => ({
        nodePositions: { ...s.nodePositions, [id]: position },
      }));
      pushHistoryDebounced();
    },
    moveNode: (id: number, newPos: Vec2) => {
      set((state) => {
        const selected = state.selectedNodesIds;
        if (!selected.includes(id)) return;

        const ref = state.nodePositions[id];
        if (!ref) return;

        const dx = newPos.x - ref.x;
        const dy = newPos.y - ref.y;

        for (const sid of selected) {
          const pos = state.nodePositions[sid];
          if (pos) {
            pos.x += dx;
            pos.y += dy;
          }
        }
      });
      pushHistoryDebounced();
    },
    setPinPos: (id: number, position: Vec2) => {
      set((s) => ({
        pinPositions: {
          ...s.pinPositions,
          [id]: { x: position.x, y: position.y },
        },
      }));
    },
    setSelection: (ids: number[]) => set(() => ({ selectedNodesIds: ids })),
    addSelection: (ids: number[]) =>
      set((s) => ({ selectedNodesIds: [...s.selectedNodesIds, ...ids] })),
    clearSelection: () => set(() => ({ selectedNodesIds: [] })),
    toogleSelection: (id: number) => {
      set((s) => {
        const selected = new Set(s.selectedNodesIds);

        if (selected.has(id)) {
          selected.delete(id);
        } else {
          selected.add(id);
        }

        return { selectedNodesIds: Array.from(selected) };
      });
    },
    startSquareSelection: (start: Vec2, mods: "none" | "ctrl" | "shift") =>
      set({
        squareSelection: {
          mods: mods,
          origin: start,
          start,
          end: start,
        },
      }),

    updateSquareSelection: (current: Vec2) =>
      set((state) => {
        const sq = state.squareSelection;
        if (!sq) return state;

        const start = {
          x: Math.min(sq.origin.x, current.x),
          y: Math.min(sq.origin.y, current.y),
        };
        const end = {
          x: Math.max(sq.origin.x, current.x),
          y: Math.max(sq.origin.y, current.y),
        };

        return {
          squareSelection: { ...sq, start, end },
        };
      }),

    endSquareSelection: () =>
      set((state) => {
        const { squareSelection, nodePositions, selectedNodesIds } = state;
        if (!squareSelection) return state;

        const { start, end, mods } = squareSelection;

        const inside = Object.entries(nodePositions)
          .filter(
            ([id, pos]) =>
              pos.x >= start.x &&
              pos.x <= end.x &&
              pos.y >= start.y &&
              pos.y <= end.y
          )
          .map(([id]) => Number(id));

        let newSelection: number[];

        switch (mods) {
          case "shift": // Add to existing
            newSelection = Array.from(
              new Set([...selectedNodesIds, ...inside])
            );
            break;

          case "ctrl": {
            const currentSet = new Set(selectedNodesIds);
            for (const id of inside) {
              if (currentSet.has(id)) currentSet.delete(id);
              else currentSet.add(id);
            }
            newSelection = Array.from(currentSet);
            break;
          }
          default: // none -> replace
            newSelection = inside;
            break;
        }

        return {
          selectedNodesIds: newSelection,
          squareSelection: null,
        };
      }),

    copySelection: () => {
      const ui = get();
      const sim = useSimStore.getState();
      const ids = ui.selectedNodesIds;
      if (!ids.length) return;

      // Copy node data
      const nodes = ids.map((id) => sim.nodes[id]);
      const positions = ids.reduce((acc, id) => {
        acc[id] = ui.nodePositions[id];
        return acc;
      }, {} as Record<number, Vec2>);

      // Copy only wires that fully connect two selected nodes
      const wires = Object.values(sim.wires).filter((w) => {
        const fromPin = sim.pins[w.from]; 
        const toPin = sim.pins[w.to];

        if (!fromPin || !toPin) return false; 

        const fromNode = fromPin.nodeId;
        const toNode = toPin.nodeId;
        return ids.includes(fromNode) && ids.includes(toNode);
      });

      setClipboard({ nodes, positions, wires });
    },

    pasteSelection: (mousePos?: Vec2) => {
      const sim = useSimStore.getState();
      const clipboard = getClipboard();
      if (!clipboard) return;

      const {
        nodes: oldNodes,
        positions: oldPositions,
        wires: oldWires,
      } = clipboard;
      if (!oldNodes.length) return;

      // compute bounding box center of copied nodes (based on oldPositions)
      const xs = Object.values(oldPositions).map((p) => p.x);
      const ys = Object.values(oldPositions).map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };

      const targetCenter = mousePos ?? { x: center.x + 80, y: center.y + 80 };
      const offset = {
        x: targetCenter.x - center.x,
        y: targetCenter.y - center.y,
      };

      const idMap: Record<number, number> = {};
      const newNodeIds: number[] = [];

      // Duplicate nodes in sim and set UI positions directly
      for (const oldNode of oldNodes) {
        if (!oldNode) continue;
        const newId = sim.addNode(oldNode.kind);
        idMap[oldNode.id] = newId;
        newNodeIds.push(newId);

        // copy params if any
        if (oldNode.data) {
          for (const [key, param] of Object.entries(oldNode.data)) {
            sim.setNodeParam(newId, key, param.value);
          }
        }

        // compute new position and write into UI store directly
        const oldPos = oldPositions[oldNode.id] ?? { x: 0, y: 0 };
        const newPos = { x: oldPos.x + offset.x, y: oldPos.y + offset.y };

        set((state) => ({
          nodePositions: { ...state.nodePositions, [newId]: newPos },
        }));
      }

      // get fresh stawte
      const freshSim = useSimStore.getState();

      // Duplicate wires between the new nodes
      for (const wire of oldWires) {
        const fromPin = freshSim.pins[wire.from];
        const toPin = freshSim.pins[wire.to];
        if (!fromPin || !toPin) continue;

        const newFromNode = idMap[fromPin.nodeId];
        const newToNode = idMap[toPin.nodeId];
        if (!newFromNode || !newToNode) continue;

        // find matching pin names on new nodes using fresh state
        const newFromPinId = freshSim.nodes[newFromNode]?.outputPins
          .map((pid) => freshSim.pins[pid])
          .find((p) => p && p.name === fromPin.name)?.id;

        const newToPinId = freshSim.nodes[newToNode]?.inputPins
          .map((pid) => freshSim.pins[pid])
          .find((p) => p && p.name === toPin.name)?.id;

        if (newFromPinId && newToPinId) {
          let newAnchors: Vec2[] | undefined = undefined;
          if (wire.anchors && wire.anchors.length > 0) {
            newAnchors = wire.anchors.map((anchor) => ({
              x: anchor.x + offset.x,
              y: anchor.y + offset.y,
            }));
          }

          freshSim.addWire(newFromPinId, newToPinId, newAnchors);
        } else {
          console.warn("pasteSelection: couldn't find matching pins for wire", {
            wireId: wire.id,
            fromPinName: fromPin.name,
            toPinName: toPin.name,
          });
        }
      }

      // Select newly pasted nodes
      set({ selectedNodesIds: newNodeIds });
    },

    deleteSelection: () => {
      const ui = get();
      const sim = useSimStore.getState();
      const ids = ui.selectedNodesIds;
      if (!ids.length) return;

      // Remove all wires connected to selected nodes
      const wiresToRemove = Object.values(sim.wires).filter(
        (w) =>
          ids.includes(sim.pins[w.from].nodeId) ||
          ids.includes(sim.pins[w.to].nodeId)
      );

      for (const w of wiresToRemove) {
        sim.disconnectWire(w.id);
      }

      // Remove nodes
      for (const id of ids) {
        sim.removeNode(id);
      }

      // Remove UI positions and pins
      set((state) => {
        const newPositions = { ...state.nodePositions };
        for (const id of ids) delete newPositions[id];
        return {
          nodePositions: newPositions,
          selectedNodesIds: [],
        };
      });
      pushHistoryDebounced();
    },

    duplicateSelection: () => {
      const ui = get();
      ui.copySelection();
      ui.pasteSelection();
    },

    setScale: (scale: number) =>
      set((s) => ({ view: { ...s.view, scale: scale } })),
    movePosition: (transform: (prev: Vec2) => Vec2) =>
      set((s) => ({
        view: { ...s.view, position: transform(s.view.position) },
      })),
    setPosition: (pos: Vec2) =>
      set((s) => ({ view: { ...s.view, position: pos } })),
    startWire: (fromPinId: number, startPos: Vec2) => {
      set({
        wireDraft: {
          fromPinId,
          anchors: [],
          currentPos: startPos,
        },
      });
    },

    addWireAnchor: (pos: Vec2) => {
      set((state) => {
        if (!state.wireDraft) return state;
        return {
          wireDraft: {
            ...state.wireDraft,
            anchors: [...state.wireDraft.anchors, pos],
          },
        };
      });
    },

    updateWirePos: (pos: Vec2) => {
      set((state) => {
        if (!state.wireDraft) return;
        state.wireDraft.currentPos = pos;
      });
    },

    removeLastAnchor: () => {
      set((state) => {
        if (!state.wireDraft) return state;

        if (state.wireDraft.anchors.length === 0) {
          return { wireDraft: null };
        }

        // Remove last anchor
        return {
          wireDraft: {
            ...state.wireDraft,
            anchors: state.wireDraft.anchors.slice(0, -1),
          },
        };
      });
    },

    completeWire: (toPinId: number) => {
      const { wireDraft } = get();
      const pins = useSimStore.getState().pins;
      const wires = useSimStore.getState().wires;

      if (!wireDraft) return;

      const fromPin = pins[wireDraft.fromPinId];
      const toPin = pins[toPinId];
      if (!fromPin || !toPin) return;

      // Ensure they are different nodes
      if (fromPin.nodeId === toPin.nodeId) {
        set({ wireDraft: null });
        return;
      }

      // Check that one is input and one is output
      let outputPin, inputPin;

      if (fromPin.type === "output" && toPin.type === "input") {
        outputPin = fromPin;
        inputPin = toPin;
      } else if (fromPin.type === "input" && toPin.type === "output") {
        outputPin = toPin;
        inputPin = fromPin;
      } else {
        // Clear the draft
        set({ wireDraft: null });
        return;
      }

      // Check if wire already exists
      const exists = Object.values(wires).some(
        (w) => w.from === outputPin.id && w.to === inputPin.id
      );
      if (exists) {
        set({ wireDraft: null });
        return;
      }

      // Add wire with anchor points
      useSimStore
        .getState()
        .addWire(
          outputPin.id,
          inputPin.id,
          wireDraft.anchors.length > 0 ? wireDraft.anchors : undefined
        );

      // Clear the draft
      set({ wireDraft: null });
      pushHistoryDebounced();
    },

    cancelWire: () => {
      set({ wireDraft: null });
    },
    setNodeTitle(id, title) {
      useSimStore.setState((s) => ({
        nodes: { ...s.nodes, [id]: { ...s.nodes[id], title: title } },
      }));
    },
    selectWire: (wireId: number | null) => {
      set({ selectedWireId: wireId });
    },

    startEditingWire: (wireId: number) => {
      set({
        editingWireId: wireId,
        selectedWireId: wireId,
      });
    },

    addAnchorToWire: (wireId: number, anchorIndex: number, position: Vec2) => {
      const sim = useSimStore.getState();
      const wire = sim.wires[wireId];
      if (!wire) return;

      const anchors = wire.anchors || [];
      const newAnchors = [
        ...anchors.slice(0, anchorIndex),
        position,
        ...anchors.slice(anchorIndex),
      ];

      useSimStore.setState((s) => ({
        wires: {
          ...s.wires,
          [wireId]: { ...wire, anchors: newAnchors },
        },
      }));
    },

    moveWireAnchor: (wireId: number, anchorIndex: number, position: Vec2) => {
      const sim = useSimStore.getState();
      const wire = sim.wires[wireId];
      if (!wire || !wire.anchors) return;

      const newAnchors = [...wire.anchors];
      newAnchors[anchorIndex] = position;

      useSimStore.setState((s) => ({
        wires: {
          ...s.wires,
          [wireId]: { ...wire, anchors: newAnchors },
        },
      }));
      pushHistoryDebounced();
    },

    removeWireAnchor: (wireId: number, anchorIndex: number) => {
      const sim = useSimStore.getState();
      const wire = sim.wires[wireId];
      if (!wire || !wire.anchors) return;

      const newAnchors = wire.anchors.filter((_, i) => i !== anchorIndex);

      useSimStore.setState((s) => ({
        wires: {
          ...s.wires,
          [wireId]: {
            ...wire,
            anchors: newAnchors.length > 0 ? newAnchors : undefined,
          },
        },
      }));
      pushHistoryDebounced();
    },

    finishEditingWire: () => {
      set({ editingWireId: null });
    },
  }))
);
