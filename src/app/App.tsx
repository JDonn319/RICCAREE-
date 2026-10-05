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
// 2. ЭКРАН ЗАГРУЗКИ
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
      '/chests.png',
      '/solo.png',
      '/duo.png'
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
// 4. ИНТЕРАКТИВНАЯ ПОЛОВИНКА РЕЖИМА (SOLO / DUO)
// ==========================================
const ModeCurtainHalf: React.FC<{
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
        ...styles.curtainHalf,
        left: side === 'left' ? 0 : '50%',
        borderRight: side === 'left' ? '2px solid #140304' : 'none',
        borderLeft: side === 'right' ? '2px solid #140304' : 'none',
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        backgroundColor: side === 'left' ? '#180405' : '#120304' // темный благородный фон створок
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        style={{
          ...styles.modeImg,
          transform: pressed ? 'scale(0.95)' : 'scale(1)'
        }}
        draggable={false}
      />
    </div>
  );
};

// ==========================================
// 5. ГЛАВНОЕ МЕНЮ С ВЫЕЗЖАЮЩИМИ СТВОРКАМИ
// ==========================================
const MainMenu: React.FC = () => {
  const [modesOpen, setModesOpen] = useState(false);

  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      {/* Центр главного экрана */}
      <div style={styles.centerBlock}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuLogo} draggable={false} />

        <div style={styles.btnStack}>
          <MenuButton src="/play.png" alt="PLAY" onClick={() => setModesOpen(true)} />
          <MenuButton src="/shop.png" alt="SHOP" />
          <MenuButton src="/chests.png" alt="CHESTS" />
        </div>
      </div>

      {/* КНОПКА ЗАКРЫТИЯ СТВОРОК ВЫБОРА РЕЖИМА */}
      {modesOpen && (
        <button
          onClick={() => setModesOpen(false)}
          style={styles.closeModesBtn}
        >
          ✕ BACK
        </button>
      )}

      {/* ЛЕВАЯ СТВОРКА: DUO */}
      <ModeCurtainHalf
        side="left"
        imgSrc="/duo.png"
        alt="DUO"
        isOpen={modesOpen}
        onSelect={() => console.log('DUO SELECTED')}
      />

      {/* ПРАВАЯ СТВОРКА: SOLO */}
      <ModeCurtainHalf
        side="right"
        imgSrc="/solo.png"
        alt="SOLO"
        isOpen={modesOpen}
        onSelect={() => console.log('SOLO SELECTED')}
      />
    </div>
  );
};

// ==========================================
// 6. APP ROOT
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
  // Menu
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
  // ВЫЕЗЖАЮЩИЕ СТВОРКИ (50% ШИРИНЫ КАЖДАЯ)
  curtainHalf: {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: '100%',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    // Плавная физика выезда сверху вниз
    transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  modeImg: {
    width: '32vw',
    maxWidth: '240px',
    height: 'auto',
    maxHeight: '45vh',
    objectFit: 'contain',
    pointerEvents: 'none',
    transition: 'transform 0.08s ease-out'
  },
  closeModesBtn: {
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
    backgroundColor: '#000000',
    borderRadius: '8px',
    border: '1.5px solid #333333',
    cursor: 'pointer'
  }
};

export default App;
