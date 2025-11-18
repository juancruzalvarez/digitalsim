import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  type Vec2,
  type Node,
  type Param,
  type Pin,
  type Wire,
  type SimState,
  type NodeKind,
} from "../Services/types";
import { simulateStep } from "../Services/simulation";
import { useProjectStore } from "./projectStore";

export interface WireDraft {
  fromPinId: number;
  toPinId?: number;
  currentPos: Vec2;
}

const pushHistoryDebounced = (() => {
  let timeout: number;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      useProjectStore.getState().pushHistory();
    }, 500); // Push to history 500ms after last change
  };
})();

type SimStore = {
  nodes: Record<number, Node>;
  pins: Record<number, Pin>;
  wires: Record<number, Wire>;
  nextId: number;
  nextPinId: number;
  nextWireId: number;
  currentTick: number;
  simState: SimState;

  addNode: (kind: NodeKind) => number;
  removeNode: (id: number) => void;
  disconnectWire: (wireId: number) => void;
  disconnectPin: (pinId: number) => void;
  addWire: (fromPinId: number, toPinId: number, anchors?: Vec2[]) => void;
  setNodeParam: (
    id: number,
    name: string,
    value: number | boolean | string
  ) => void;
  setSimState: (state: SimState) => void;
  tick: () => void;
};

export const useSimStore = create<SimStore>((set, get) => ({
  nodes: {},
  pins: {},
  wires: {},
  nextId: 1,
  nextPinId: 1,
  nextWireId: 1,
  currentTick: 0,
  simState: "paused",

  addNode: (kind: NodeKind) => {
    // TODO: This seems hacky...
    // Should probably find other way to abstract all node data, and creation, so that its easier to add new node types.
    const id = get().nextId;
    const pinStartId = get().nextPinId;

    let inputLabels: string[] = [];
    let outputLabels: string[] = [];
    let data: Record<string, Param> | undefined = undefined;

    switch (kind) {
      case "not":
        inputLabels = ["In"];
        outputLabels = ["Out"];
        break;

      case "and":
      case "or":
      case "xor":
      case "nand":
      case "nor":
      case "xnor":
        inputLabels = ["A", "B"];
        outputLabels = ["Out"];
        break;

      case "const":
        outputLabels = ["Out"];
        data = {
          Value: { name: "Value", kind: "digital", value: 0 },
        };
        break;

      case "clock":
        outputLabels = ["Out"];
        data = {
          period: { name: "Period", kind: "numerical", value: 10 },
          i: { name: "Offset", kind: "numerical", value: 0 },
        };
        break;

      case "split":
        inputLabels = ["In"];
        outputLabels = ["A", "B"];
        break;

      case "note":
        data = {
          note: { name: "Note", kind: "string", value: "nothing to note!" },
        };
        break;

      case "signalDisplay":
        inputLabels = ["In"];
        outputLabels = ["Out"];
        break;
      default:
        throw new Error(`Unsupported node kind: ${kind}`);
    }

    const newPins: Record<number, Pin> = {};
    const inputPins: number[] = [];
    const outputPins: number[] = [];

    let pinId = pinStartId;

    // create inputs
    for (const label of inputLabels) {
      newPins[pinId] = {
        id: pinId,
        nodeId: id,
        name: label,
        value: 0,
        type: "input",
      };
      inputPins.push(pinId);
      pinId++;
    }

    // create outputs
    for (const label of outputLabels) {
      newPins[pinId] = {
        id: pinId,
        nodeId: id,
        name: label,
        value: 0,
        type: "output",
      };
      outputPins.push(pinId);
      pinId++;
    }

    const newNode: Node = {
      id,
      kind,
      inputPins,
      outputPins,
      data,
    };

    set((state) => ({
      nodes: { ...state.nodes, [id]: newNode },
      pins: { ...state.pins, ...newPins },
      nextId: id + 1,
      nextPinId: pinId,
    }));

    return id;
  },
  removeNode: (id) => {
    set((state) => {
      const newNodes = { ...state.nodes };
      delete newNodes[id];

      const newPins = Object.fromEntries(
        Object.entries(state.pins).filter(([_, pin]) => pin.nodeId !== id)
      );

      const invalidPinIds = new Set(
        Object.keys(state.pins)
          .filter((pid) => state.pins[+pid].nodeId === id)
          .map((pid) => +pid)
      );

      const newWires = Object.fromEntries(
        Object.entries(state.wires).filter(([_, wire]) => {
          return !invalidPinIds.has(wire.from) && !invalidPinIds.has(wire.to);
        })
      );

      return { nodes: newNodes, pins: newPins, wires: newWires };
    });
  },
  addWire: (fromPinId: number, toPinId: number, anchors?: Vec2[]) => {
    const newId = get().nextWireId;
    set({
      nextWireId: get().nextWireId + 1,
      wires: {
        ...get().wires,
        [newId]: {
          id: newId,
          from: fromPinId,
          to: toPinId,
          anchors: anchors, 
        },
      },
    });
  },
  disconnectPin: (id) => {

    set((state) => {
      const wires = { ...state.wires };
      Object.values(wires)
      .filter( wire => id === wire.from || id === wire.to )
      .forEach(wire => delete wires[wire.id]);
      return { wires };
    });
    pushHistoryDebounced();
  },
  disconnectWire: (id) => {
    set((state) => {
      const wires = { ...state.wires };
      delete wires[id];
      return { wires };
    });
    pushHistoryDebounced();
  },
  setNodeParam: (id, name, value) => {
    // TODO: this feels bad
    set((state) => {
      const node = state.nodes[id];

      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            data: {
              ...(node.data || {}),
              [name]: {
                ...(node.data?.[name] || {
                  name: name,
                  kind: "numerical",
                  value: 0,
                }),
                value: value,
              },
            },
          },
        },
      };
    });
    simulateStep();
   
  },

  tick: () => {
    //console.log("ticked!");
  },
  setSimState: (state) => set(() => ({ simState: state })),
}));
