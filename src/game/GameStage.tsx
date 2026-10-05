import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const WORLD_TOTAL_WIDTH = 2105; // Длина игрового поля
const PART_WIDTH = WORLD_TOTAL_WIDTH / 3; // Ширина каждой из 3 частей (~701.67px)

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101010');

    // 2. 2D Ортографическая камера
    const viewHeight = 540;
    const aspect = window.innerWidth / window.innerHeight;
    const viewWidth = viewHeight * aspect;

    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      1000
    );
    camera.position.z = 20;

    // 3. Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();

    // ==========================================
    // 4. ПАНОРАМА ИЗ 3 ЧАСТЕЙ (СУММАРНО 2105 PX)
    // ==========================================
    const bgParts = ['/backpart1.png', '/backpart2.png', '/backpart3.png'];

    bgParts.forEach((src, idx) => {
      // +0.5px перекрытия для исключения швов
      const geo = new THREE.PlaneGeometry(PART_WIDTH + 0.5, viewHeight);
      const mat = new THREE.MeshBasicMaterial({ color: '#222222' });
      const mesh = new THREE.Mesh(geo, mat);

      // Раскладка по X: Part1 (-701.67), Part2 (0), Part3 (+701.67)
      const posX = (idx - 1) * PART_WIDTH;
      mesh.position.set(posX, 0, 0);
      scene.add(mesh);

      textureLoader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.NearestFilter;
        mat.map = tex;
        mat.color.set('#ffffff');
        mat.needsUpdate = true;
      });
    });

    // ==========================================
    // 5. БАШНИ ПО КРАЯМ ПОЛЯ 2105
    // ==========================================
    const towerHeight = viewHeight * 0.65;
    const defaultTowerWidth = towerHeight * 0.55;
    const groundLevelY = -viewHeight / 2 + towerHeight / 2;

    // 1. Наша башня (СПРАВА)
    const playerTowerGeo = new THREE.PlaneGeometry(defaultTowerWidth, towerHeight);
    const playerTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const playerTower = new THREE.Mesh(playerTowerGeo, playerTowerMat);
    playerTower.position.set(WORLD_TOTAL_WIDTH / 2 - defaultTowerWidth / 2 - 30, groundLevelY, 2);
    scene.add(playerTower);

    textureLoader.load('/tower.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      playerTowerMat.map = tex;
      playerTowerMat.needsUpdate = true;
      if (tex.image && tex.image.height > 0) {
        const tAspect = tex.image.width / tex.image.height;
        const realW = towerHeight * tAspect;
        playerTower.geometry.dispose();
        playerTower.geometry = new THREE.PlaneGeometry(realW, towerHeight);
        playerTower.position.x = WORLD_TOTAL_WIDTH / 2 - realW / 2 - 30;
      }
    });

    // 2. Башня врага (СЛЕВА)
    const enemyTowerGeo = new THREE.PlaneGeometry(defaultTowerWidth, towerHeight);
    const enemyTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const enemyTower = new THREE.Mesh(enemyTowerGeo, enemyTowerMat);
    enemyTower.position.set(-WORLD_TOTAL_WIDTH / 2 + defaultTowerWidth / 2 + 30, groundLevelY, 2);
    scene.add(enemyTower);

    textureLoader.load('/etower1.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      enemyTowerMat.map = tex;
      enemyTowerMat.needsUpdate = true;
      if (tex.image && tex.image.height > 0) {
        const tAspect = tex.image.width / tex.image.height;
        const realW = towerHeight * tAspect;
        enemyTower.geometry.dispose();
        enemyTower.geometry = new THREE.PlaneGeometry(realW, towerHeight);
        enemyTower.position.x = -WORLD_TOTAL_WIDTH / 2 + realW / 2 + 30;
      }
    });

    // ==========================================
    // 6. СВАЙПЫ И ГРАНИЦЫ КАМЕРЫ
    // ==========================================
    const halfWorld = WORLD_TOTAL_WIDTH / 2;
    const minCamX = -halfWorld + viewWidth / 2; // Предел у башни врага
    const maxCamX = halfWorld - viewWidth / 2;  // Предел у нашей башни

    // Стартуем справа — у нашей башни
    const startCamX = maxCamX;
    camera.position.x = startCamX;
    camera.position.y = 0;

    let targetX = startCamX;
    let isDragging = false;
    let startPointerX = 0;
    let lastCamX = startCamX;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startPointerX = e.clientX;
      lastCamX = targetX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = (e.clientX - startPointerX) * (viewWidth / window.innerWidth);
      targetX = clamp(lastCamX - deltaX, minCamX, maxCamX);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Ресайз
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const curAspect = w / h;
      const curViewWidth = viewHeight * curAspect;

      camera.left = -curViewWidth / 2;
      camera.right = curViewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Цикл рендера
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      camera.position.x += (targetX - camera.position.x) * 0.12;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />;
};
