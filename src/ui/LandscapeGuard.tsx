import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

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
    <div style={styles.overlay}>
      <style>{`
        @keyframes phoneRotate {
          0% {
            transform: rotate(0deg);
          }
          30% {
            transform: rotate(-90deg);
          }
          70% {
            transform: rotate(-90deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
      `}</style>
      
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Smartphone size={68} color="#ffffff" strokeWidth={1.8} />
        </div>
        <h2 style={styles.title}>RICAREE!</h2>
        <p style={styles.text}>Пожалуйста, переверните устройство горизонтально</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
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
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '14px'
  },
  iconContainer: {
    animation: 'phoneRotate 2.5s ease-in-out infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.4))'
  },
  title: {
    margin: 0,
    color: '#ffffff',
    fontSize: '24px',
    letterSpacing: '2px',
    fontWeight: 900
  },
  text: {
    margin: 0,
    color: '#a89294',
    fontSize: '15px',
    maxWidth: '260px',
    lineHeight: 1.4
  }
};
