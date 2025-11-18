# 🔌 Digital Circuit Simulator

Live site: https://juancruzalvarez.github.io/digitalsim/

A visual circuit design tool built with React, TypeScript, and Zustand. Create and simulate digital logic circuits with an intuitive drag-and-drop interface.
npm 
Built as a showcase project exploring React state management and canvas-like UIs


![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Zustand](https://img.shields.io/badge/Zustand-State-orange.svg)

## ✨ Features

- **Visual Editor** - Infinite canvas with pan/zoom and drag-and-drop nodes
- **Smart Wiring** - Click-to-connect with anchor points for clean routing
- **Live Simulation** - Real-time circuit execution with adjustable speed
- **Full History** - Undo/redo with 50-step memory
- **Save/Load** - Export projects as JSON files
- **Logic Gates** - AND, OR, XOR, NOT, NAND, NOR, XNOR
- **Components** - Clock generators, signal displays, and notes

## 🎮 Controls

| Action | Shortcut |
|--------|----------|
| Add Node | `Right Click` |
| Create Wire | `Click Pin → Click Pin` |
| Add Wire Anchor | `Click Empty Space` (while wiring) |
| Undo/Redo | `Ctrl+Z` / `Ctrl+Y` |
| Save/Load | `Ctrl+S` / `Ctrl+O` |
| Pan Canvas | `Middle Mouse` or `Space + Drag` |
| Zoom | `Mouse Wheel` |

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🏗️ Tech Stack

- **React 18** + **TypeScript** - UI and type safety
- **Zustand** with Immer - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 📁 Architecture

```
src/
├── Components/    # UI components (nodes, wires, canvas)
├── Stores/        # Zustand stores (ui, sim, project)
├── Services/      # Types and simulation logic
└── Hooks/         # Custom React hooks
```

## 🎯 Key Implementation Details

- **Three-store architecture**: UI state, simulation state, and project management separated.
- **Anchor-based wire routing**: Click-to-place system with editable waypoints.
- **Debounced history**: Automatic history tracking with debouncing.
- **Optimized rendering**: Selective subscriptions to prevent unnecessary re-renders.

---
