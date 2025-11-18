import { useEffect } from 'react';
import InfiniteGridCanvas from './Components/Canvas/Canvas'
import { useProjectStore } from './Stores/projectStore';
import { Toolbar } from './Components/UI/Toolbar';
function App() {
  useEffect(() => {
    const hasHistory = useProjectStore.getState().history.length > 0;
    if (!hasHistory) {
      useProjectStore.getState().pushHistory();
    }
  }, []);
  return (
    <div style= {{width: '100vw', height:'100vh'}}>
      <Toolbar />
      <InfiniteGridCanvas />
    </div>
  )
}

export default App
