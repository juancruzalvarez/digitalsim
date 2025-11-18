import { useState, useRef, useEffect } from "react";
import type { NodeKind } from "../../Services/types";

type AddNodeSearchProps = {
  x: number;
  y: number;
  onSelect: (kind: NodeKind) => void;
  onCancel: () => void;
};

type NodeOption = {
  kind: NodeKind;
  name: string;
  description: string;
};

//TODO: this should be in data ??
const options: NodeOption[] = [
  { kind: "note", name: "Note", description: "Add editable text." },
  { kind: "const", name: "Signal", description: "Outputs a constant signal (0 | 1)." },
  { kind: "not", name: "NOT", description: "Outputs the opposite of the input (0->1, 1->0)." },
  { kind: "and", name: "AND", description: "Outputs 1 when both inputs are 1." },
  { kind: "or", name: "OR", description: "Outputs 1 when either input is 1." },
  { kind: "xor", name: "XOR", description: "Outputs 1 when inputs are different." },
  { kind: "nand", name: "NAND", description: "Same as AND, but negated." },
  { kind: "nor", name: "NOR", description: "Same as OR, but negated." },
  { kind: "xnor", name: "XNOR", description: "Same as XOR, but negated." },
  { kind: "signalDisplay", name: "Signal Display", description: "LED Light!"},
  { kind: "clock", name: "Clock", description: "Turns on every 'period' ticks."},
  { kind: "split", name: "Split", description: "Splits input signal into two!"},

];

export const AddNodeSearch = ({ x, y, onSelect, onCancel }: AddNodeSearchProps) => {
  const [inputValue, setInputValue] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    // Focus the input at start
    inputRef.current?.focus();
  }, []);

  // Detect outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  const handleSelect = (value: NodeOption) => {
    setInputValue(value.name);
    onSelect(value.kind);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(filteredOptions[highlightIndex]);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-20 w-80 custom-scrollbar"
      style={{ top: y - 20, left: x -160 }}
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => {
        e.stopPropagation();  // Stops it from bubbling to canvas
        e.preventDefault();   // Prevents canvas from interpreting it
        }}
    >
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search node to add..."
        className="w-full bg-neutral-900 border border-neutral-600 text-white placeholder-neutral-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"

      />

      {filteredOptions.length > 0 && (
        <div className="mt-1 bg-neutral-950 border border-neutral-600 rounded shadow-lg max-h-48 overflow-auto">
          {filteredOptions.map((opt, idx) => (
            <div
              key={opt.kind}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                idx === highlightIndex
                    ? "bg-blue-500 text-black"
                    : "hover:bg-neutral-800 text-white"
                }`}
              onMouseEnter={() => setHighlightIndex(idx)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
              onClick={() => handleSelect(opt)}
            >
              <div className="font-medium">{opt.name}</div>
                <div className={ `text-sm ${
                idx === highlightIndex
                    ? " text-black"
                    : " text-white"
                }`}>{opt.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};