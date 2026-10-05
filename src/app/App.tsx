import React, { useState } from 'react';
import { LoadingScreen } from '../screens/LoadingScreen';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { LandscapeGuard } from '../ui/LandscapeGuard';
import { GameStage } from '../game/GameStage';

type AppState = 'loading' | 'menu' | 'battle';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('loading');

  return (
    <main style={styles.container}>
      {/* 1. Блокировщик вертикальной ориентации */}
      <LandscapeGuard />

      {/* 2. Загрузочный экран с наполнением логотипа */}
      {state === 'loading' && (
        <LoadingScreen onLoaded={() => setState('menu')} />
      )}

      {/* 3. Главное меню с мармеладными кнопками */}
      {state === 'menu' && (
        <MainMenuScreen 
          onPlay={() => setState('battle')}
          onShop={() => alert('Магазин откроется скоро!')}
          onChests={() => alert('Сундуки откроются скоро!')}
        />
      )}

      {/* 4. Three.js поле битвы */}
      {state === 'battle' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <GameStage />
          <button 
            onClick={() => setState('menu')}
            style={styles.backButton}
          >
            ← В Меню
          </button>
        </div>
      )}
    </main>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000'
  },
  backButton: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#ffffff',
    border: '2px solid #555',
    borderRadius: '12px',
    padding: '8px 14px',
    fontFamily: '"Rubik", sans-serif',
    fontWeight: 700,
    cursor: 'pointer'
  }
};

export default App;
