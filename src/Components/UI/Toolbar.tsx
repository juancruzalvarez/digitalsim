import React, { useRef, useState, useEffect } from "react";
import { useProjectStore } from "../../Stores/projectStore";
import { useSimStore } from "../../Stores/simStore";
import { simulateStep } from "../../Services/simulation";
import {
  Save,
  FolderOpen,
  Undo,
  Redo,
  Play,
  Pause,
  SkipForward,
  HelpCircle,
} from "lucide-react";
import { HelpModal } from "./HelpModal";

export const Toolbar = () => {
  const projectName = useProjectStore((s) => s.projectName);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const saveProject = useProjectStore((s) => s.saveProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.canUndo());
  const canRedo = useProjectStore((s) => s.canRedo());

  // Simulation controls
  const simState = useSimStore((s) => s.simState);
  const setSimState = useSimStore((s) => s.setSimState);
  const [speed, setSpeed] = useState(1); // ticks per second
  const [showHelp, setShowHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadProject(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleSimulation = () => {
    setSimState(simState === "running" ? "paused" : "running");
  };

  // Auto tick loop
  useEffect(() => {
    if (simState !== "running") return;
    const interval = setInterval(() => simulateStep(), 1000 / speed);
    return () => clearInterval(interval);
  }, [simState, speed]);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-14 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 gap-4 z-50">
        {/* Project Name */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-neutral-700 text-white px-3 py-1.5 rounded text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 w-64"
          placeholder="Project Name"
        />

        {/* Save/Load */}
        <button
          onClick={saveProject}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          title="Save Project (Ctrl+S)"
        >
          <Save size={16} />
          Save
        </button>

        <button
          onClick={handleLoadClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-600 transition-colors"
          title="Load Project (Ctrl+O)"
        >
          <FolderOpen size={16} />
          Load
        </button>

        <div className="h-8 w-px bg-neutral-600" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>

        <div className="h-8 w-px bg-neutral-600" />

        {/* Simulation Controls */}
        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white transition-colors ${
            simState === "running"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
          title={simState === "running" ? "Pause" : "Play"}
        >
          {simState === "running" ? (
            <>
              <Pause size={16} />
              Pause
            </>
          ) : (
            <>
              <Play size={16} />
              Play
            </>
          )}
        </button>

        <button
          onClick={() => simulateStep()}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          title="Step"
        >
          <SkipForward size={16} />
        </button>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs text-neutral-300 whitespace-nowrap">
            Speed:
          </span>
          <input
            type="range"
            min={0.5}
            max={60}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-xs text-neutral-300 w-12 text-right">
            {speed} t/s
          </span>
        </div>

        <div className="flex-1" />

        {/* Help Button */}
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-600 transition-colors"
          title="Help"
        >
          <HelpCircle size={16} />
          Help
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".circuit.json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal setShowHelp={setShowHelp}/>
      )}
    </>
  );
};
