import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BLOCK_SIZE = 30; // 1 блок = 30px
const WORLD_WIDTH = 3000; // Протяженность поля битвы
const GROUND_ROWS = 8; // 1 слой грязи + 7 слоев травы
const GROUND_BOTTOM_Y = 20; // Нижняя граница грунта над краем экрана

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена и чистое небо
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#789bb0');

    // 2. 2D Ортографическая камера: поле гарантированно влезает в экран по высоте
    const viewHeight = 660; // Полная высота мира от дна земли до неба
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

    // Камера отцентрирована по вертикали
    camera.position.y = viewHeight / 2;
    const initialCamX = 750; // Старт у нашей башни справа
    camera.position.x = initialCamX;

    // 3. Рендерер с правильной цветопередачей
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ==========================================
    // 4. ТЕМНЫЕ КОМИКСНЫЕ ТЕКСТУРЫ БЕЗ ЗАСВЕТОВ
    // ==========================================
    const createDarkFallback = (color: string, stroke: string, detail?: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // 100% заполнение без зазоров
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 64, 64);

      // Темный плотный контур блока
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 64, 64);

      if (detail === 'crack') {
        ctx.beginPath();
        ctx.moveTo(12, 12); ctx.lineTo(30, 36); ctx.lineTo(54, 48);
        ctx.stroke();
      } else if (detail === 'gold') {
        ctx.fillStyle = '#c99718';
        ctx.fillRect(16, 16, 14, 14);
        ctx.fillRect(36, 32, 16, 16);
      } else if (detail === 'rings') {
        ctx.strokeStyle = stroke;
        ctx.strokeRect(16, 16, 32, 32);
      } else if (detail === 'planks') {
        ctx.beginPath();
        ctx.moveTo(0, 32); ctx.lineTo(64, 32);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const createBlockMat = (names: string[], fallbackColor: string, strokeColor: string, detail?: string) => {
      const fallbackTex = createDarkFallback(fallbackColor, strokeColor, detail);

      const mat = new THREE.MeshBasicMaterial({
        map: fallbackTex,
        transparent: true,
        alphaTest: 0.1
      });

      const tryLoad = (idx: number) => {
        if (idx >= names.length) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
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
      `/gameplay/blocks/${name}.png`,
      `/blocks/${name}.png`,
      `/${name}.png`
    ];

    const mats = {
      grass: createBlockMat(getPaths('grass'), '#335828', '#1a3314'),
      dirt: createBlockMat([...getPaths('dirt'), ...getPaths('girt')], '#382214', '#1f120a'),
      stone1: createBlockMat(getPaths('stone1'), '#4f545e', '#292b30'),
      stone2: createBlockMat(getPaths('stone2'), '#434750', '#202226', 'crack'),
      stone3: createBlockMat(getPaths('stone3'), '#33363d', '#18191c'),
      planks1: createBlockMat(getPaths('planks1'), '#6e4424', '#3d2411', 'planks'),
      planks2: createBlockMat(getPaths('planks2'), '#5c381c', '#331e0d', 'planks'),
      wood: createBlockMat(getPaths('wood'), '#3d2516', '#21130a', 'rings'),
      leaf: createBlockMat(getPaths('leaf'), '#2d5424', '#173012'),
      ore1: createBlockMat(getPaths('ore1'), '#434750', '#202226', 'gold'),
      ore2: createBlockMat(getPaths('ore2'), '#383c44', '#1a1c20', 'gold')
    };

    // Микроперекрытие +0.4px убирает зазоры и щели
    const blockGeo = new THREE.PlaneGeometry(BLOCK_SIZE + 0.4, BLOCK_SIZE + 0.4);

    const addBlock = (col: number, row: number, mat: THREE.Material, z = 0) => {
      const mesh = new THREE.Mesh(blockGeo, mat);
      mesh.position.set(col * BLOCK_SIZE, row * BLOCK_SIZE, z);
      scene.add(mesh);
      return mesh;
    };

    // ==========================================
    // 5. СОЛНЦЕ (КВАДРАТ ИЗ ТВОЕГО АРТА)
    // ==========================================
    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(BLOCK_SIZE * 2, BLOCK_SIZE * 2),
      new THREE.MeshBasicMaterial({ color: '#fff3a8' })
    );
    sun.rotation.z = Math.PI / 8;
    sun.position.set(200, 560, -5);
    scene.add(sun);

    // ==========================================
    // 6. ЗЕМЛЯ (СТРОГО: 1 СЛОЙ DIRT + 7 СЛОЕВ GRASS)
    // ==========================================
    const groundStartCol = Math.floor((-WORLD_WIDTH / 2) / BLOCK_SIZE);
    const groundEndCol = Math.ceil((WORLD_WIDTH / 2) / BLOCK_SIZE);
    const bottomRow = Math.round(GROUND_BOTTOM_Y / BLOCK_SIZE);

    for (let c = groundStartCol; c <= groundEndCol; c++) {
      // 1. Самый нижний слой — грязь
      addBlock(c, bottomRow, mats.dirt, 0);

      // 2. Следующие 7 слоев — трава
      for (let g = 1; g < GROUND_ROWS; g++) {
        addBlock(c, bottomRow + g, mats.grass, 0);
      }
    }

    // ==========================================
    // 7. БАШЕНКИ (ОТСТУП 3 ЛИНИИ БЛОКОВ СНИЗУ)
    // ==========================================
    const towerBaseRow = bottomRow + 3; // Ровно 3 линии блоков снизу
    const surfaceRow = bottomRow + GROUND_ROWS - 1;
    const TOWER_W = 5;  // 5 блоков шириной
    const TOWER_H = 15; // Высота башни

    const buildTower = (startCol: number, isPlayer: boolean) => {
      for (let r = 0; r < TOWER_H; r++) {
        const curRow = towerBaseRow + r;

        for (let c = 0; c < TOWER_W; c++) {
          const curCol = startCol + c;
          const isOuter = c === 0 || c === TOWER_W - 1;
          const isTop = r === TOWER_H - 1;
          const isCrenel = isTop && (c === 0 || c === 2 || c === 4);
          const isUnderground = curRow <= surfaceRow;

          if (isCrenel) {
            addBlock(curCol, curRow, isPlayer ? mats.stone1 : mats.stone2, 2);
          } else if (isTop) {
            continue;
          } else if (isOuter || isUnderground) {
            addBlock(curCol, curRow, Math.random() > 0.4 ? mats.stone1 : mats.stone2, 1);
          } else {
            // Внутренности башни
            if (c === 1 || c === 3) {
              addBlock(curCol, curRow, mats.stone3, 0);
            } else {
              addBlock(curCol, curRow, Math.random() > 0.5 ? mats.planks1 : mats.planks2, 0);
            }
          }
        }
      }

      // Трон внутри башни (строго из блоков)
      const centerCol = startCol + 2;
      const floorRow = surfaceRow + 1;
      addBlock(centerCol, floorRow, mats.planks1, 2);
      addBlock(centerCol, floorRow + 1, mats.stone1, 2);
    };

    // Наша башня справа, вражеская слева
    buildTower(24, true);
    buildTower(-29, false);

    // ==========================================
    // 8. ДЕРЕВЬЯ (СТВОЛ + 2-3 ВЕТКИ + ЛИСТЬЯ)
    // ==========================================
    const buildTree = (rootCol: number, trunkHeight: number, branchesCount: number) => {
      const treeBaseRow = surfaceRow + 1;

      // 1. Вертикальный ствол
      for (let h = 0; h < trunkHeight; h++) {
        addBlock(rootCol, treeBaseRow + h, mats.wood, 1);
      }

      // 2. Ветка 1 (влево)
      const b1 = Math.floor(trunkHeight * 0.45);
      addBlock(rootCol - 1, treeBaseRow + b1, mats.wood, 1);
      addBlock(rootCol - 2, treeBaseRow + b1, mats.wood, 1);
      addBlock(rootCol - 2, treeBaseRow + b1 + 1, mats.leaf, 2);
      addBlock(rootCol - 3, treeBaseRow + b1, mats.leaf, 2);

      // 3. Ветка 2 (вправо)
      const b2 = Math.floor(trunkHeight * 0.7);
      addBlock(rootCol + 1, treeBaseRow + b2, mats.wood, 1);
      addBlock(rootCol + 2, treeBaseRow + b2, mats.wood, 1);
      addBlock(rootCol + 2, treeBaseRow + b2 + 1, mats.leaf, 2);
      addBlock(rootCol + 3, treeBaseRow + b2, mats.leaf, 2);

      // 4. Ветка 3 (если дерево высокое)
      if (branchesCount >= 3) {
        const b3 = Math.floor(trunkHeight * 0.85);
        addBlock(rootCol - 1, treeBaseRow + b3, mats.wood, 1);
        addBlock(rootCol - 1, treeBaseRow + b3 + 1, mats.leaf, 2);
      }

      // 5. Шапка листьев на вершине
      const topR = treeBaseRow + trunkHeight;
      for (let dc = -2; dc <= 2; dc++) {
        for (let dr = 0; dr <= 2; dr++) {
          if (Math.abs(dc) === 2 && dr === 2) continue;
          addBlock(rootCol + dc, topR + dr, mats.leaf, 2);
        }
      }
    };

    // Дубы в нейтральном лесу
    buildTree(-12, 7, 3);
    buildTree(-6, 6, 2);
    buildTree(0, 8, 3);
    buildTree(7, 6, 2);
    buildTree(13, 7, 3);

    // ==========================================
    // 9. ЗОЛОТЫЕ РУДЫ (5 ЖИЛ ПО 4-7 БЛОКОВ)
    // ==========================================
    const buildOreDeposit = (centerCol: number, count: number) => {
      const offsets = [
        [0, 0], [1, 0], [-1, 0],
        [0, -1], [1, -1],
        [0, 1], [-1, 1]
      ];

      for (let i = 0; i < count; i++) {
        const [dc, dr] = offsets[i];
        const mat = (i % 2 === 0) ? mats.ore1 : mats.ore2;
        addBlock(centerCol + dc, surfaceRow + dr, mat, 1);
      }
    };

    // Ровно 5 скоплений руды в лесу
    buildOreDeposit(-16, 5);
    buildOreDeposit(-9, 6);
    buildOreDeposit(-3, 4);
    buildOreDeposit(4, 7);
    buildOreDeposit(10, 5);

    // ==========================================
    // 10. ФИЗИКА СВАЙПОВ
    // ==========================================
    let targetX = initialCamX;
    let isDragging = false;
    let startPointerX = 0;
    let lastCamX = initialCamX;

    const minX = -1000 + viewWidth / 2;
    const maxX = 1000 - viewWidth / 2;
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

    // Анимационный цикл
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
