import { useSimStore } from "../../Stores/simStore";
import { useUIStore } from "../../Stores/uiStore";
import { WireElement } from "./Wire";
import { WireDraft } from "./WireDraft";


export const Wires = () => {
  const connections = useSimStore((s) => s.wires);
  const draft = useUIStore((s) => s.wireDraft);

  return (
    <>
      {Object.values(connections).map((c) => (
        <WireElement 
          key={c.id} 
          wireId={c.id}
          fromPinId={c.from} 
          toPinId={c.to} 
          anchors={c.anchors}
        />
      ))}
      {draft && <WireDraft/>}
    </>
  );
};