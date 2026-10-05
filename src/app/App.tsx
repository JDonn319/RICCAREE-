import React from 'react';
import { GameStage } from '../game/GameStage';
import { LandscapeGuard } from '../ui/LandscapeGuard';

const App: React.FC = () => {
  return (
    <main style={styles.appContainer}>
      <LandscapeGuard />
      <GameStage />
    </main>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000'
  }
};

export default App;
