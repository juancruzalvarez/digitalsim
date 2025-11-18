
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ProjectState, HistoryEntry } from "../Services/types";
import { useSimStore } from "./simStore";
import { useUIStore } from "./uiStore";

type ProjectStore = {
  projectName: string;
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;

  setProjectName: (name: string) => void;
  saveProject: () => void;
  loadProject: (file: File) => Promise<void>;
  exportProject: () => string;
  
  // Undo/Redo
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projectName: "Untitled Project",
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  setProjectName: (name: string) => {
    set({ projectName: name });
  },

  saveProject: () => {
    const state = get().exportProject();
    const blob = new Blob([state], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${get().projectName}.circuit.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  loadProject: async (file: File) => {
    try {
      const text = await file.text();
      const data: ProjectState = JSON.parse(text);

      // Validate version
      // TODO: is this really needed
      if (data.version !== "1.0") {
        throw new Error("Unsupported project version");
      }

      // Clear current state
      set({ 
        projectName: data.projectName,
        history: [],
        historyIndex: -1 
      });

      // Load into stores
      useSimStore.setState({
        nodes: data.nodes,
        pins: data.pins,
        wires: data.wires,
        nextId: data.nextId,
        nextPinId: data.nextPinId,
        nextWireId: data.nextWireId,
      });

      useUIStore.setState({
        nodePositions: data.nodePositions,
        selectedNodesIds: [],
        selectedWireId: null,
        editingWireId: null,
        wireDraft: null,
      });

      // Push initial state to history
      get().pushHistory();
    } catch (error) {
      console.error("Failed to load project:", error);
      alert("Failed to load project file");
    }
  },

  exportProject: () => {
    const sim = useSimStore.getState();
    const ui = useUIStore.getState();

    const state: ProjectState = {
      projectName: get().projectName,
      version: "1.0",
      nodes: sim.nodes,
      pins: sim.pins,
      wires: sim.wires,
      nodePositions: ui.nodePositions,
      nextId: sim.nextId,
      nextPinId: sim.nextPinId,
      nextWireId: sim.nextWireId,
    };

    return JSON.stringify(state, null, 2);
  },

  pushHistory: () => {
    const sim = useSimStore.getState();
    const ui = useUIStore.getState();

    const entry: HistoryEntry = {
      simState: {
        nodes: JSON.parse(JSON.stringify(sim.nodes)),
        pins: JSON.parse(JSON.stringify(sim.pins)),
        wires: JSON.parse(JSON.stringify(sim.wires)),
        nextId: sim.nextId,
        nextPinId: sim.nextPinId,
        nextWireId: sim.nextWireId,
      },
      uiState: {
        nodePositions: JSON.parse(JSON.stringify(ui.nodePositions)),
      },
    };

    set((state) => {
      // Remove any history after current index
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      
      // Add new entry
      newHistory.push(entry);

      // Limit history size
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];

    useSimStore.setState(entry.simState);
    useUIStore.setState({ nodePositions: entry.uiState.nodePositions });

    set({ historyIndex: newIndex });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];

    useSimStore.setState(entry.simState);
    useUIStore.setState({ nodePositions: entry.uiState.nodePositions });

    set({ historyIndex: newIndex });
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
}));
