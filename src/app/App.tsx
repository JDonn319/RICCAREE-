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
// 2. ЭКРАН ЗАГРУЗКИ (ГРУЗИТ ВСЕ ФОТО И КНОПКИ)
// ==========================================
const LoadingScreen: React.FC<{ onLoaded: () => void; isPortrait: boolean }> = ({ onLoaded, isPortrait }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPortrait) return; // Строгая пауза в вертикали

    // Предзагрузка фона, логотипа и трёх новых кнопок
    const assets = [
      '/MainMenuBackground.png',
      '/RiccarLogo.png',
      '/play.png',
      '/shop.png',
      '/chests.png'
    ];

    let loadedCount = 0;
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loadedCount++;
      };
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
// 3. PNG КНОПКА С МЯГКОЙ ПОДСВЕТКОЙ ПРИ НАЖАТИИ
// ==========================================
const PngButton: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...styles.pngBtnWrap,
        transform: pressed ? 'scale(0.96) translateY(2px)' : 'scale(1)',
        // Эффект подсветки при нажатии (яркость + мягкое свечение)
        filter: pressed 
          ? 'brightness(1.35) drop-shadow(0 0 10px rgba(255, 230, 200, 0.75)) drop-shadow(0 4px 6px rgba(0,0,0,0.5))' 
          : 'brightness(1) drop-shadow(0 4px 8px rgba(0,0,0,0.45))'
      }}
    >
      <img src={src} alt={alt} style={styles.pngBtnImg} draggable={false} />
    </button>
  );
};

// ==========================================
// 4. ГЛАВНОЕ МЕНЮ (ЦЕНТРОВКА + PNG КНОПКИ)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      {/* 1. БОЛЬШОЙ ЛОГОТИП В НЕБЕ */}
      <div style={styles.logoAnchor}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.hugeMenuLogo} draggable={false} />
      </div>

      {/* 2. ТРИ КНОПКИ РОВНО В ЦЕНТРЕ ЭКРАНА */}
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
      <style>{`
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
    textAlign: 'center',
    gap: '12px'
  },
  guardIconWrap: {
    animation: 'phoneRotateAnim 2.5s ease-in-out infinite',
    filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.35))'
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
    opacity: 0.15,
    filter: 'grayscale(70%)'
  },
  giantLogoActive: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 24px rgba(220, 30, 30, 0.5))'
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
    boxShadow: '0 0 6px rgba(240, 78, 62, 0.7)',
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
  logoAnchor: {
    position: 'absolute',
    top: '2%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  hugeMenuLogo: {
    height: '46vh',
    maxHeight: '210px',
    maxWidth: '70vw',
    objectFit: 'contain',
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))'
  },
  // КНОПКИ В ЦЕНТРЕ
  centeredButtonCluster: {
    position: 'absolute',
    top: '58%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    zIndex: 20
  },
  // PNG Кнопка без рамок и фона
  pngBtnWrap: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'transform 0.07s ease-out, filter 0.07s ease-out'
  },
  pngBtnImg: {
    height: '44px',
    maxHeight: '10.5vh',
    width: 'auto',
    maxWidth: '32vw',
    objectFit: 'contain',
    pointerEvents: 'none'
  }
};

export default App;
