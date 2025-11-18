import { useEffect, useRef } from "react";
import { useUIStore } from "../../Stores/uiStore";
import { useSimStore } from "../../Stores/simStore";


type PinProps = {
  id: number;
  isInput: boolean;
  nodeId: number;
  parentNodeRef: React.RefObject<HTMLDivElement | null> ;
};

export const Pin = ({ id, isInput, nodeId, parentNodeRef }: PinProps) => {
  const { name, value } = useSimStore((s) => s.pins[id]);
  const setPinPos = useUIStore((s) => s.setPinPos);
  const ref = useRef<HTMLDivElement>(null);
  const GetScale = useUIStore(s => s.view.scale);
  const startWire = useUIStore((s) => s.startWire);
  const completeWire = useUIStore((s) => s.completeWire);
  const wireDraft = useUIStore((s) => s.wireDraft);
  const disconnectPin = useSimStore(s => s.disconnectPin); 

  // runned once on mount, calculates position of the pin relative to the node, for wire rendering.
  useEffect(() => {
    const el = ref.current;
    if (!el || !nodeId) return;

    const container = document.getElementById("canvas-container");
    if (!container) return;

    const pinRect = el.getBoundingClientRect();

    let localPos = {x:0,y:0}
    if(parentNodeRef && parentNodeRef.current){
        const relativeX = ((pinRect.left+pinRect.width/2) - parentNodeRef.current.getBoundingClientRect().left) / GetScale;
        const relativeY = ((pinRect.top+pinRect.height/2)  - parentNodeRef.current.getBoundingClientRect().top) / GetScale;
        localPos = {
            x: relativeX,
            y: relativeY,
        };
    }
    
    setPinPos(id, {
      x: localPos.x,
      y: localPos.y,
    });
  }, []);

  const handleOnMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(e.button)
    if(e.button === 2) {
      disconnectPin(id);
    }else if(e.button === 0){
      if (!wireDraft) {
      // Start a new wire
      startWire(id, { x: 0, y: 0 });
    } else {
      // Complete the wire
      completeWire(id);
    }
    }
    
  };

  return (
    <div 
      ref={ref} 
      className="flex items-center gap-2"
      onMouseDown={handleOnMouseDown}
    >
      {isInput ? (
        <>
          <div
            className={`transition-transform duration-150 transform hover:scale-135 origin-center w-3 h-3 rounded-full ${
              value == 1 ? "bg-blue-500" : "border-2 border-white"
            }`}
          />
          <span className="text-white whitespace-nowrap">{name}</span>
        </>
      ) : (
        <>
          <span className="text-white whitespace-nowrap">{name}</span>
          <div
            className={`transition-transform duration-150 transform hover:scale-135 origin-center w-3 h-3 rounded-full ${
              value == 1 ? "bg-blue-500" : "border-2 border-white"
            }`}
          />
        </>
      )}
    </div>
  );
};