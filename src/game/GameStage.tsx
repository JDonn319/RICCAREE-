import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BLOCK_SIZE = 28; // Базовый размер блока (воин будет ~2 блока = 56px)
const WORLD_WIDTH = 2600; // Ширина поля битвы
const GROUND_Y = -120; // Уровень грунта

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена и чистое мультяшное небо
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#9ab7c8');

    // 2. 2D Ортографическая камера под размеры экрана
    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = 440;
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

    // Стартуем справа — у НАШЕГО замка
    const initialCamX = 850;
    camera.position.x = initialCamX;
    camera.position.y = 20;

    // 3. Рендерер с поддержкой ретины
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Загрузчик текстур с приоритетом путей и генератором запасных текстур
    const textureLoader = new THREE.TextureLoader();

    const createFallbackCanvas = (color: string, stroke: string, detail?: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, 64, 64);

      if (detail === 'crack') {
        ctx.beginPath();
        ctx.moveTo(12, 12); ctx.lineTo(32, 38); ctx.lineTo(52, 46);
        ctx.stroke();
      } else if (detail === 'gold') {
        ctx.fillStyle = '#ffd13b';
        ctx.fillRect(16, 16, 16, 16);
        ctx.fillRect(36, 32, 14, 14);
      } else if (detail === 'wood_rings') {
        ctx.strokeStyle = '#3e2723';
        ctx.strokeRect(16, 16, 32, 32);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    };

    const getTex = (name: string, fallbackColor: string, strokeColor: string, detail?: string) => {
      const fallback = createFallbackCanvas(fallbackColor, strokeColor, detail);

      // Сначала ищем в /blocks/, если нет — пробуем /gameplay/blocks/, затем в корне
      const tex = textureLoader.load(
        `/blocks/${name}.png`,
        () => { tex.needsUpdate = true; },
        undefined,
        () => {
          textureLoader.load(
            `/gameplay/blocks/${name}.png`,
            (loaded) => {
              tex.image = loaded.image;
              tex.needsUpdate = true;
            },
            undefined,
            () => {
              textureLoader.load(`/${name}.png`, (rootLoaded) => {
                tex.image = rootLoaded.image;
                tex.needsUpdate = true;
              });
            }
          );
        }
      );

      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex || fallback;
    };

    // Материалы всех типов блоков
    const mats = {
      grass: new THREE.MeshBasicMaterial({ map: getTex('grass', '#4fa644', '#285822') }),
      dirt: new THREE.MeshBasicMaterial({ map: getTex('dirt', '#6d4529', '#3b2313') }),
      stone1: new THREE.MeshBasicMaterial({ map: getTex('stone1', '#7b8089', '#3f4247') }),
      stone2: new THREE.MeshBasicMaterial({ map: getTex('stone2', '#696e77', '#34373b', 'crack') }),
      stone3: new THREE.MeshBasicMaterial({ map: getTex('stone3', '#4e525a', '#282a2e') }),
      planks1: new THREE.MeshBasicMaterial({ map: getTex('planks1', '#ab6d3d', '#58361b') }),
      planks2: new THREE.MeshBasicMaterial({ map: getTex('planks2', '#975e33', '#472b14') }),
      wood: new THREE.MeshBasicMaterial({ map: getTex('wood', '#5c3a21', '#2f1b0e', 'wood_rings') }),
      leaf: new THREE.MeshBasicMaterial({ map: getTex('leaf', '#3a8735', '#1e4b1a'), transparent: true, alphaTest: 0.05 }),
      ore1: new THREE.MeshBasicMaterial({ map: getTex('ore1', '#7b8089', '#3f4247', 'gold') }),
      ore2: new THREE.MeshBasicMaterial({ map: getTex('ore2', '#696e77', '#34373b', 'gold') }),
      throneGold: new THREE.MeshBasicMaterial({ color: '#ffb300' }),
      throneRed: new THREE.MeshBasicMaterial({ color: '#b71c1c' })
    };

    const blockGeo = new THREE.PlaneGeometry(BLOCK_SIZE, BLOCK_SIZE);

    const addBlock = (x: number, y: number, mat: THREE.Material, z = 0) => {
      const mesh = new THREE.Mesh(blockGeo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    // ==========================================
    // 5. СОЛНЦЕ И НЕБО (КВАДРАТ ИЗ РЕФЕРЕНСА)
    // ==========================================
    const sunGroup = new THREE.Group();
    const sunCore = new THREE.Mesh(
      new THREE.PlaneGeometry(54, 54),
      new THREE.MeshBasicMaterial({ color: '#fffbe0' })
    );
    const sunGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(76, 76),
      new THREE.MeshBasicMaterial({ color: '#ffea75', transparent: true, opacity: 0.35 })
    );
    sunGroup.add(sunGlow);
    sunGroup.add(sunCore);
    sunGroup.rotation.z = Math.PI / 8; // Ромбовидный наклон
    sunGroup.position.set(180, 160, -5);
    scene.add(sunGroup);

    // ==========================================
    // 6. ЗЕМЛЯ (СНИЗУ DIRT, СВЕРХУ GRASS)
    // ==========================================
    const totalCols = Math.ceil(WORLD_WIDTH / BLOCK_SIZE);
    const startX = -WORLD_WIDTH / 2;

    for (let c = 0; c < totalCols; c++) {
      const bx = startX + c * BLOCK_SIZE;
      // 2 нижних слоя — чистая грязь
      addBlock(bx, GROUND_Y - BLOCK_SIZE * 2, mats.dirt);
      addBlock(bx, GROUND_Y - BLOCK_SIZE, mats.dirt);
      // 2 верхних слоя — трава
      addBlock(bx, GROUND_Y, mats.grass);
      addBlock(bx, GROUND_Y + BLOCK_SIZE, mats.grass);
    }

    const surfaceY = GROUND_Y + BLOCK_SIZE * 1.5;

    // ==========================================
    // 7. НАШ ЗАМОК (СПРАВА: x = 700 ... 1100)
    // ==========================================
    const buildPlayerCastle = (baseX: number) => {
      const castleWidth = 14;
      const castleHeight = 12;

      for (let r = 0; r < castleHeight; r++) {
        for (let c = 0; c < castleWidth; c++) {
          const bx = baseX + c * BLOCK_SIZE;
          const by = surfaceY + r * BLOCK_SIZE;

          const isOuterWall = c === 0 || c === castleWidth - 1 || r === 0;
          const isRoof = r === castleHeight - 1;
          const isBattlements = r === castleHeight - 1 && c % 2 === 0;

          if (isBattlements || isRoof) {
            addBlock(bx, by, mats.stone1, 1);
          } else if (isOuterWall) {
            addBlock(bx, by, Math.random() > 0.4 ? mats.stone1 : mats.stone2, 1);
          } else {
            // Внутренний зал: опорные колонны stone3 + стены/пол из planks
            if (c % 4 === 0) {
              addBlock(bx, by, mats.stone3, 0);
            } else {
              addBlock(bx, by, Math.random() > 0.5 ? mats.planks1 : mats.planks2, 0);
            }
          }
        }
      }

      // Трон короля
      const throneX = baseX + (castleWidth / 2) * BLOCK_SIZE;
      const throneY = surfaceY + BLOCK_SIZE * 1.5;
      const tSeat = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), mats.throneRed);
      tSeat.position.set(throneX, throneY, 2);
      const tBack = new THREE.Mesh(new THREE.PlaneGeometry(16, 32), mats.throneGold);
      tBack.position.set(throneX, throneY + 14, 2);
      scene.add(tSeat);
      scene.add(tBack);
    };

    // ==========================================
    // 8. ЗАМОК ВРАГА (СЛЕВА: x = -1100 ... -700)
    // ==========================================
    const buildEnemyCastle = (baseX: number) => {
      const castleWidth = 14;
      const castleHeight = 14;

      for (let r = 0; r < castleHeight; r++) {
        for (let c = 0; c < castleWidth; c++) {
          const bx = baseX + c * BLOCK_SIZE;
          const by = surfaceY + r * BLOCK_SIZE;

          const isOuter = c === 0 || c === castleWidth - 1 || r === 0;
          const isSpike = r >= castleHeight - 3 && (c <= 2 || c >= castleWidth - 3);

          if (isSpike || r === castleHeight - 4) {
            addBlock(bx, by, mats.stone2, 1);
          } else if (isOuter) {
            addBlock(bx, by, Math.random() > 0.3 ? mats.stone2 : mats.stone3, 1);
          } else {
            addBlock(bx, by, mats.stone3, 0);
          }
        }
      }

      // Вражеский трон
      const throneX = baseX + (castleWidth / 2) * BLOCK_SIZE;
      const throneY = surfaceY + BLOCK_SIZE * 1.5;
      const tSeat = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), mats.stone3);
      tSeat.position.set(throneX, throneY, 2);
      const tBack = new THREE.Mesh(new THREE.PlaneGeometry(14, 30), mats.stone1);
      tBack.position.set(throneX, throneY + 12, 2);
      scene.add(tSeat);
      scene.add(tBack);
    };

    buildPlayerCastle(700);
    buildEnemyCastle(-1100);

    // ==========================================
    // 9. НЕЙТРАЛЬНЫЙ ЛЕС И ЗОЛОТЫЕ ЖИЛЫ (ЦЕНТР)
    // ==========================================
    const buildOakTree = (x: number) => {
      const trunkHeight = 4;
      for (let h = 0; h < trunkHeight; h++) {
        addBlock(x, surfaceY + h * BLOCK_SIZE, mats.wood, 1);
      }
      const crownBaseY = surfaceY + trunkHeight * BLOCK_SIZE;
      for (let lx = -2; lx <= 2; lx++) {
        for (let ly = -1; ly <= 2; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(ly) === 2) continue; // скругление кроны
          addBlock(x + lx * BLOCK_SIZE, crownBaseY + ly * BLOCK_SIZE, mats.leaf, 2);
        }
      }
    };

    const buildGoldDeposit = (x: number) => {
      addBlock(x, surfaceY, mats.ore1, 1);
      addBlock(x + BLOCK_SIZE, surfaceY, mats.ore2, 1);
      addBlock(x + BLOCK_SIZE / 2, surfaceY + BLOCK_SIZE, mats.ore1, 1);
    };

    // Дубы
    buildOakTree(-140);
    buildOakTree(20);
    buildOakTree(180);

    // Золото
    buildGoldDeposit(-290);
    buildGoldDeposit(340);

    // ==========================================
    // 10. ФИЗИКА СВАЙПОВ И ГРАНИЦЫ КАМЕРЫ
    // ==========================================
    let targetX = initialCamX;
    let isDragging = false;
    let startPointerX = 0;
    let lastCamX = initialCamX;

    const minX = -1100 + viewWidth / 2;
    const maxX = 1100 - viewWidth / 2;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startPointerX = e.clientX;
      lastCamX = targetX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = (e.clientX - startPointerX) * (viewWidth / window.innerWidth);
      targetX = clamp(lastCamX - deltaX, minX, maxX);
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
      const newAspect = w / h;
      const curViewWidth = viewHeight * newAspect;

      camera.left = -curViewWidth / 2;
      camera.right = curViewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Цикл анимации
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      camera.position.x += (targetX - camera.position.x) * 0.12; // Плавное следование за свайпом
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
