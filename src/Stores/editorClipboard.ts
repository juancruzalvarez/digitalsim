import type { Node, Wire, Vec2 } from '../Services/types';

export type EditorClipboard = {
  nodes: Node[];
  positions: Record<number, Vec2>;
  wires: Wire[];
} | null;

let clipboard: EditorClipboard = null;

export const setClipboard = (data: EditorClipboard) => {
  clipboard = data;
};
export const getClipboard = () => clipboard;
export const clearClipboard = () => {
  clipboard = null;
};