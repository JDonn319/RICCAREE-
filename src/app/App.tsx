import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { GameStage } from '../game/GameStage';

const checkIsPortrait = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

// ==========================================
// 1. ПОВОРОТ ЭКРАНА
// ==========================================
const LandscapeGuard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  if (!isPortrait) return null;

  return (
    <div style={styles.guardOverlay}>
      <div style={styles.guardCard}>
        <Smartphone size={56} color="#ffffff" strokeWidth={1.8} />
        <h2 style={styles.guardTitle}>RICAREE!</h2>
        <p style={styles.guardDesc}>PLEASE ROTATE YOUR DEVICE</p>
      </div>
    </div>
  );
};

// ==========================================
// 2. ЭКРАН ЗАГРУЗКИ (ТОЛЬКО В ГОРИЗОНТАЛИ)
// ==========================================
const LoadingScreen: React.FC<{ onLoaded: () => void; isPortrait: boolean }> = ({ onLoaded, isPortrait }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPortrait) return;

    const assets = [
      '/MainMenuBackground.png',
      '/RiccarLogo.png',
      '/play.png',
      '/shop.png',
      '/chests.png'
    ];

    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoaded, 250);
          return 100;
        }
        return prev + 1;
      });
    }, 18);

    return () => clearInterval(timer);
  }, [isPortrait, onLoaded]);

  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingCenter}>
        <div style={styles.loadingLogoBox}>
          <img src="/RiccarLogo.png" alt="Logo" style={styles.loadingLogoBase} draggable={false} />
          <img 
            src="/RiccarLogo.png" 
            alt="Logo" 
            style={{
              ...styles.loadingLogoActive,
              clipPath: `inset(${100 - progress}% 0 0 0)`
            }} 
            draggable={false} 
          />
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. КНОПКА (БЕЗ СВЕЧЕНИЯ, БЕЗ ТЕНЕЙ, ЧИСТЫЙ ТАП)
// ==========================================
const MenuButton: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...styles.btn,
        transform: pressed ? 'translateY(3px) scale(0.97)' : 'none'
      }}
    >
      <img src={src} alt={alt} style={styles.btnImg} draggable={false} />
    </button>
  );
};

// ==========================================
// 4. ГЛАВНОЕ МЕНЮ (ТОЧНО ПО РЕФЕРЕНСУ)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      {/* Чистый фон */}
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      {/* Единый центральный блок: Огромное лого прямо над кнопками */}
      <div style={styles.centerBlock}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuLogo} draggable={false} />

        <div style={styles.btnStack}>
          <MenuButton src="/play.png" alt="PLAY" />
          <MenuButton src="/shop.png" alt="SHOP" />
          <MenuButton src="/chests.png" alt="CHESTS" />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. APP ROOT
// ==========================================
type ScreenState = 'loading' | 'menu' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('loading');
  const [isPortrait, setIsPortrait] = useState<boolean>(checkIsPortrait);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <main style={styles.root}>
      {/* Отключение любых рамок, контуров и подсветки браузера */}
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          outline: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        button {
          outline: none !important;
          border: none !important;
          background: transparent !important;
        }
      `}</style>

      <LandscapeGuard isPortrait={isPortrait} />

      {screen === 'loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} isPortrait={isPortrait} />
      )}

      {screen === 'menu' && <MainMenu />}

      {screen === 'battle' && <GameStage />}
    </main>
  );
};

// ==========================================
// СТИЛИ (ПОЛНЫЙ НОЛЬ ТЕНЕЙ, ГРАДИЕНТОВ И СВЕЧЕНИЙ)
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    fontFamily: 'sans-serif'
  },
  // Guard
  guardOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    backgroundColor: '#0d0203',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  guardCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  guardTitle: {
    margin: 0,
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 900
  },
  guardDesc: {
    margin: 0,
    color: '#9e898b',
    fontSize: '13px'
  },
  // Loading
  loadingContainer: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#1b0607',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000
  },
  loadingCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    width: '100%',
    height: '100%'
  },
  loadingLogoBox: {
    position: 'relative',
    width: '70vw',
    maxWidth: '520px',
    height: '45vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingLogoBase: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    opacity: 0.15
  },
  loadingLogoActive: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  progressTrack: {
    width: '180px',
    maxWidth: '45vw',
    height: '6px',
    backgroundColor: '#000000',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#b81e18',
    transition: 'width 0.08s linear'
  },
  // Меню
  menuContainer: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuBg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    pointerEvents: 'none'
  },
  // ЦЕНТРАЛЬНЫЙ БЛОК МЕНЮ
  centerBlock: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '8px'
  },
  // РЕАЛЬНО ОГРОМНЫЙ ЛОГОТИП
  menuLogo: {
    width: '46vw',
    maxWidth: '420px',
    height: 'auto',
    maxHeight: '42vh',
    objectFit: 'contain'
  },
  // СТЕК КНОПОК
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'center'
  },
  // ЧИСТАЯ КНОПКА (БЕЗ СВЕЧЕНИЯ, БЕЗ ФОНА, БЕЗ ТЕНЕЙ)
  btn: {
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    transition: 'transform 0.05s ease-out'
  },
  btnImg: {
    width: '24vw',
    maxWidth: '210px',
    height: 'auto',
    objectFit: 'contain',
    pointerEvents: 'none'
  }
};

export default App;
