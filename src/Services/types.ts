export type Signal = 0 | 1 | undefined;

export type Vec2 = {x: number, y: number};

export type View = {
  position: Vec2,
  scale: number,
};

export type NodeKind =
  | 'note'
  | 'const'
  | 'and'
  | 'or'
  | 'xor'
  | 'not'
  | 'nand'
  | 'nor'
  | 'xnor'
  | 'clock'
  | 'split'
  | 'signalDisplay';

export type Pin = {
  id: number;
  nodeId: number;
  name: string; // e.g., 'A', 'B', 'OUT'
  value: Signal;
  type: 'input' | 'output';
};

export type Wire = {
  id: number;
  from: number; // output pin ID
  to: number;   // input pin ID
  anchors?: Vec2[]; // Optional anchor points for routing
};

export interface WireDraft {
  fromPinId: number;
  anchors: Vec2[];  // Array of anchor points
  currentPos: Vec2; // Current mouse position
}

export type ParamKind = 'numerical' | 'digital' | 'bool' | 'string';

export type Param = {
    name: string;
    kind: ParamKind;
    value: number | boolean | string;
}

export type Node = {
  id: number;
  kind: NodeKind;
  inputPins: number[];  // pin IDs
  outputPins: number[]; // pin IDs
  title?: string;
  data?: Record<string, Param>; // for storing clock/switch state, period, etc.
};

export type SimulationState = {
  tick: number;
  nodes: Node[];
  pins: Record<number, Pin>; // all pins by ID
  wires: Wire[];
};


export type SimState = 'paused' | 'running' | 'error';


export type ProjectState = {
  projectName: string;
  version: string;
  nodes: Record<number, Node>;
  pins: Record<number, Pin>;
  wires: Record<number, Wire>;
  nodePositions: Record<number, Vec2>;
  nextId: number;
  nextPinId: number;
  nextWireId: number;
};

export type HistoryEntry = {
  simState: {
    nodes: Record<number, Node>;
    pins: Record<number, Pin>;
    wires: Record<number, Wire>;
    nextId: number;
    nextPinId: number;
    nextWireId: number;
  };
  uiState: {
    nodePositions: Record<number, Vec2>;
  };
};