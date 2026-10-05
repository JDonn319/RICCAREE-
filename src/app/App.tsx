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
        <div style={styles.guardIconWrap}>
          <Smartphone size={56} color="#ffffff" strokeWidth={1.8} />
        </div>
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
          setTimeout(onLoaded, 300);
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
        <div style={styles.giantLogoBox}>
          <img src="/RiccarLogo.png" alt="Logo" style={styles.giantLogoBase} draggable={false} />
          <img 
            src="/RiccarLogo.png" 
            alt="Logo Fill" 
            style={{
              ...styles.giantLogoActive,
              clipPath: `inset(${100 - progress}% 0 0 0)`
            }} 
            draggable={false} 
          />
        </div>

        <div style={styles.slimProgressBox}>
          <div style={styles.slimProgressTrack}>
            <div style={{ ...styles.slimProgressFill, width: `${progress}%` }} />
          </div>
          <span style={styles.slimProgressText}>
            {isPortrait ? 'ROTATE TO START' : `LOADING ${progress}%`}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PNG КНОПКА (БЕЗ РАМОК, КВАДРАТОВ И ТЕНЕЙ)
// ==========================================
const PngButton: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...styles.pngBtnWrap,
        transform: pressed ? 'scale(0.96) translateY(2px)' : 'scale(1)',
        // Только чистая яркость без теней и свечений вокруг
        filter: pressed ? 'brightness(1.2)' : 'none'
      }}
    >
      <img src={src} alt={alt} style={styles.pngBtnImg} draggable={false} />
    </button>
  );
};

// ==========================================
// 4. ГЛАВНОЕ МЕНЮ (ЧИСТАЯ 2D ГРАФИКА)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      {/* 1. ЕЩЁ БОЛЕЕ ОГРОМНЫЙ ЛОГОТИП */}
      <div style={styles.logoAnchor}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.hugeMenuLogo} draggable={false} />
      </div>

      {/* 2. КНОПКИ В ЦЕНТРЕ */}
      <div style={styles.centeredButtonCluster}>
        <PngButton src="/play.png" alt="PLAY" />
        <PngButton src="/shop.png" alt="SHOP" />
        <PngButton src="/chests.png" alt="CHESTS" />
      </div>
    </div>
  );
};

// ==========================================
// 5. КОРНЕВОЙ APP
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
      {/* Жесткое отключение мобильных рамок нажатия и контуров фокуса */}
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          outline: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        button, button:focus, button:active, button:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent;
        }
        @keyframes phoneRotateAnim {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-90deg); }
          70% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* Экран блокировки */}
      <LandscapeGuard isPortrait={isPortrait} />

      {/* Экран загрузки */}
      {screen === 'loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} isPortrait={isPortrait} />
      )}

      {/* Главное меню */}
      {screen === 'menu' && <MainMenu />}

      {/* Битва */}
      {screen === 'battle' && <GameStage />}
    </main>
  );
};

// ==========================================
// СТИЛИ (ПОЛНЫЙ НОЛЬ ТЕНЕЙ И СВЕЧЕНИЙ)
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
    textAlign: 'center',
    gap: '12px'
  },
  guardIconWrap: {
    animation: 'phoneRotateAnim 2.5s ease-in-out infinite'
  },
  guardTitle: {
    margin: 0,
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '2px'
  },
  guardDesc: {
    margin: 0,
    color: '#9e898b',
    fontSize: '13px',
    letterSpacing: '1px'
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
  giantLogoBox: {
    position: 'relative',
    width: '85vw',
    maxWidth: '640px',
    height: '70vh',
    maxHeight: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  giantLogoBase: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    opacity: 0.15
  },
  giantLogoActive: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  slimProgressBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  slimProgressTrack: {
    width: '160px',
    maxWidth: '42vw',
    height: '6px',
    backgroundColor: '#0a0203',
    borderRadius: '10px',
    border: '1.5px solid #3d090d',
    padding: '1px',
    overflow: 'hidden'
  },
  slimProgressFill: {
    height: '100%',
    borderRadius: '10px',
    background: 'linear-gradient(180deg, #f04e3e 0%, #a81a15 100%)',
    transition: 'width 0.08s linear'
  },
  slimProgressText: {
    color: '#8b4b4e',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '1.2px'
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
  // ЕЩЁ БОЛЕЕ ОГРОМНЫЙ ЛОГОТИП
  logoAnchor: {
    position: 'absolute',
    top: '0%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  hugeMenuLogo: {
    height: '56vh',
    maxHeight: '280px',
    maxWidth: '85vw',
    objectFit: 'contain'
  },
  // КНОПКИ В ЦЕНТРЕ
  centeredButtonCluster: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    zIndex: 20
  },
  // PNG Кнопка без рамок, теней и подсветки
  pngBtnWrap: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'transform 0.06s ease-out, filter 0.06s ease-out'
  },
  pngBtnImg: {
    height: '42px',
    maxHeight: '10vh',
    width: 'auto',
    maxWidth: '30vw',
    objectFit: 'contain',
    pointerEvents: 'none',
    userSelect: 'none'
  }
};

export default App;
