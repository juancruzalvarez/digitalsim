import type { JSX } from "react";

export const Grid = () => {
    const gridSpacing = 30;
    const start = -5000;
    const end = 5000;
    const strokeWidth = 1; 

    // Generate grid lines
    const lines: JSX.Element[] = [];
    
    for (let x = start; x <= end; x += gridSpacing) {
        lines.push(
            <line
            key={`v-${x}`}
            x1={x}
            y1={start}
            x2={x}
            y2={end}
            stroke={Math.round(x/gridSpacing)%10?"#ccc":"#888"}
            strokeWidth={Math.round(x/gridSpacing)%30?strokeWidth:strokeWidth*3}
            />,
        );
    }

    for (let y = start; y <= end; y += gridSpacing) {
        lines.push(
            <line
            key={`h-${y}`}
            x1={start}
            y1={y}
            x2={end}
            y2={y}
            stroke={Math.round(y/gridSpacing)%10?"#ccc":"#888"}
            strokeWidth={Math.round(y/gridSpacing)%30?strokeWidth:strokeWidth*3}
            />,
        );
    }

    return (
        <>
            {lines}
        </>
    );
};
