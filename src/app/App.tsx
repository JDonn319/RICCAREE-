import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { GameStage } from '../game/GameStage';

// Строгая проверка ориентации без задержек
const checkIsPortrait = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

// ==========================================
// 1. ПОВОРОТ ЭКРАНА (ПОЛНОСТЬЮ НА АНГЛИЙСКОМ)
// ==========================================
const LandscapeGuard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  if (!isPortrait) return null;

  return (
    <div style={styles.guardOverlay}>
      <div style={styles.guardCard}>
        <div style={styles.guardIconWrap}>
          <Smartphone size={58} color="#ffffff" strokeWidth={1.8} />
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
    // ЗАМОРОЖЕНО, пока телефон не повернут горизонтально!
    if (isPortrait) return;

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
        {/* Огромное лого на 75% высоты экрана */}
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

        {/* Тонкая минималистичная полоска */}
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
// 3. УПРУГАЯ НАДУТАЯ МАРМЕЛАДНАЯ КНОПКА (SVG)
// ==========================================
// Форма: от меньшей высоты по краям раздувается к большей в центре!
const JellyButton: React.FC<{ text: string }> = ({ text }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...styles.jellyBtnWrap,
        transform: pressed ? 'scale(0.93, 0.88) translateY(3px)' : 'scale(1, 1)',
        filter: pressed ? 'brightness(0.9)' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))'
      }}
    >
      {/* Векторная надутая подушечка с выпуклым центром */}
      <svg
        viewBox="0 0 210 52"
        style={styles.jellySvg}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Сочный бордовый мармеладный градиент */}
          <linearGradient id="jellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bf2820" />
            <stop offset="42%" stopColor="#9a1d17" />
            <stop offset="78%" stopColor="#6e120e" />
            <stop offset="100%" stopColor="#430807" />
          </linearGradient>

          {/* Верхний желейный блик света */}
          <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Надутое тело кнопки (уже на краях, шире в центре) */}
        <path
          d="M 22,7 
             C 65,1 145,1 188,7 
             C 205,10 210,18 210,26 
             C 210,34 205,42 188,45 
             C 145,51 65,51 22,45 
             C 5,42 0,34 0,26 
             C 0,18 5,10 22,7 Z"
          fill="url(#jellyGrad)"
          stroke="#250406"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* 2. Надутый полукруглый блик */}
        <path
          d="M 26,10 
             C 65,4 145,4 184,10 
             C 192,12 195,17 186,21 
             C 145,26 65,26 24,21 
             C 15,17 18,12 26,10 Z"
          fill="url(#glossGrad)"
        />
      </svg>

      {/* Текст кнопки шрифтом Lemon Slice */}
      <span style={styles.jellyBtnText}>{text}</span>
    </button>
  );
};

// ==========================================
// 4. ГЛАВНОЕ МЕНЮ (ОГРОМНЫЙ ЛОГОТИП + КНОПКИ)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      <div style={styles.menuCenter}>
        {/* ЛОГОТИП В 2 РАЗА БОЛЬШЕ */}
        <div style={styles.hugeMenuLogoBox}>
          <img src="/RiccarLogo.png" alt="RICAREE" style={styles.hugeMenuLogo} draggable={false} />
        </div>

        {/* Надутые мармеладные кнопки (ENGLISH) */}
        <div style={styles.btnColumn}>
          <JellyButton text="PLAY" />
          <JellyButton text="SHOP" />
          <JellyButton text="CHESTS" />
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
      {/* Подключение шрифта Lemon Slice и резервного Fredoka */}
      <style>{`
        @font-face {
          font-family: 'Lemon Slice';
          src: url('/LemonSlice.ttf') format('truetype'),
               url('/LemonSlice.otf') format('opentype'),
               url('/gameplay/LemonSlice.ttf') format('truetype');
          font-display: swap;
        }
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@700;900&family=Rubik:wght@900&display=swap');
        
        @keyframes phoneRotateAnim {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-90deg); }
          70% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* Экран-страховка */}
      <LandscapeGuard isPortrait={isPortrait} />

      {/* Загрузка */}
      {screen === 'loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} isPortrait={isPortrait} />
      )}

      {/* Главное меню */}
      {screen === 'menu' && <MainMenu />}

      {/* Поле битвы */}
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
    fontFamily: '"Lemon Slice", "Fredoka", "Rubik", sans-serif'
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
  // Загрузка
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
    width: '84vw',
    maxWidth: '620px',
    height: '70vh',
    maxHeight: '310px',
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
  menuCenter: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '4px'
  },
  hugeMenuLogoBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // Огромный логотип в 2+ раза больше
    height: '54vh',
    maxHeight: '235px',
    maxWidth: '78vw',
    marginBottom: '-8px'
  },
  hugeMenuLogo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))'
  },
  btnColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'center'
  },
  // Надутая желейная кнопка
  jellyBtnWrap: {
    position: 'relative',
    width: '195px',
    maxWidth: '28vw',
    height: '46px',
    maxHeight: '11vh',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  jellySvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  jellyBtnText: {
    position: 'relative',
    zIndex: 2,
    color: '#ffffff',
    fontFamily: '"Lemon Slice", "Fredoka", sans-serif',
    fontSize: '20px',
    fontWeight: 900,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    textShadow: `
      -2px -2px 0 #250406,
       2px -2px 0 #250406,
      -2px  2px 0 #250406,
       2px  2px 0 #250406,
       0px  2px 4px rgba(0,0,0,0.85)
    `,
    pointerEvents: 'none'
  }
};

export default App;
