import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from './config';

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 2. 2D Ортографическая камера под ширину и высоту экрана
    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = GAME_CONFIG.WORLD_HEIGHT;
    const viewWidth = viewHeight * aspect;

    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      1000
    );
    camera.position.z = 10;

    // 3. Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Ресайз (сохранение масштаба при переворотах и SafeArea)
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const currentAspect = w / h;
      const currentViewWidth = viewHeight * currentAspect;

      camera.left = -currentViewWidth / 2;
      camera.right = currentViewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 5. Игровой цикл
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={styles.canvasContainer} />;
};

const styles: Record<string, React.CSSProperties> = {
  canvasContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000000'
  }
};
