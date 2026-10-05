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
// 2. ЭКРАН ЗАГРУЗКИ (ОГРОМНОЕ ЛОГО + ТОНКАЯ ПОЛОСКА)
// ==========================================
const LoadingScreen: React.FC<{ onLoaded: () => void; isPortrait: boolean }> = ({ onLoaded, isPortrait }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPortrait) return; // Строгая пауза в вертикали

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
// 3. СВЕТЛАЯ КНОПКА (МЕНЬШЕ, СКРУГЛЕННЫЙ КВАДРАТ)
// ==========================================
const MenuButton: React.FC<{ text: string }> = ({ text }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...styles.btnBase,
        transform: pressed ? 'translateY(2px) scale(0.97)' : 'translateY(0) scale(1)',
        boxShadow: pressed
          ? '0 2px 0 #280406, inset 0 2px 4px rgba(0,0,0,0.6)'
          : '0 4px 0 #280406, 0 6px 10px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.55)'
      }}
    >
      {/* Верхний глянцевый блик */}
      <div style={styles.btnGloss} />
      <span style={styles.btnText}>{text}</span>
    </button>
  );
};

// ==========================================
// 4. ГЛАВНОЕ МЕНЮ (КНОПКИ В ЦЕНТРЕ ЭКРАНА)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      {/* 1. ОГРОМНЫЙ ЛОГОТИП В НЕБЕ НАД КНОПКАМИ */}
      <div style={styles.logoAnchor}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.hugeMenuLogo} draggable={false} />
      </div>

      {/* 2. СУММАРНЫЙ БЛОК КНОПОК РОВНО В ЦЕНТРЕ ЭКРАНА */}
      <div style={styles.centeredButtonCluster}>
        <MenuButton text="PLAY" />
        <MenuButton text="SHOP" />
        <MenuButton text="CHESTS" />
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
      {/* Подключение шрифта Lemon Slice с резервом */}
      <style>{`
        @font-face {
          font-family: 'Lemon Slice';
          src: url('/LemonSlice.ttf') format('truetype'),
               url('/LemonSlice.otf') format('opentype'),
               url('/Lemon Slice.ttf') format('truetype'),
               url('/lemon-slice.ttf') format('truetype');
          font-display: swap;
        }
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@900&display=swap');
        
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

      {/* Меню */}
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
    fontFamily: '"Lemon Slice", "Rubik", sans-serif'
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
  // ЛОГОТИП ЕЩЁ БОЛЬШЕ (В ВЕРХНЕЙ ЧАСТИ НЕБА)
  logoAnchor: {
    position: 'absolute',
    top: '3%',
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
  // ВСЕ КНОПКИ СУММАРНО В ЦЕНТРЕ ЭКРАНА
  centeredButtonCluster: {
    position: 'absolute',
    top: '58%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    alignItems: 'center',
    zIndex: 20
  },
  // СВЕТЛАЯ КНОПКА МЕНЬШЕГО РАЗМЕРА (СКРУГЛЕННЫЙ КВАДРАТ)
  btnBase: {
    position: 'relative',
    width: '165px',
    maxWidth: '24vw',
    height: '37px',
    maxHeight: '9vh',
    borderRadius: '12px', // Скругленный прямоугольник вместо капсулы
    // Светлый насыщенный красный градиент
    background: 'linear-gradient(180deg, #e8382c 0%, #bd2319 50%, #8a130e 100%)',
    border: '2.5px solid #280406',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    overflow: 'hidden',
    transition: 'transform 0.06s ease-out, box-shadow 0.06s ease-out'
  },
  btnGloss: {
    position: 'absolute',
    top: '2px',
    left: '5px',
    right: '5px',
    height: '38%',
    borderRadius: '8px 8px 4px 4px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.08) 100%)',
    pointerEvents: 'none'
  },
  btnText: {
    position: 'relative',
    zIndex: 2,
    color: '#ffffff',
    fontFamily: '"Lemon Slice", "Rubik", sans-serif',
    fontSize: '17px',
    fontWeight: 900,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    textShadow: `
      -1.5px -1.5px 0 #280406,
       1.5px -1.5px 0 #280406,
      -1.5px  1.5px 0 #280406,
       1.5px  1.5px 0 #280406,
       0px  2px 3px rgba(0,0,0,0.8)
    `,
    pointerEvents: 'none'
  }
};

export default App;
