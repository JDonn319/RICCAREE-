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
// 2. ЭКРАН ЗАГРУЗКИ (ПРЕДЗАГРУЗКА ВСЕХ КАРТИНОК)
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
      '/basic.png',
      '/multiplayer.png',
      '/apocalypse.png'
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
// 3. БАЗОВАЯ КНОПКА (ФИКСИРОВАННЫЙ РАЗМЕР)
// ==========================================
const MenuButton: React.FC<{ src: string; alt: string; onClick?: () => void }> = ({ src, alt, onClick }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick?.(); }}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...styles.btn,
        transform: pressed ? 'translateY(2px) scale(0.97)' : 'none'
      }}
    >
      <img src={src} alt={alt} style={styles.btnImg} draggable={false} />
    </button>
  );
};

// ==========================================
// 4. ГЛАВНОЕ МЕНЮ
// ==========================================
const MainMenu: React.FC<{ onPlay: () => void }> = ({ onPlay }) => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      <div style={styles.centerBlock}>
        <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuLogo} draggable={false} />

        <div style={styles.btnStack}>
          <MenuButton src="/play.png" alt="PLAY" onClick={onPlay} />
          <MenuButton src="/shop.png" alt="SHOP" />
          <MenuButton src="/chests.png" alt="CHESTS" />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. ЭКРАН ВЫБОРА РЕЖИМОВ
// ==========================================
const ModeSelectScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [arrowPressed, setArrowPressed] = useState(false);

  return (
    <div style={styles.menuContainer}>
      {/* Тот же фон замков */}
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />

      {/* Кнопки режимов вылетают сверху в один ряд */}
      <div style={styles.modesRow}>
        <ModeCard src="/basic.png" alt="BASIC" />
        <ModeCard src="/multiplayer.png" alt="MULTIPLAYER" />
        <ModeCard src="/apocalypse.png" alt="APOCALYPSE" />
      </div>

      {/* Высокая узкая полупрозрачная белая стрелочка справа */}
      <button
        onPointerDown={() => setArrowPressed(true)}
        onPointerUp={() => setArrowPressed(false)}
        onPointerLeave={() => setArrowPressed(false)}
        style={{
          ...styles.arrowBtn,
          transform: arrowPressed ? 'translateY(-50%) scale(0.92)' : 'translateY(-50%)'
        }}
      >
        <svg viewBox="0 0 16 52" style={styles.arrowSvg}>
          <path
            d="M 3,4 L 13,26 L 3,48"
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Маленькая незаметная кнопка «Назад в меню» слева */}
      <button onClick={onBack} style={styles.backBtn}>
        ←
      </button>
    </div>
  );
};

// Карточка режима игры
const ModeCard: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...styles.modeBtn,
        transform: pressed ? 'scale(0.96) translateY(2px)' : 'none'
      }}
    >
      <img src={src} alt={alt} style={styles.modeImg} draggable={false} />
    </button>
  );
};

// ==========================================
// 6. APP ROOT
// ==========================================
type ScreenState = 'loading' | 'menu' | 'mode_select' | 'battle';

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
      {/* Анимация быстрого и плавного вылета кнопок сверху */}
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
        @keyframes dropDownAnim {
          0% {
            transform: translateY(-90px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <LandscapeGuard isPortrait={isPortrait} />

      {screen === 'loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} isPortrait={isPortrait} />
      )}

      {screen === 'menu' && (
        <MainMenu onPlay={() => setScreen('mode_select')} />
      )}

      {screen === 'mode_select' && (
        <ModeSelectScreen onBack={() => setScreen('menu')} />
      )}

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
    maxWidth: '42vw',
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
  // КНОПКА ГЛАВНОГО МЕНЮ (ЧЕТКАЯ ФИКСАЦИЯ ВЫСОТЫ)
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
    maxHeight: '9vh',
    width: 'auto',
    maxWidth: '200px',
    objectFit: 'contain',
    pointerEvents: 'none'
  },
  // РЯД РЕЖИМОВ (ВЫЛЕТАЕТ СВЕРХУ)
  modesRow: {
    position: 'absolute',
    top: '12%',
    left: '5%',
    right: '8%', // Оставляем место для стрелочки справа
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 20,
    animation: 'dropDownAnim 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  modeBtn: {
    flex: '1',
    maxWidth: '28vw',
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    transition: 'transform 0.06s ease-out'
  },
  modeImg: {
    width: '100%',
    maxHeight: '48vh',
    objectFit: 'contain',
    pointerEvents: 'none'
  },
  // СТРЕЛОЧКА СПРАВА (ВЫСОКАЯ, УЗКАЯ, ПОЛУПРОЗРАЧНАЯ)
  arrowBtn: {
    position: 'absolute',
    right: 'env(safe-area-inset-right, 16px)',
    top: '50%',
    zIndex: 30,
    background: 'none',
    border: 'none',
    padding: '8px',
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    transition: 'transform 0.06s ease-out'
  },
  arrowSvg: {
    width: '18px',
    height: '75px',
    pointerEvents: 'none'
  },
  backBtn: {
    position: 'absolute',
    left: 'env(safe-area-inset-left, 16px)',
    top: '16px',
    zIndex: 30,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px'
  }
};

export default App;
