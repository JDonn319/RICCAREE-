import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BLOCK_SIZE = 42; // Увеличенный размер блоков
const WORLD_WIDTH = 3200; // Протяженность поля битвы
const GROUND_ROWS = 8; // 1 слой грязи + 7 слоев травы
const GROUND_BOTTOM_Y = -180; // Нижняя точка мира
const SURFACE_Y = GROUND_BOTTOM_Y + (GROUND_ROWS - 1) * BLOCK_SIZE; // Поверхность травы

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена и голубое небо
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#9ab7c8');

    // 2. 2D Ортографическая камера
    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = 520;
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

    // Старт камеры справа — у НАШЕЙ башни
    const initialCamX = 850;
    camera.position.x = initialCamX;
    camera.position.y = SURFACE_Y + 120;

    // 3. Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ==========================================
    // 4. НАДЕЖНАЯ СИСТЕМА ТЕКСТУР (БЕЗ ЧЕРНЫХ КВАДРАТОВ)
    // ==========================================
    const createFallbackTexture = (color: string, stroke: string, detail?: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Базовый цвет блока
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 64, 64);

      // Контур блока
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 60, 60);

      if (detail === 'grass_top') {
        ctx.fillStyle = stroke;
        for (let i = 0; i < 8; i++) {
          ctx.fillRect(4 + i * 8, 4, 4, 10);
        }
      } else if (detail === 'crack') {
        ctx.beginPath();
        ctx.moveTo(10, 10); ctx.lineTo(26, 32); ctx.lineTo(52, 44);
        ctx.stroke();
      } else if (detail === 'gold') {
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(16, 16, 14, 14);
        ctx.fillRect(36, 30, 16, 16);
        ctx.strokeStyle = '#ff8f00';
        ctx.strokeRect(16, 16, 14, 14);
        ctx.strokeRect(36, 30, 16, 16);
      } else if (detail === 'wood_rings') {
        ctx.strokeStyle = stroke;
        ctx.strokeRect(14, 14, 36, 36);
      } else if (detail === 'planks') {
        ctx.beginPath();
        ctx.moveTo(2, 32); ctx.lineTo(62, 32);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    };

    // Создание материала с защитой от черного фона (transparent + alphaTest)
    const createBlockMaterial = (names: string[], fallbackColor: string, strokeColor: string, detail?: string) => {
      const fallbackTex = createFallbackTexture(fallbackColor, strokeColor, detail);

      const mat = new THREE.MeshBasicMaterial({
        map: fallbackTex,
        transparent: true,
        alphaTest: 0.05 // Отсекает прозрачные пиксели PNG, предотвращая черный фон
      });

      // Асинхронно ищем PNG по всем возможным путям
      const tryLoad = (idx: number) => {
        if (idx >= names.length) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.needsUpdate = true;
          mat.map = tex;
          mat.needsUpdate = true;
        };
        img.onerror = () => tryLoad(idx + 1);
        img.src = names[idx];
      };

      tryLoad(0);
      return mat;
    };

    const getPaths = (name: string) => [
      `/blocks/${name}.png`,
      `/gameplay/blocks/${name}.png`,
      `/${name}.png`
    ];

    const mats = {
      grass: createBlockMaterial(getPaths('grass'), '#4caf50', '#2e7d32', 'grass_top'),
      dirt: createBlockMaterial([...getPaths('girt'), ...getPaths('dirt')], '#5d4037', '#3e2723'),
      stone1: createBlockMaterial(getPaths('stone1'), '#78909c', '#455a64'),
      stone2: createBlockMaterial(getPaths('stone2'), '#607d8b', '#37474f', 'crack'),
      stone3: createBlockMaterial(getPaths('stone3'), '#455a64', '#263238'),
      planks1: createBlockMaterial(getPaths('planks1'), '#a1887f', '#4e342e', 'planks'),
      planks2: createBlockMaterial(getPaths('planks2'), '#8d6e63', '#3e2723', 'planks'),
      wood: createBlockMaterial(getPaths('wood'), '#6d4c41', '#3e2723', 'wood_rings'),
      leaf: createBlockMaterial(getPaths('leaf'), '#388e3c', '#1b5e20'),
      ore1: createBlockMaterial(getPaths('ore1'), '#78909c', '#455a64', 'gold'),
      ore2: createBlockMaterial(getPaths('ore2'), '#607d8b', '#37474f', 'gold'),
      throneGold: new THREE.MeshBasicMaterial({ color: '#ffc107' }),
      throneRed: new THREE.MeshBasicMaterial({ color: '#c62828' })
    };

    const blockGeo = new THREE.PlaneGeometry(BLOCK_SIZE, BLOCK_SIZE);

    const addBlock = (x: number, y: number, mat: THREE.Material, z = 0) => {
      const mesh = new THREE.Mesh(blockGeo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    // ==========================================
    // 5. СОЛНЦЕ (ЖЕЛТЫЙ СВЕТЯЩИЙСЯ КУБ)
    // ==========================================
    const sunGroup = new THREE.Group();
    const sunCore = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 64),
      new THREE.MeshBasicMaterial({ color: '#fff9c4' })
    );
    const sunGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(92, 92),
      new THREE.MeshBasicMaterial({ color: '#ffee58', transparent: true, opacity: 0.35 })
    );
    sunGroup.add(sunGlow);
    sunGroup.add(sunCore);
    sunGroup.rotation.z = Math.PI / 8;
    sunGroup.position.set(220, SURFACE_Y + 320, -5);
    scene.add(sunGroup);

    // ==========================================
    // 6. ЗЕМЛЯ: 1 СЛОЙ DIRT + 7 СЛОЕВ GRASS
    // ==========================================
    const totalCols = Math.ceil(WORLD_WIDTH / BLOCK_SIZE);
    const startX = -WORLD_WIDTH / 2;

    for (let c = 0; c < totalCols; c++) {
      const bx = startX + c * BLOCK_SIZE;

      // 1. Самый нижний слой — dirt / girt
      addBlock(bx, GROUND_BOTTOM_Y, mats.dirt);

      // 2. Следующие ровно 7 слоев — grass
      for (let g = 1; g < GROUND_ROWS; g++) {
        addBlock(bx, GROUND_BOTTOM_Y + g * BLOCK_SIZE, mats.grass);
      }
    }

    // ==========================================
    // 7. БАШЕНКИ (ОТСТУП 3 ЛИНИИ БЛОКОВ СНИЗУ)
    // ==========================================
    const towerFoundationY = GROUND_BOTTOM_Y + 3 * BLOCK_SIZE; // Отступ 3 блока снизу
    const TOWER_WIDTH = 6;  // Ширина башенки в блоках
    const TOWER_HEIGHT = 14; // Высота башенки

    const buildTower = (baseX: number, isPlayer: boolean) => {
      for (let r = 0; r < TOWER_HEIGHT; r++) {
        for (let c = 0; c < TOWER_WIDTH; c++) {
          const bx = baseX + c * BLOCK_SIZE;
          const by = towerFoundationY + r * BLOCK_SIZE;

          const isOuterWall = c === 0 || c === TOWER_WIDTH - 1;
          const isTopCrown = r === TOWER_HEIGHT - 1;
          const isBattlements = isTopCrown && (c === 0 || c === 2 || c === TOWER_WIDTH - 1);
          const isUnderground = by <= SURFACE_Y;

          // Зубцы на крыше
          if (isBattlements) {
            addBlock(bx, by, isPlayer ? mats.stone1 : mats.stone2, 2);
          } else if (isTopCrown) {
            continue; // Пропуски между зубцами
          } else if (isOuterWall || isUnderground) {
            // Внешняя кладка или подземный фундамент
            const stoneMat = Math.random() > 0.4 ? mats.stone1 : mats.stone2;
            addBlock(bx, by, stoneMat, 1);
          } else {
            // Внутренний разрез башни (опоры stone3 + перекрытия planks)
            if (c === 1 || c === TOWER_WIDTH - 2) {
              addBlock(bx, by, mats.stone3, 0);
            } else {
              addBlock(bx, by, Math.random() > 0.5 ? mats.planks1 : mats.planks2, 0);
            }
          }
        }
      }

      // Трон внутри башни (на уровне земли)
      const throneX = baseX + (TOWER_WIDTH / 2 - 0.5) * BLOCK_SIZE;
      const throneY = SURFACE_Y + BLOCK_SIZE * 0.8;

      const tSeat = new THREE.Mesh(
        new THREE.PlaneGeometry(BLOCK_SIZE * 1.1, BLOCK_SIZE * 0.5),
        isPlayer ? mats.throneRed : mats.stone3
      );
      tSeat.position.set(throneX, throneY, 3);

      const tBack = new THREE.Mesh(
        new THREE.PlaneGeometry(BLOCK_SIZE * 0.6, BLOCK_SIZE * 1.2),
        isPlayer ? mats.throneGold : mats.stone1
      );
      tBack.position.set(throneX, throneY + BLOCK_SIZE * 0.5, 3);

      scene.add(tSeat);
      scene.add(tBack);
    };

    // Наша башня — справа (+850), башня врага — слева (-850)
    buildTower(850, true);
    buildTower(-850 - TOWER_WIDTH * BLOCK_SIZE, false);

    // ==========================================
    // 8. ДЕРЕВЬЯ (СТВОЛ + 2-3 ВЕТКИ + КРОНА)
    // ==========================================
    const buildTree = (rootX: number, trunkHeight: number) => {
      // 1. Прямой ствол
      for (let h = 1; h <= trunkHeight; h++) {
        addBlock(rootX, SURFACE_Y + h * BLOCK_SIZE, mats.wood, 1);
      }

      // 2. Ветка 1 (налево)
      const b1Y = SURFACE_Y + Math.floor(trunkHeight * 0.5) * BLOCK_SIZE;
      addBlock(rootX - BLOCK_SIZE, b1Y, mats.wood, 1);
      addBlock(rootX - BLOCK_SIZE * 2, b1Y + BLOCK_SIZE * 0.5, mats.wood, 1);
      // Листья вокруг левой ветки
      addBlock(rootX - BLOCK_SIZE * 2, b1Y + BLOCK_SIZE * 1.5, mats.leaf, 2);
      addBlock(rootX - BLOCK_SIZE * 3, b1Y + BLOCK_SIZE * 0.5, mats.leaf, 2);

      // 3. Ветка 2 (направо)
      const b2Y = SURFACE_Y + Math.floor(trunkHeight * 0.75) * BLOCK_SIZE;
      addBlock(rootX + BLOCK_SIZE, b2Y, mats.wood, 1);
      addBlock(rootX + BLOCK_SIZE * 2, b2Y + BLOCK_SIZE * 0.5, mats.wood, 1);
      // Листья вокруг правой ветки
      addBlock(rootX + BLOCK_SIZE * 2, b2Y + BLOCK_SIZE * 1.5, mats.leaf, 2);
      addBlock(rootX + BLOCK_SIZE * 3, b2Y + BLOCK_SIZE * 0.5, mats.leaf, 2);

      // 4. Ветка 3 (дополнительная)
      if (trunkHeight > 5) {
        const b3Y = SURFACE_Y + Math.floor(trunkHeight * 0.6) * BLOCK_SIZE;
        addBlock(rootX - BLOCK_SIZE, b3Y + BLOCK_SIZE, mats.wood, 1);
        addBlock(rootX - BLOCK_SIZE, b3Y + BLOCK_SIZE * 2, mats.leaf, 2);
      }

      // 5. Пышная шапка листьев на макушке дерева
      const topY = SURFACE_Y + (trunkHeight + 1) * BLOCK_SIZE;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -1; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 && dy === 2) continue; // скругление углов
          addBlock(rootX + dx * BLOCK_SIZE, topY + dy * BLOCK_SIZE, mats.leaf, 2);
        }
      }
    };

    // Расставляем дубы в нейтральном лесу
    buildTree(-380, 6);
    buildTree(-180, 5);
    buildTree(0, 7);
    buildTree(220, 5);
    buildTree(420, 6);

    // ==========================================
    // 9. ЗОЛОТЫЕ ЖИЛЫ В ЛЕСУ (4-5 ШТУК ПО 4-7 БЛОКОВ)
    // ==========================================
    const buildOreVein = (centerX: number, blockCount: number) => {
      let placed = 0;
      // Вращиваем руду в верхние слои травы и на поверхность
      const positions = [
        [0, 0], [1, 0], [-1, 0], [0, 1],
        [1, 1], [-1, 1], [0, -1]
      ];

      for (const [ox, oy] of positions) {
        if (placed >= blockCount) break;
        const mat = Math.random() > 0.5 ? mats.ore1 : mats.ore2;
        addBlock(centerX + ox * BLOCK_SIZE, SURFACE_Y + oy * BLOCK_SIZE, mat, 1);
        placed++;
      }
    };

    // Ровно 5 месторождений по 4–7 блоков
    buildOreVein(-480, 5);
    buildOreVein(-280, 6);
    buildOreVein(-80, 4);
    buildOreVein(120, 7);
    buildOreVein(320, 5);

    // ==========================================
    // 10. ФИЗИКА СВАЙПОВ
    // ==========================================
    let targetX = initialCamX;
    let isDragging = false;
    let startPointerX = 0;
    let lastCamX = initialCamX;

    const minX = -1050 + viewWidth / 2; // Предел у башни врага
    const maxX = 1050 - viewWidth / 2;  // Предел у нашей башни

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

    // Рендер-луп
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      camera.position.x += (targetX - camera.position.x) * 0.12; // Плавное движение камеры
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
