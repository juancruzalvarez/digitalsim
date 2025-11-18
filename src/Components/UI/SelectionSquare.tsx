import { useUIStore } from "../../Stores/uiStore";

export const SelectionSquare = () => {

    const square = useUIStore(s => s.squareSelection);
    return (<>{
        square && 
        <div 
        className="absolute bg-blue-500/20 border-4 border-blue-400/80 pointer-events-none"
        style={{
            left: square.start.x,
            top: square.start.y,
            width: square.end.x - square.start.x,
            height: square.end.y - square.start.y,
        }} />
    }</>);
        

}