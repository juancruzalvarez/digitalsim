import { useRef, useEffect, useCallback } from "react";
import { type Vec2 } from "../Services/types"; // your Vec2 type

type ViewportHooks = {
  pan: React.RefObject<Vec2>;
  scale: React.RefObject<number>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
};

export const useViewport = (
  containerRef: React.RefObject<HTMLDivElement|null>,
  nodesContainerRef: React.RefObject<HTMLDivElement|null>,
  svgRef: React.RefObject<SVGSVGElement|null>,
  gridRef: React.RefObject<SVGSVGElement|null>,
  setPanOffset: (pan: Vec2) => void,
  setScale: (scale: number) => void,
  initialPan: Vec2 = { x: 0, y: 0 },
  initialScale: number = 1
): ViewportHooks => {
  const pan = useRef<Vec2>({ ...initialPan });
  const targetPan = useRef<Vec2>({ ...initialPan });
  const scale = useRef(initialScale);
  const targetScale = useRef(initialScale);

  const isPanning = useRef(false);
  const panStart = useRef<Vec2>({ x: 0, y: 0 });
  const animFrame = useRef<number | null>(null);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const update = useCallback(() => {
    // Interpolate pan and scale
    pan.current.x = lerp(pan.current.x, targetPan.current.x, 0.2);
    pan.current.y = lerp(pan.current.y, targetPan.current.y, 0.2);
    scale.current = lerp(scale.current, targetScale.current, 0.2);

    const transform = `translate(${pan.current.x}px, ${pan.current.y}px) scale(${scale.current})`;
    if (nodesContainerRef.current)
      nodesContainerRef.current.style.transform = transform;
    if (svgRef.current)
      svgRef.current.setAttribute(
        "transform",
        `translate(${pan.current.x},${pan.current.y}) scale(${scale.current})`
      );
    if (gridRef.current)
      gridRef.current.setAttribute(
        "transform",
        `translate(${pan.current.x},${pan.current.y}) scale(${scale.current})`
      );

    const panDiff =
      Math.abs(pan.current.x - targetPan.current.x) +
      Math.abs(pan.current.y - targetPan.current.y);
    const scaleDiff = Math.abs(scale.current - targetScale.current);

    if (panDiff < 0.1 && scaleDiff < 0.01) {
      // commit to store after its settled.
      setPanOffset({ x: targetPan.current.x, y: targetPan.current.y });
      setScale(targetScale.current);
      animFrame.current = null;
      return;
    }

    animFrame.current = requestAnimationFrame(update);
  }, [gridRef, nodesContainerRef, setPanOffset, setScale, svgRef]);

  const startAnimation = useCallback(() => {
    if (!animFrame.current) {
      animFrame.current = requestAnimationFrame(update);
    }
  }, [update]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return; // middle click
    isPanning.current = true;
    panStart.current = {
      x: e.clientX - targetPan.current.x,
      y: e.clientY - targetPan.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    targetPan.current = {
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    };
    startAnimation();
  };

  const handleMouseUp = () => {
    if (!isPanning.current) return;
    isPanning.current = false;
    // commit final position
    setPanOffset({ ...targetPan.current });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newTargetScale = Math.max(
      0.2,
      Math.min(5, targetScale.current + direction * zoomFactor)
    );

    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const worldX = (mx - targetPan.current.x) / targetScale.current;
    const worldY = (my - targetPan.current.y) / targetScale.current;

    targetPan.current = {
      x: mx - worldX * newTargetScale,
      y: my - worldY * newTargetScale,
    };
    targetScale.current = newTargetScale;

    startAnimation();
  };

  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return {
    pan: pan,
    scale: scale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  };
};
