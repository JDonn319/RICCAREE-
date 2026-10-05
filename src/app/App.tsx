import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { GameStage } from '../game/GameStage';

// ==========================================
// 1. БЛОКИРОВЩИК ПОВОРОТА ЭКРАНА (iOS GUARD)
// ==========================================
const LandscapeGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (!isPortrait) return null;

  return (
    <div style={styles.guardOverlay}>
      <style>{`
        @keyframes phoneRotateAnim {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-90deg); }
          70% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <div style={styles.guardCard}>
        <div style={styles.guardIconWrap}>
          <Smartphone size={64} color="#ffffff" strokeWidth={1.8} />
        </div>
        <h2 style={styles.guardTitle}>RICAREE!</h2>
        <p style={styles.guardDesc}>Пожалуйста, переверните устройство горизонтально</p>
      </div>
    </div>
  );
};

// ==========================================
// 2. ЭКРАН ЗАГРУЗКИ (ЗАПОЛНЕНИЕ ЛОГО СНИЗУ ВВЕРХ)
// ==========================================
const LoadingScreen: React.FC<{ onLoaded: () => void }> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const assets = ['/MainMenuBackground.png', '/RiccarLogo.png'];
    let loaded = 0;
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loaded++;
      };
    });

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoaded, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [onLoaded]);

  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingCenter}>
        {/* Лого с наполнением снизу вверх */}
        <div style={styles.logoFillBox}>
          <img src="/RiccarLogo.png" alt="Logo" style={styles.logoBase} draggable={false} />
          <img 
            src="/RiccarLogo.png" 
            alt="Logo Fill" 
            style={{
              ...styles.logoActive,
              clipPath: `inset(${100 - progress}% 0 0 0)`
            }} 
            draggable={false} 
          />
        </div>

        {/* Прогресс-бар */}
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <span style={styles.progressText}>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ГЛАВНОЕ МЕНЮ (МАРМЕЛАДНЫЕ КНОПКИ)
// ==========================================
const MainMenu: React.FC<{ onPlay: () => void }> = ({ onPlay }) => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      <div style={styles.menuCenter}>
        <div style={styles.menuLogoBox}>
          <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuLogo} draggable={false} />
        </div>

        <div style={styles.btnColumn}>
          <MarmaladeBtn text="ИГРАТЬ" onClick={onPlay} />
          <MarmaladeBtn text="МАГАЗИН" onClick={() => alert('Скоро!')} />
          <MarmaladeBtn text="СУНДУКИ" onClick={() => alert('Скоро!')} />
        </div>
      </div>
    </div>
  );
};

const MarmaladeBtn: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick(); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...styles.mBtn,
        transform: pressed ? 'translateY(4px) scale(0.97)' : 'translateY(0) scale(1)',
        boxShadow: pressed
          ? '0 2px 0 #1b0708, inset 0 2px 4px rgba(0,0,0,0.5)'
          : '0 6px 0 #1b0708, 0 10px 14px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.45)'
      }}
    >
      <div style={styles.btnGloss} />
      <span style={styles.btnText}>{text}</span>
    </button>
  );
};

// ==========================================
// 4. КОРНЕВОЙ КОМПОНЕНТ APP
// ==========================================
type ScreenState = 'loading' | 'menu' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('loading');

  return (
    <main style={styles.root}>
      <LandscapeGuard />

      {screen === 'loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} />
      )}

      {screen === 'menu' && (
        <MainMenu onPlay={() => setScreen('battle')} />
      )}

      {screen === 'battle' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <GameStage />
          <button onClick={() => setScreen('menu')} style={styles.backBtn}>
            ← В Меню
          </button>
        </div>
      )}
    </main>
  );
};

// ==========================================
// СТИЛИ (ВСЕ ВНУТРИ ФАЙЛА, БЕЗ .CSS)
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000'
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
    fontFamily: '"Rubik", "Fredoka", sans-serif',
    padding: '24px'
  },
  guardCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '14px'
  },
  guardIconWrap: {
    animation: 'phoneRotateAnim 2.5s ease-in-out infinite',
    filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.4))',
    marginBottom: '8px'
  },
  guardTitle: {
    margin: 0,
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 900,
    letterSpacing: '2px'
  },
  guardDesc: {
    margin: 0,
    color: '#a89294',
    fontSize: '15px',
    maxWidth: '260px'
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
    gap: '24px'
  },
  logoFillBox: {
    position: 'relative',
    width: '42vw',
    maxWidth: '380px',
    height: '24vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoBase: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    opacity: 0.18,
    filter: 'grayscale(60%)'
  },
  logoActive: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 18px rgba(230, 40, 40, 0.4))'
  },
  progressWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  progressTrack: {
    width: '260px',
    maxWidth: '50vw',
    height: '16px',
    backgroundColor: '#0c0203',
    borderRadius: '16px',
    border: '2.5px solid #360b0e',
    padding: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, #f04e3e 0%, #b81e18 50%, #7e1210 100%)',
    boxShadow: '0 0 8px rgba(240, 78, 62, 0.6)'
  },
  progressText: {
    fontFamily: '"Rubik", sans-serif',
    color: '#8b4b4e',
    fontSize: '13px',
    fontWeight: 800
  },
  // Menu
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
    gap: '2vh'
  },
  menuLogoBox: {
    display: 'flex',
    justifyContent: 'center'
  },
  menuLogo: {
    maxHeight: '26vh',
    maxWidth: '44vw',
    objectFit: 'contain',
    filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))'
  },
  btnColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '11px',
    alignItems: 'center'
  },
  mBtn: {
    position: 'relative',
    width: '270px',
    maxWidth: '42vw',
    height: '52px',
    maxHeight: '11vh',
    borderRadius: '24px',
    background: 'linear-gradient(180deg, #c7372c 0%, #9c221b 48%, #6d1511 100%)',
    border: '3px solid #1c0607',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    overflow: 'hidden',
    transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out'
  },
  btnGloss: {
    position: 'absolute',
    top: '2px',
    left: '8px',
    right: '8px',
    height: '42%',
    borderRadius: '16px 16px 100px 100px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.06) 100%)',
    pointerEvents: 'none'
  },
  btnText: {
    position: 'relative',
    zIndex: 2,
    color: '#ffffff',
    fontFamily: '"Rubik", "Fredoka", sans-serif',
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    textShadow: `
      -2px -2px 0 #1b0708,
       2px -2px 0 #1b0708,
      -2px  2px 0 #1b0708,
       2px  2px 0 #1b0708,
       0px  3px 4px #000000
    `,
    pointerEvents: 'none'
  },
  backBtn: {
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
