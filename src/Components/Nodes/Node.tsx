import { useSimStore } from "../../Stores/simStore";
import { BasicNode } from "./BasicNode";
import { ClockNode } from "./ClockNode";
import { NoteNode } from "./NoteNode";
import { SignalDisplayNode } from "./SignalDisplayNode";

type NodeProps = {
  id: number;
};

export const Node = ({ id }: NodeProps) => {
  const kind = useSimStore((s) => s.nodes[id].kind);

  switch (kind) {
    case "not":
    case "and":
    case "or":
    case "xor":
    case "nand":
    case "nor":
    case "xnor":
    case "const":
    case "split":
      return <BasicNode key={id} id={id} />;
    case "note":
      return <NoteNode key={id} id ={id} />
    case "clock":
      return (
        <ClockNode key ={id} id ={id} />
      );
    case "signalDisplay":
      return <SignalDisplayNode key ={id} id = {id} />
    default:
      return null;
  }
};
