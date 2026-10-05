import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WORLD_TOTAL_WIDTH = 2105;
const PART_WIDTH = WORLD_TOTAL_WIDTH / 3;

interface Unit {
  group: THREE.Group;
  parts: {
    torso: THREE.Mesh;
    head: THREE.Mesh;
    frontArm: THREE.Group;
    backArm: THREE.Group;
    frontLeg: THREE.Group;
    backLeg: THREE.Group;
    sword: THREE.Mesh;
  };
  speed: number;
  walkTimer: number;
}

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gold] = useState(100);
  const spawnWarriorRef = useRef<() => void>(() => {});

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
    // 4. ПАНОРАМА ИЗ 3 ЧАСТЕЙ (2105 PX)
    // ==========================================
    const bgParts = ['/backpart1.png', '/backpart2.png', '/backpart3.png'];
    bgParts.forEach((src, idx) => {
      const geo = new THREE.PlaneGeometry(PART_WIDTH + 0.5, viewHeight);
      const mat = new THREE.MeshBasicMaterial({ color: '#222222' });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((idx - 1) * PART_WIDTH, 0, 0);
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
    // 5. БАШНИ ПО КРАЯМ ПОЛЯ
    // ==========================================
    const towerHeight = viewHeight * 0.65;
    const defaultTowerWidth = towerHeight * 0.55;
    const groundLevelY = -viewHeight / 2 + towerHeight / 2;

    // Наша башня (справа)
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

    // Вражеская башня (слева)
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
    // 6. ЗАГРУЗЧИК ЧАСТЕЙ ТЕЛА ВОИНА (РИГ)
    // ==========================================
    const createPartTexture = (color: string, stroke: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(4, 4, 56, 56);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 56, 56);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      return tex;
    };

    const loadCharMat = (names: string[], fallbackColor: string) => {
      const fallback = createPartTexture(fallbackColor, '#1b1b1b');
      const mat = new THREE.MeshBasicMaterial({
        map: fallback,
        transparent: true,
        alphaTest: 0.05
      });

      const paths = names.flatMap((name) => [
        `/gameplay/characters/${name}.png`,
        `/gameplay/npc/${name}.png`,
        `/${name}.png`
      ]);

      const tryLoad = (idx: number) => {
        if (idx >= paths.length) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.NearestFilter;
          tex.needsUpdate = true;
          mat.map = tex;
          mat.needsUpdate = true;
        };
        img.onerror = () => tryLoad(idx + 1);
        img.src = paths[idx];
      };
      tryLoad(0);
      return mat;
    };

    const warriorMats = {
      torso: loadCharMat(['WTorso'], '#505663'),
      head: loadCharMat(['Whead', 'WHead'], '#636b7b'),
      arm1: loadCharMat(['WArm1'], '#505663'),
      arm2: loadCharMat(['WArm2'], '#3b404a'),
      leg1: loadCharMat(['WLeg1'], '#454a55'),
      leg2: loadCharMat(['WLeg2'], '#32363e'),
      sword: loadCharMat(['WSword'], '#d6dadf')
    };

    // Создание меша со смещенным центром вращения (пивотом)
    const createPivotMesh = (w: number, h: number, mat: THREE.Material, pivotY: 'top' | 'center' | 'bottom') => {
      const geo = new THREE.PlaneGeometry(w, h);
      if (pivotY === 'top') {
        geo.translate(0, -h / 2, 0); // Вращение вокруг верхнего сустава (плечо, бедро)
      } else if (pivotY === 'bottom') {
        geo.translate(0, h / 2, 0);
      }
      return new THREE.Mesh(geo, mat);
    };

    // ==========================================
    // 7. СБОРКА И СПАВН ВОИНА (2 БЛОКА В ВЫСОТУ)
    // ==========================================
    const units: Unit[] = [];
    const WARRIOR_HEIGHT = 65; // ~2 блока
    const characterFloorY = -viewHeight / 2 + 50; // Линия земли

    const createWarrior = (spawnX: number) => {
      const root = new THREE.Group();
      root.position.set(spawnX, characterFloorY, 5);
      root.scale.set(-1, 1, 1); // Лицом влево на врага

      // 1. Тело (центр)
      const torsoH = WARRIOR_HEIGHT * 0.42;
      const torsoW = torsoH * 0.85;
      const torso = createPivotMesh(torsoW, torsoH, warriorMats.torso, 'center');
      torso.position.set(0, WARRIOR_HEIGHT * 0.45, 0);
      root.add(torso);

      // 2. Голова (на плечах)
      const headH = WARRIOR_HEIGHT * 0.36;
      const headW = headH * 0.9;
      const head = createPivotMesh(headW, headH, warriorMats.head, 'bottom');
      head.position.set(0, torsoH / 2 - 2, 0.02);
      torso.add(head);

      // 3. Ноги (бедра крепятся к низу тела)
      const legH = WARRIOR_HEIGHT * 0.38;
      const legW = legH * 0.55;

      // Задняя нога (слой позади)
      const backLegPivot = new THREE.Group();
      backLegPivot.position.set(-torsoW * 0.22, WARRIOR_HEIGHT * 0.32, -0.02);
      const backLegMesh = createPivotMesh(legW, legH, warriorMats.leg2, 'top');
      backLegPivot.add(backLegMesh);
      root.add(backLegPivot);

      // Передняя нога (слой спереди)
      const frontLegPivot = new THREE.Group();
      frontLegPivot.position.set(torsoW * 0.22, WARRIOR_HEIGHT * 0.32, 0.02);
      const frontLegMesh = createPivotMesh(legW, legH, warriorMats.leg1, 'top');
      frontLegPivot.add(frontLegMesh);
      root.add(frontLegPivot);

      // 4. Руки и меч (плечи крепятся к верху тела)
      const armH = WARRIOR_HEIGHT * 0.34;
      const armW = armH * 0.55;

      // Задняя рука (слой позади)
      const backArmPivot = new THREE.Group();
      backArmPivot.position.set(-torsoW * 0.35, torsoH * 0.3, -0.03);
      const backArmMesh = createPivotMesh(armW, armH, warriorMats.arm2, 'top');
      backArmPivot.add(backArmMesh);
      torso.add(backArmPivot);

      // Передняя рука с мечом (слой спереди)
      const frontArmPivot = new THREE.Group();
      frontArmPivot.position.set(torsoW * 0.35, torsoH * 0.3, 0.04);
      const frontArmMesh = createPivotMesh(armW, armH, warriorMats.arm1, 'top');
      frontArmPivot.add(frontArmMesh);

      // Меч в руке
      const swordH = WARRIOR_HEIGHT * 0.58;
      const swordW = swordH * 0.32;
      const sword = createPivotMesh(swordW, swordH, warriorMats.sword, 'bottom');
      sword.position.set(armW * 0.3, -armH * 0.85, 0.01);
      sword.rotation.z = -Math.PI / 4;
      frontArmPivot.add(sword);

      torso.add(frontArmPivot);
      scene.add(root);

      units.push({
        group: root,
        parts: {
          torso,
          head,
          frontArm: frontArmPivot,
          backArm: backArmPivot,
          frontLeg: frontLegPivot,
          backLeg: backLegPivot,
          sword
        },
        speed: 1.1,
        walkTimer: Math.random() * 10
      });
    };

    spawnWarriorRef.current = () => {
      createWarrior(WORLD_TOTAL_WIDTH / 2 - 120);
    };

    // ==========================================
    // 8. СВАЙПЫ КАМЕРЫ
    // ==========================================
    const halfWorld = WORLD_TOTAL_WIDTH / 2;
    const minCamX = -halfWorld + viewWidth / 2;
    const maxCamX = halfWorld - viewWidth / 2;

    const startCamX = maxCamX;
    camera.position.x = startCamX;
    camera.position.y = 0;

    let targetX = startCamX;
    let isDragging = false;
    let startPointerX = 0;
    let lastCamX = startCamX;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.hud-element')) return;
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

    // ==========================================
    // 9. АНИМАЦИОННЫЙ ЦИКЛ (СИНХРОННЫЙ ШАГ РЫЦАРЯ)
    // ==========================================
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      camera.position.x += (targetX - camera.position.x) * 0.12;

      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        u.group.position.x -= u.speed;

        u.walkTimer += delta * 7.5;
        const swing = Math.sin(u.walkTimer);

        u.parts.frontLeg.rotation.z = swing * 0.55;
        u.parts.backLeg.rotation.z = -swing * 0.55;

        u.parts.frontArm.rotation.z = -swing * 0.45;
        u.parts.backArm.rotation.z = swing * 0.45;

        u.parts.torso.position.y = WARRIOR_HEIGHT * 0.45 + Math.abs(swing) * 2;
        u.parts.head.rotation.z = Math.sin(u.walkTimer * 0.5) * 0.08;
        u.parts.sword.rotation.z = -Math.PI / 4 + swing * 0.12;
      }

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

  return (
    <div style={styles.stageContainer}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {/* Интерфейс призыва */}
      <div style={styles.hudOverlay}>
        <div className="hud-element" style={styles.goldCounter}>
          <span style={styles.coinIcon}>🪙</span>
          <span style={styles.goldAmount}>{gold}</span>
        </div>

        <div style={styles.summonRow}>
          <button
            className="hud-element"
            onClick={() => spawnWarriorRef.current()}
            style={styles.unitCard}
          >
            <div style={styles.unitAvatar}>⚔️</div>
            <span style={styles.unitName}>WARRIOR</span>
            <span style={styles.unitCost}>0 🪙</span>
          </button>

          <button className="hud-element" style={{ ...styles.unitCard, ...styles.unitDisabled }}>
            <div style={styles.unitAvatar}>🏹</div>
            <span style={styles.unitName}>ARCHER</span>
            <span style={styles.unitCost}>0 🪙</span>
          </button>

          <button className="hud-element" style={{ ...styles.unitCard, ...styles.unitDisabled }}>
            <div style={styles.unitAvatar}>🛡️</div>
            <span style={styles.unitName}>KNIGHT</span>
            <span style={styles.unitCost}>0 🪙</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  stageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden'
  },
  hudOverlay: {
    position: 'absolute',
    top: '14px',
    left: '110px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    pointerEvents: 'auto'
  },
  goldCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    border: '2px solid #5a4214',
    padding: '6px 14px',
    borderRadius: '12px'
  },
  coinIcon: {
    fontSize: '18px'
  },
  goldAmount: {
    color: '#ffca28',
    fontFamily: '"Rubik", "Arial Black", sans-serif',
    fontSize: '16px',
    fontWeight: 900
  },
  summonRow: {
    display: 'flex',
    gap: '8px'
  },
  unitCard: {
    width: '74px',
    height: '68px',
    backgroundColor: 'rgba(26, 12, 14, 0.85)',
    border: '2px solid #8e2424',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
    transition: 'transform 0.05s ease-out'
  },
  unitDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    borderColor: '#444444',
    backgroundColor: 'rgba(30, 30, 30, 0.7)'
  },
  unitAvatar: {
    fontSize: '20px',
    lineHeight: 1
  },
  unitName: {
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.5px'
  },
  unitCost: {
    color: '#ffd54f',
    fontSize: '10px',
    fontWeight: 800
  }
};
