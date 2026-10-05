import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101010');

    // 2. 2D Ортографическая камера под высоту экрана
    const viewHeight = 540; // Базовая высота мира
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

    // 3. Рендерер с правильной цветопередачей
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();

    // ==========================================
    // 4. СШИВАНИЕ ПАНОРАМЫ ИЗ 3 ЧАСТЕЙ
    // ==========================================
    // Приблизительная пропорция 16:9 для фонов до момента их загрузки
    const defaultPartWidth = viewHeight * (16 / 9);

    const bgMeshes: THREE.Mesh[] = [];
    const bgParts = ['/backpart1.png', '/backpart2.png', '/backpart3.png'];

    bgParts.forEach((src, idx) => {
      const geo = new THREE.PlaneGeometry(defaultPartWidth, viewHeight);
      const mat = new THREE.MeshBasicMaterial({ color: '#222222' });
      const mesh = new THREE.Mesh(geo, mat);

      // Раскладываем слева направо: part1 (-W), part2 (0), part3 (+W)
      mesh.position.set((idx - 1) * defaultPartWidth, 0, 0);
      scene.add(mesh);
      bgMeshes.push(mesh);

      // Загрузка реального арта с обновлением пропорций
      textureLoader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.NearestFilter;
        mat.map = tex;
        mat.color.set('#ffffff');
        mat.needsUpdate = true;

        if (tex.image && tex.image.height > 0) {
          const partAspect = tex.image.width / tex.image.height;
          const realWidth = viewHeight * partAspect;
          mesh.geometry.dispose();
          mesh.geometry = new THREE.PlaneGeometry(realWidth + 1, viewHeight); // +1px исключает зазоры
        }
      });
    });

    // ==========================================
    // 5. БАШНИ: ВРАГ СЛЕВА (etower1), МЫ СПРАВА (tower)
    // ==========================================
    const towerHeight = viewHeight * 0.65; // Башня занимает ~65% высоты экрана
    const towerDefaultWidth = towerHeight * 0.55;
    const groundLevelY = -viewHeight / 2 + towerHeight / 2; // Прижаты к низу экрана

    // Наша башня (справа)
    const playerTowerGeo = new THREE.PlaneGeometry(towerDefaultWidth, towerHeight);
    const playerTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const playerTower = new THREE.Mesh(playerTowerGeo, playerTowerMat);
    playerTower.position.set(defaultPartWidth * 1.05, groundLevelY, 2);
    scene.add(playerTower);

    textureLoader.load('/tower.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      playerTowerMat.map = tex;
      playerTowerMat.needsUpdate = true;
      if (tex.image) {
        const tAspect = tex.image.width / tex.image.height;
        playerTower.geometry.dispose();
        playerTower.geometry = new THREE.PlaneGeometry(towerHeight * tAspect, towerHeight);
      }
    });

    // Вражеская башня (слева)
    const enemyTowerGeo = new THREE.PlaneGeometry(towerDefaultWidth, towerHeight);
    const enemyTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const enemyTower = new THREE.Mesh(enemyTowerGeo, enemyTowerMat);
    enemyTower.position.set(-defaultPartWidth * 1.05, groundLevelY, 2);
    scene.add(enemyTower);

    textureLoader.load('/etower1.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      enemyTowerMat.map = tex;
      enemyTowerMat.needsUpdate = true;
      if (tex.image) {
        const tAspect = tex.image.width / tex.image.height;
        enemyTower.geometry.dispose();
        enemyTower.geometry = new THREE.PlaneGeometry(towerHeight * tAspect, towerHeight);
      }
    });

    // ==========================================
    // 6. УПРАВЛЕНИЕ КАМЕРОЙ И СКРОЛЛОМ (СВАЙПЫ)
    // ==========================================
    const totalHalfWidth = (defaultPartWidth * 3) / 2;
    const minCamX = -totalHalfWidth + viewWidth / 2; // Левый край (башня врага)
    const maxCamX = totalHalfWidth - viewWidth / 2;  // Правый край (наша башня)

    // Стартуем строго справа — у нашей башни
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

    // Ресайз окна
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

    // Цикл рендера с мягким следованием камеры
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
