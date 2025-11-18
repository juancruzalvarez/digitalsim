import { useEffect } from "react";
import { useUIStore } from "../../Stores/uiStore";


export const WireDraftWatcher = ({ containerRef, pan, scale }) => {
  const wireDraft = useUIStore((s) => s.wireDraft);
  const updateWirePos = useUIStore((s) => s.updateWirePos);

  useEffect(() => {
    if (!wireDraft) return;

    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.current.x) / scale.current;
      const y = (e.clientY - rect.top - pan.current.y) / scale.current;
      updateWirePos({ x, y });
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, [wireDraft, pan, scale, updateWirePos, containerRef]);

  return null;
};