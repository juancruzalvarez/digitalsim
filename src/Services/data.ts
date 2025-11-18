import type { NodeKind } from "./types";

export const NodeTitleFromKind = (kind: NodeKind): string => {
    switch(kind) {
        case "note": return 'Note';
        case "const": return 'Signal';
        case "and": return 'AND';
        case "or": return 'OR';
        case "xor": return 'XOR';
        case "not": return 'NOT';
        case "nand": return 'NAND';
        case "nor": return 'NOR';
        case "xnor": return 'XNOR';
        case "clock": return 'Clock';
        case "split": return 'Split Signal'
        case "signalDisplay": return 'LED';
    }
} 
