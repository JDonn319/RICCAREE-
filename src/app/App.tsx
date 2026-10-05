import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { GameStage } from '../game/GameStage';

// ==========================================
// 1. БЛОКИРОВЩИК ПОВОРОТА ЭКРАНА (iOS GUARD)
// ==========================================
const LandscapeGuard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  if (!isPortrait) return null;

  return (
    <div style={styles.guardOverlay}>
      <div style={styles.guardCard}>
        <div style={styles.guardIconWrap}>
          <Smartphone size={68} color="#ffffff" strokeWidth={1.8} />
        </div>
        <h2 style={styles.guardTitle}>RICAREE!</h2>
        <p style={styles.guardDesc}>Пожалуйста, переверните устройство горизонтально</p>
      </div>
    </div>
  );
};

// ==========================================
// 2. ЭКРАН ЗАГРУЗКИ (КРУПНЫЙ, ПАУЗА В ВЕРТИКАЛИ)
// ==========================================
const LoadingScreen: React.FC<{ onLoaded: () => void; isPortrait: boolean }> = ({ onLoaded, isPortrait }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Если экран вертикальный — загрузка стоит на паузе!
    if (isPortrait) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoaded, 350);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [isPortrait, onLoaded]);

  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingCenter}>
        {/* Крупное лого с наполнением снизу вверх */}
        <div style={styles.bigLogoBox}>
          <img src="/RiccarLogo.png" alt="Logo" style={styles.bigLogoBase} draggable={false} />
          <img 
            src="/RiccarLogo.png" 
            alt="Logo Fill" 
            style={{
              ...styles.bigLogoActive,
              clipPath: `inset(${100 - progress}% 0 0 0)`
            }} 
            draggable={false} 
          />
        </div>

        {/* Большой мармеладный прогресс-бар */}
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <span style={styles.progressText}>
            {isPortrait ? 'ОЖИДАНИЕ ПОВОРОТА...' : `ЗАГРУЗКА ${progress}%`}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ГЛАВНОЕ МЕНЮ (БОЛЬШОЕ ЛОГО + НАДУТЫЕ КНОПКИ)
// ==========================================
const MainMenu: React.FC = () => {
  return (
    <div style={styles.menuContainer}>
      <img src="/MainMenuBackground.png" alt="BG" style={styles.menuBg} draggable={false} />
      
      <div style={styles.menuCenter}>
        {/* Массивное сочное лого */}
        <div style={styles.menuLogoWrapper}>
          <img src="/RiccarLogo.png" alt="RICAREE" style={styles.menuBigLogo} draggable={false} />
        </div>

        {/* Надутые мармеладные кнопки */}
        <div style={styles.btnColumn}>
          <MarmaladeBtn text="ИГРАТЬ" />
          <MarmaladeBtn text="МАГАЗИН" />
          <MarmaladeBtn text="СУНДУКИ" />
        </div>
      </div>
    </div>
  );
};

// Надутая кнопка с бликом и комиксным стилем
const MarmaladeBtn: React.FC<{ text: string }> = ({ text }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...styles.puffyBtn,
        transform: pressed ? 'translateY(3px) scale(0.97)' : 'translateY(0) scale(1)',
        // Эффект вдавленной подушечки при клике
        boxShadow: pressed
          ? '0 2px 0 #280405, inset 0 3px 6px rgba(0,0,0,0.6)'
          : '0 6px 0 #2d0506, 0 10px 16px rgba(0,0,0,0.55), inset 0 3px 4px rgba(255,255,255,0.45)'
      }}
    >
      {/* Верхний мармеладный блик */}
      <div style={styles.btnHighlight} />
      <span style={styles.puffyBtnText}>{text}</span>
    </button>
  );
};

// ==========================================
// 4. КОРНЕВОЙ APP
// ==========================================
type ScreenState = 'loading' | 'menu' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('loading');
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <main style={styles.root}>
      {/* Импорт комиксного круглого шрифта прямо в компонент */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@700;900&family=Rubik:wght@900&display=swap');
        @keyframes phoneRotateAnim {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-90deg); }
          70% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* Экран-страховка от вертикального режима */}
      <LandscapeGuard isPortrait={isPortrait} />

      {/* Экран загрузки с блокировкой таймера в вертикали */}
      {screen === 'loading' && (
        <LoadingScreen onLoaded={() => setScreen('menu')} isPortrait={isPortrait} />
      )}

      {/* Главное меню */}
      {screen === 'menu' && <MainMenu />}

      {/* Холст битвы (пока не используется) */}
      {screen === 'battle' && <GameStage />}
    </main>
  );
};

// ==========================================
// СТИЛИ (НАДУТЫЕ ФОРМЫ, БОРДОВЫЕ ГРАНИЦЫ)
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    fontFamily: '"Fredoka", "Rubik", sans-serif'
  },
  // Поворот экрана
  guardOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    backgroundColor: '#0d0203',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.4))'
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
    gap: '24px',
    width: '80%'
  },
  bigLogoBox: {
    position: 'relative',
    width: '60vw',
    maxWidth: '460px',
    height: '35vh',
    maxHeight: '170px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bigLogoBase: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    opacity: 0.16,
    filter: 'grayscale(70%)'
  },
  bigLogoActive: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.45))'
  },
  progressWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  progressTrack: {
    width: '340px',
    maxWidth: '65vw',
    height: '22px',
    backgroundColor: '#0c0203',
    borderRadius: '20px',
    border: '3px solid #3d090d',
    padding: '3px',
    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)'
  },
  progressFill: {
    height: '100%',
    borderRadius: '14px',
    background: 'linear-gradient(180deg, #f04e3e 0%, #b81e18 50%, #751210 100%)',
    boxShadow: '0 0 10px rgba(240, 78, 62, 0.6), inset 0 2px 2px rgba(255,255,255,0.4)',
    transition: 'width 0.1s linear'
  },
  progressText: {
    color: '#a35357',
    fontSize: '14px',
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
    gap: '12px',
    paddingBottom: '2vh'
  },
  menuLogoWrapper: {
    display: 'flex',
    justifyContent: 'center'
  },
  menuBigLogo: {
    height: '32vh',
    maxHeight: '145px',
    maxWidth: '75vw',
    objectFit: 'contain',
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
  },
  btnColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center'
  },
  // НАДУТАЯ МАРМЕЛАДНАЯ КНОПКА
  puffyBtn: {
    position: 'relative',
    width: '280px',
    maxWidth: '44vw',
    height: '50px',
    maxHeight: '11vh',
    borderRadius: '26px',
    // Сочный бордовый градиент
    background: 'linear-gradient(180deg, #be2c24 0%, #9c1f18 42%, #75130f 78%, #4a0b08 100%)',
    // ТЕМНО-БОРДОВАЯ ОБВОДКА ВМЕСТО ЧЕРНОЙ
    border: '3px solid #380708',
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
  btnHighlight: {
    position: 'absolute',
    top: '3px',
    left: '12px',
    right: '12px',
    height: '42%',
    borderRadius: '20px 20px 100px 100px',
    // Надутый овальный блик света
    background: 'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.12) 80%, transparent 100%)',
    pointerEvents: 'none'
  },
  puffyBtnText: {
    position: 'relative',
    zIndex: 2,
    color: '#ffffff',
    fontFamily: '"Fredoka", "Rubik", sans-serif',
    fontSize: '23px',
    fontWeight: 900,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    // Мягкая темная тень комиксного шрифта
    textShadow: `
      0 2px 0 #280405,
      0 3px 3px rgba(0,0,0,0.6)
    `,
    pointerEvents: 'none'
  }
};

export default App;
