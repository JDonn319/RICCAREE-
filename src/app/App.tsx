import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { GameStage } from '../game/GameStage';

// Определение ориентации строго синхронно, чтобы не стартовать в фоне
const checkPortraitSync = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

// ==========================================
// 1. БЛОКИРОВЩИК ПОВОРОТА ЭКРАНА (iOS GUARD)
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
        <p style={styles.guardDesc}>Переверните устройство горизонтально</p>
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
    // НАМЕРТВО БЛОКИРУЕМ ЗАГРУЗКУ В ВЕРТИКАЛИ:
    if (isPortrait) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoaded, 300);
          return 100;
        }
        return prev + 1; // плавный ход полоски
      });
    }, 18);

    return () => clearInterval(timer);
  }, [isPortrait, onLoaded]);

  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingCenter}>
        {/* ОГРОМНОЕ ЛОГО ПОЧТИ ВО ВЕСЬ ЭКРАН */}
        <div style={styles.hugeLogoBox}>
          <img src="/RiccarLogo.png" alt="Logo" style={styles.hugeLogoBase} draggable={false} />
          <img 
            src="/RiccarLogo.png" 
            alt="Logo Fill" 
            style={{
              ...styles.hugeLogoActive,
              clipPath: `inset(${100 - progress}% 0 0 0)`
            }} 
            draggable={false} 
          />
        </div>

        {/* МАЛЕНЬКАЯ АККУРАТНАЯ ПОЛОСКА СНИЗУ */}
        <div style={styles.smallProgressWrap}>
          <div style={styles.smallProgressTrack}>
            <div style={{ ...styles.smallProgressFill, width: `${progress}%` }} />
          </div>
          <span style={styles.smallProgressText}>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ГЛАВНОЕ МЕНЮ (1 В 1 ПО РЕФЕРЕНСУ)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      <div style={styles.menuCenter}>
        {/* БОЛЬШОЙ ЛОГОТИП В НЕБЕ МЕЖДУ ЗАМКАМИ */}
        <div style={styles.menuLogoWrapper}>
          <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuBigLogo} draggable={false} />
        </div>

        {/* АККУРАТНЫЕ КОМПАКТНЫЕ МАРМЕЛАДНЫЕ КНОПКИ */}
        <div style={styles.btnColumn}>
          <MarmaladeBtn text="ИГРАТЬ" />
          <MarmaladeBtn text="МАГАЗИН" />
          <MarmaladeBtn text="СУНДУКИ" />
        </div>
      </div>
    </div>
  );
};

// Компактная мармеладная капсула по референсу
const MarmaladeBtn: React.FC<{ text: string }> = ({ text }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...styles.puffyBtn,
        transform: pressed ? 'translateY(2px) scale(0.96)' : 'translateY(0) scale(1)',
        boxShadow: pressed
          ? '0 2px 0 #200405, inset 0 2px 4px rgba(0,0,0,0.7)'
          : '0 4px 0 #200405, 0 6px 10px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.45)'
      }}
    >
      {/* Тонкий стеклянный блик надутой кнопки */}
      <div style={styles.btnHighlight} />
      <span style={styles.puffyBtnText}>{text}</span>
    </button>
  );
};

// ==========================================
// 4. APP КОРЕНЬ
// ==========================================
type ScreenState = 'loading' | 'menu' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('loading');
  const [isPortrait, setIsPortrait] = useState<boolean>(checkPortraitSync);

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
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@800;900&display=swap');
        @keyframes phoneRotateAnim {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-90deg); }
          70% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* Заглушка вертикального экрана */}
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
// ТОЧНЫЕ СТИЛИ ПО РЕФЕРЕНСУ
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    fontFamily: '"Rubik", -apple-system, sans-serif'
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
    fontSize: '14px',
    maxWidth: '240px'
  },
  // Экран загрузки
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
    gap: '18px',
    width: '100%',
    height: '100%'
  },
  hugeLogoBox: {
    position: 'relative',
    width: '78vw',
    maxWidth: '560px',
    height: '62vh',
    maxHeight: '270px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hugeLogoBase: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    opacity: 0.15,
    filter: 'grayscale(70%)'
  },
  hugeLogoActive: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 24px rgba(210, 30, 30, 0.5))'
  },
  smallProgressWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  smallProgressTrack: {
    width: '170px',
    maxWidth: '45vw',
    height: '7px',
    backgroundColor: '#0a0203',
    borderRadius: '10px',
    border: '1.5px solid #3d090d',
    padding: '1px',
    overflow: 'hidden'
  },
  smallProgressFill: {
    height: '100%',
    borderRadius: '10px',
    background: 'linear-gradient(180deg, #f04e3e 0%, #a81a15 100%)',
    boxShadow: '0 0 6px rgba(240, 78, 62, 0.7)',
    transition: 'width 0.08s linear'
  },
  smallProgressText: {
    color: '#8b4b4e',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '1px'
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
    gap: '6px',
    height: '100%'
  },
  menuLogoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2px'
  },
  menuBigLogo: {
    height: '42vh',
    maxHeight: '175px',
    maxWidth: '52vw',
    objectFit: 'contain',
    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'
  },
  btnColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    alignItems: 'center'
  },
  // АККУРАТНАЯ КАПСУЛА-КНОПКА ТОЧНО С РЕФЕРЕНСА
  puffyBtn: {
    position: 'relative',
    width: '190px',
    maxWidth: '26vw',
    height: '40px',
    maxHeight: '9.5vh',
    borderRadius: '9999px',
    background: 'linear-gradient(180deg, #991e18 0%, #7d1713 52%, #4d0b0a 100%)',
    border: '2.5px solid #240506',
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
  btnHighlight: {
    position: 'absolute',
    top: '2px',
    left: '10px',
    right: '10px',
    height: '38%',
    borderRadius: '9999px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 100%)',
    pointerEvents: 'none'
  },
  puffyBtnText: {
    position: 'relative',
    zIndex: 2,
    color: '#ffffff',
    fontFamily: '"Rubik", sans-serif',
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    textShadow: `
      -1.5px -1.5px 0 #200405,
       1.5px -1.5px 0 #200405,
      -1.5px  1.5px 0 #200405,
       1.5px  1.5px 0 #200405,
       0px  2px 3px rgba(0,0,0,0.8)
    `,
    pointerEvents: 'none'
  }
};

export default App;
