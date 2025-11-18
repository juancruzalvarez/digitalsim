import { type Node, type Wire, type Pin } from "./types";
import { useSimStore } from "../Stores/simStore";
import { type Signal } from "./types";

export const simulateStep = () => {
  console.log('here')
  const { nodes, pins, wires } = useSimStore.getState();

  let tick = useSimStore.getState().currentTick ?? 0;
  tick++;

  const pinsCopy = { ...pins }; // local copy for mutation safety

  // Evaluate clocks and constants first
  //console.log('const eval')
  for (const nodeId in nodes) {
    const node = nodes[nodeId];
    if (node.kind === "clock" || node.kind === "const") {
      evaluateNode(node, pinsCopy, tick);
    }
  }

  propagate(pinsCopy, wires);

  // Iterate until stable
  let changed = true;
  let step = 0;
    //console.log('ITERATE STABLE ------------')

  while (changed && step++ < 100) {
    //console.log('step:', step)

    changed = false;

    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      if (node.kind === "clock" || node.kind === "const") continue;
      const didChange = evaluateNode(node, pinsCopy, tick);
      if (didChange) changed = true;
    }

    propagate(pinsCopy, wires);
  }

  if (step >= 100) {
    // TODO: add proper user error display for oscilations.
    console.warn("Oscillation detected");
  }


  // Commit updates efficiently
  useSimStore.setState({ pins: pinsCopy, currentTick: tick });
};

const evaluateNode = (
  node: Node,
  pins: Record<number, Pin>,
  tick: number
): boolean => {
  const inputVals = node.inputPins.map((id) => pins[id]?.value);
  const outputVal: Signal[] = [];
          console.log('evaluate:', node)

  switch (node.kind) {
    case "and":
      outputVal.push(inputVals.every((v) => v === 1) ? 1 : 0);
      break;
    case "or":
      outputVal.push(inputVals.some((v) => v === 1) ? 1 : 0);
      break;
    case "xor":
      outputVal.push((inputVals[0]||0)^(inputVals[1]||0) ? 1 : 0);
      break;
    case "not":
      outputVal.push( inputVals[0] === 1 ? 0 : 1);
      break;
    case "nand":
      outputVal.push(inputVals.every((v) => v === 1) ? 0 : 1);
      break;
    case "nor":
      outputVal.push(inputVals.some((v) => v === 1) ? 0 : 1);
      break;
    case "xnor":
      outputVal.push((inputVals[0]||0)^(inputVals[1]||0) ? 0 : 1);
      break;
    case "const": {
      const val = node.data?.Value?.value ?? 0;
      outputVal.push(val ? 1 : 0);
      break;
    }
    case "clock": {
      const period = Number(node.data?.period?.value ?? 2);
      const isHigh = (tick % period);
      outputVal.push(!isHigh ? 1 : 0);
      break;
    }
    case "split": {
      // Just passes input to two outputs
      outputVal.push(inputVals[0]);
      outputVal.push(inputVals[0]);
      break;
    }
    case "signalDisplay": {
      outputVal.push(inputVals[0]);
      break;
    }
  }
  //console.log('evaluated to:', outputVal)
  let changed = false;
  node.outputPins.forEach((id, i) => {
    const currentVal = pins[id]?.value;
    if (currentVal !== outputVal[i]) {
      // replace instead of mutating
      pins[id] = { ...pins[id], value: outputVal[i] };
      changed= true;
    }
  })



  return changed;
};

const propagate = (
  pins: Record<number, Pin>,
  wires: Record<number, Wire>
) => {
  for (const wireId in wires) {
    const wire = wires[wireId];
    const fromVal = pins[wire.from]?.value;
    pins[wire.to] = { ...pins[wire.to], value: fromVal };
  }
};


