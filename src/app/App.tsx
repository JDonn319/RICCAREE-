import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { GameStage } from '../game/GameStage';

const checkIsPortrait = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

// ==========================================
// 1. БЛОКИРОВЩИК ПОВОРОТА ЭКРАНА
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
// 2. ЭКРАН ЗАГРУЗКИ (ПРЕДЗАГРУЗКА ВСЕХ КАРТИНОК)
// ==========================================
const LoadingScreen: React.FC<{ onLoaded: () => void; isPortrait: boolean }> = ({ onLoaded, isPortrait }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPortrait) return;

    // Кешируем меню, фоны панорамы и башни
    const assets = [
      '/MainMenuBackground.png',
      '/RiccarLogo.png',
      '/play.png',
      '/shop.png',
      '/chests.png',
      '/solo.png',
      '/duo.png',
      '/backpart1.png',
      '/backpart2.png',
      '/backpart3.png',
      '/tower.png',
      '/etower1.png'
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
        return prev + 2;
      });
    }, 16);

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
// 3. БАЗОВАЯ КНОПКА ГЛАВНОГО МЕНЮ
// ==========================================
const MenuButton: React.FC<{ src: string; alt: string; onClick?: () => void }> = ({ src, alt, onClick }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        if (onClick) onClick();
      }}
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
// 4. СТВОРКА РЕЖИМА НА ВЕСЬ ЭКРАН
// ==========================================
const FullscreenModeHalf: React.FC<{
  side: 'left' | 'right';
  imgSrc: string;
  alt: string;
  isOpen: boolean;
  onSelect: () => void;
}> = ({ side, imgSrc, alt, isOpen, onSelect }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        onSelect();
      }}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...styles.fullscreenHalf,
        left: side === 'left' ? 0 : '50%',
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)'
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        style={{
          ...styles.fullImg,
          transform: pressed ? 'scale(0.98)' : 'scale(1)'
        }}
        draggable={false}
      />
    </div>
  );
};

// ==========================================
// 5. ГЛАВНОЕ МЕНЮ
// ==========================================
const MainMenu: React.FC<{ onStartSolo: () => void }> = ({ onStartSolo }) => {
  const [modesOpen, setModesOpen] = useState(false);

  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      <div style={styles.centerBlock}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuLogo} draggable={false} />

        <div style={styles.btnStack}>
          <MenuButton src="/play.png" alt="PLAY" onClick={() => setModesOpen(true)} />
          <MenuButton src="/shop.png" alt="SHOP" />
          <MenuButton src="/chests.png" alt="CHESTS" />
        </div>
      </div>

      {modesOpen && (
        <button onClick={() => setModesOpen(false)} style={styles.closeBtn}>
          ✕ BACK
        </button>
      )}

      {/* СЛЕВА — SOLO */}
      <FullscreenModeHalf
        side="left"
        imgSrc="/solo.png"
        alt="SOLO"
        isOpen={modesOpen}
        onSelect={onStartSolo}
      />

      {/* СПРАВА — DUO */}
      <FullscreenModeHalf
        side="right"
        imgSrc="/duo.png"
        alt="DUO"
        isOpen={modesOpen}
        onSelect={() => console.log('DUO')}
      />
    </div>
  );
};

// ==========================================
// 6. APP ROOT
// ==========================================
type ScreenState = 'init_loading' | 'menu' | 'battle_loading' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('init_loading');
  const [isPortrait, setIsPortrait] = useState<boolean>(checkIsPortrait);
  const [isFadingToBlack, setIsFadingToBlack] = useState<boolean>(false);
  const [isRevealingGame, setIsRevealingGame] = useState<boolean>(false);

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

  // Переход при нажатии на SOLO
  const handleStartSolo = () => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setScreen('battle_loading');
      setIsFadingToBlack(false);
    }, 400);
  };

  const handleBattleLoaded = () => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setScreen('battle');
      setIsFadingToBlack(false);
      setIsRevealingGame(true);
      setTimeout(() => setIsRevealingGame(false), 400);
    }, 300);
  };

  return (
    <main style={styles.root}>
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

      {screen === 'init_loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} isPortrait={isPortrait} />
      )}

      {screen === 'menu' && <MainMenu onStartSolo={handleStartSolo} />}

      {screen === 'battle_loading' && (
        <LoadingScreen onLoaded={handleBattleLoaded} isPortrait={isPortrait} />
      )}

      {screen === 'battle' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <GameStage />
          <button onClick={() => setScreen('menu')} style={styles.inGameBackBtn}>
            ← MENU
          </button>
        </div>
      )}

      {/* Оверлей плавного перехода */}
      <div 
        style={{
          ...styles.fadeCurtain,
          opacity: isFadingToBlack || isRevealingGame ? 1 : 0,
          pointerEvents: isFadingToBlack || isRevealingGame ? 'all' : 'none'
        }} 
      />
    </main>
  );
};

// ==========================================
// СТИЛИ
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    fontFamily: '-apple-system, sans-serif'
  },
  fadeCurtain: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#000000',
    zIndex: 99998,
    transition: 'opacity 0.4s ease-in-out'
  },
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
  menuLogo: {
    width: '46vw',
    maxWidth: '420px',
    height: 'auto',
    maxHeight: '42vh',
    objectFit: 'contain'
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'center'
  },
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
    height: '38px',
    maxHeight: '9.5vh',
    width: 'auto',
    maxWidth: '190px',
    objectFit: 'contain',
    pointerEvents: 'none'
  },
  fullscreenHalf: {
    position: 'absolute',
    top: 0,
    width: '50vw',
    height: '100vh',
    zIndex: 40,
    overflow: 'hidden',
    cursor: 'pointer',
    touchAction: 'manipulation',
    backgroundColor: '#000000',
    transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  fullImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
    transition: 'transform 0.08s ease-out'
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    left: '20px',
    zIndex: 60,
    color: '#ffffff',
    fontFamily: '"Rubik", -apple-system, sans-serif',
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '1px',
    padding: '8px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: '8px',
    border: '1.5px solid #444444',
    cursor: 'pointer'
  },
  inGameBackBtn: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 100,
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 900,
    padding: '8px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    border: '1.5px solid #444444',
    borderRadius: '8px',
    cursor: 'pointer',
    letterSpacing: '1px'
  }
};

export default App;
