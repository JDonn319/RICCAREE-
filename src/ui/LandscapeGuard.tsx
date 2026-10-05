import React, { useState, useEffect } from 'react';

export const LandscapeGuard: React.FC = () => {
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
    <div style={styles.guard}>
      <div style={styles.box}>
        <div style={styles.icon}>🔄</div>
        <h2 style={styles.title}>RICAREE!</h2>
        <p style={styles.desc}>Поверните экран горизонтально для битвы</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  guard: {
    position: 'absolute',
    inset: 0,
    zIndex: 99999,
    backgroundColor: '#000000',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif'
  },
  box: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  icon: {
    fontSize: '44px'
  },
  title: {
    margin: 0,
    letterSpacing: '2px',
    fontSize: '20px'
  },
  desc: {
    margin: 0,
    color: '#777777',
    fontSize: '13px'
  }
};
