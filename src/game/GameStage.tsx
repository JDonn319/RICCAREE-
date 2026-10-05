import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Swords, Shield, Flag } from 'lucide-react';

const WORLD_TOTAL_WIDTH = 2105;
const PART_WIDTH = WORLD_TOTAL_WIDTH / 3;

type ArmyCommand = 'retreat' | 'defend' | 'attack';

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
  const [command, setCommand] = useState<ArmyCommand>('defend');
  const [spawnCd, setSpawnCd] = useState<number>(0); // Кулдаун спавна в секундах

  const spawnWarriorRef = useRef<() => void>(() => {});
  const commandRef = useRef<ArmyCommand>('defend');

  // Синхронизация рефа команды для анимационного цикла Three.js
  useEffect(() => {
    commandRef.current = command;
  }, [command]);

  // Таймер кулдауна 8 секунд
  useEffect(() => {
    if (spawnCd <= 0) return;
    const interval = 50;
    const timer = setInterval(() => {
      setSpawnCd((prev) => {
        if (prev <= 0.05) {
          clearInterval(timer);
          spawnWarriorRef.current(); // По истечении 8 секунд воин появляется и выходит
          return 0;
        }
        return Math.max(0, +(prev - interval / 1000).toFixed(2));
      });
    }, interval);

    return () => clearInterval(timer);
  }, [spawnCd]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101010');

    // 2. 2D Ортографическая камера под высоту экрана
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
    // 5. БАШНИ: НАША СЛЕВА, ВРАГ СПРАВА
    // ==========================================
    const towerHeight = viewHeight * 0.65;
    const defaultTowerWidth = towerHeight * 0.55;
    const groundLevelY = -viewHeight / 2 + towerHeight / 2;

    // 1. Наша башня (СЛЕВА)
    const playerTowerGeo = new THREE.PlaneGeometry(defaultTowerWidth, towerHeight);
    const playerTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const playerTower = new THREE.Mesh(playerTowerGeo, playerTowerMat);
    playerTower.position.set(-WORLD_TOTAL_WIDTH / 2 + defaultTowerWidth / 2 + 30, groundLevelY, 2);
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
        playerTower.position.x = -WORLD_TOTAL_WIDTH / 2 + realW / 2 + 30;
      }
    });

    // 2. Вражеская башня (СПРАВА)
    const enemyTowerGeo = new THREE.PlaneGeometry(defaultTowerWidth, towerHeight);
    const enemyTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const enemyTower = new THREE.Mesh(enemyTowerGeo, enemyTowerMat);
    enemyTower.position.set(WORLD_TOTAL_WIDTH / 2 - defaultTowerWidth / 2 - 30, groundLevelY, 2);
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
        enemyTower.position.x = WORLD_TOTAL_WIDTH / 2 - realW / 2 - 30;
      }
    });

    // ==========================================
    // 6. ЗАГРУЗЧИК РИГА WARRIOR (ИЗ РЕФЕРЕНСА)
    // ==========================================
    const createPartFallback = (color: string, isBack = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = isBack ? '#2d323b' : color;
      ctx.fillRect(4, 4, 56, 56);
      ctx.strokeStyle = '#121417';
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 56, 56);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      return tex;
    };

    const loadPieceMat = (names: string[], fallbackColor: string, isBack = false) => {
      const fallback = createPartFallback(fallbackColor, isBack);
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
      head: loadPieceMat(['Whead', 'WHead'], '#5a6273'),
      torso: loadPieceMat(['WTorso'], '#505666'),
      armFront: loadPieceMat(['WArm1'], '#505666'),
      armBack: loadPieceMat(['WArm2'], '#30343d', true),
      legFront: loadPieceMat(['WLeg1'], '#464c59'),
      legBack: loadPieceMat(['WLeg2'], '#2b2f38', true),
      sword: loadPieceMat(['WSword'], '#d6dadf')
    };

    const createPivotMesh = (w: number, h: number, mat: THREE.Material, pivotY: 'top' | 'center' | 'bottom') => {
      const geo = new THREE.PlaneGeometry(w, h);
      if (pivotY === 'top') {
        geo.translate(0, -h / 2, 0); // Вращение вокруг верхнего сустава
      } else if (pivotY === 'bottom') {
        geo.translate(0, h / 2, 0);
      }
      return new THREE.Mesh(geo, mat);
    };

    // ==========================================
    // 7. СБОРКА РЫЦАРЯ 1 В 1 ПО РЕФЕРЕНСУ (КРУПНЫЙ)
    // ==========================================
    const units: Unit[] = [];
    const WARRIOR_TOTAL_H = 114; // Значительно увеличенный размер
    const characterFloorY = -viewHeight / 2 + 55;

    const createWarrior = (spawnX: number) => {
      const root = new THREE.Group();
      root.position.set(spawnX, characterFloorY, 5);
      root.scale.set(1, 1, 1); // Лицом вправо (на врага!)

      // 1. ТОРС (компактный, как на арте)
      const torsoH = WARRIOR_TOTAL_H * 0.38; // ~43px
      const torsoW = torsoH * 0.85; // ~36px
      const torso = createPivotMesh(torsoW, torsoH, warriorMats.torso, 'center');
      torso.position.set(0, WARRIOR_TOTAL_H * 0.38, 0);
      root.add(torso);

      // 2. ГОЛОВА / ШЛЕМ (ОГРОМНЫЙ CHIBI, ~50% ВСЕГО РОСТА)
      const headH = WARRIOR_TOTAL_H * 0.52; // ~60px
      const headW = headH * 0.92; // ~55px
      const head = createPivotMesh(headW, headH, warriorMats.head, 'bottom');
      // Шлем глубоко нависает над кирасой, как на арте-референсе
      head.position.set(2, torsoH * 0.05, 0.05);
      torso.add(head);

      // 3. НОГИ (короткие массивные латы)
      const legH = WARRIOR_TOTAL_H * 0.33; // ~38px
      const legW = legH * 0.52;

      // Задняя нога (темная, в тени сзади)
      const backLegPivot = new THREE.Group();
      backLegPivot.position.set(-torsoW * 0.16, WARRIOR_TOTAL_H * 0.28, -0.03);
      const backLegMesh = createPivotMesh(legW, legH, warriorMats.legBack, 'top');
      backLegPivot.add(backLegMesh);
      root.add(backLegPivot);

      // Передняя нога (светлая, спереди)
      const frontLegPivot = new THREE.Group();
      frontLegPivot.position.set(torsoW * 0.16, WARRIOR_TOTAL_H * 0.28, 0.03);
      const frontLegMesh = createPivotMesh(legW, legH, warriorMats.legFront, 'top');
      frontLegPivot.add(frontLegMesh);
      root.add(frontLegPivot);

      // 4. РУКИ И МЕЧ
      const armH = WARRIOR_TOTAL_H * 0.36; // ~41px
      const armW = armH * 0.55;

      // Задняя рука (в тени)
      const backArmPivot = new THREE.Group();
      backArmPivot.position.set(-torsoW * 0.32, torsoH * 0.25, -0.04);
      const backArmMesh = createPivotMesh(armW, armH, warriorMats.armBack, 'top');
      backArmPivot.add(backArmMesh);
      torso.add(backArmPivot);

      // Передняя рука с мечом
      const frontArmPivot = new THREE.Group();
      frontArmPivot.position.set(torsoW * 0.28, torsoH * 0.25, 0.06);
      const frontArmMesh = createPivotMesh(armW, armH, warriorMats.armFront, 'top');
      frontArmPivot.add(frontArmMesh);

      // Меч в кулаке
      const swordH = WARRIOR_TOTAL_H * 0.54;
      const swordW = swordH * 0.3;
      const sword = createPivotMesh(swordW, swordH, warriorMats.sword, 'bottom');
      sword.position.set(armW * 0.3, -armH * 0.85, 0.02);
      sword.rotation.z = -Math.PI / 5;
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
        speed: 1.25,
        walkTimer: 0
      });
    };

    // Спавн слева из нашей базы
    spawnWarriorRef.current = () => {
      createWarrior(-WORLD_TOTAL_WIDTH / 2 + 130);
    };

    // ==========================================
    // 8. СВАЙПЫ КАМЕРЫ (СТАРТ СЛЕВА У НАШЕЙ БАЗЫ)
    // ==========================================
    const halfWorld = WORLD_TOTAL_WIDTH / 2;
    const minCamX = -halfWorld + viewWidth / 2; // Левый предел (наша башня)
    const maxCamX = halfWorld - viewWidth / 2;  // Правый предел (башня врага)

    const startCamX = minCamX; // Стартуем СЛЕВА
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
    // 9. АНИМАЦИОННЫЙ ЦИКЛ (ЛОГИКА КОМАНД СТИКВАРА)
    // ==========================================
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      camera.position.x += (targetX - camera.position.x) * 0.12;

      const curCmd = commandRef.current;
      const stagingX = -WORLD_TOTAL_WIDTH / 2 + 550; // Зона сбора у базы
      const retreatX = -WORLD_TOTAL_WIDTH / 2 + 150; // Отступление за башню
      const enemyBaseX = WORLD_TOTAL_WIDTH / 2 - 150;

      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        let isMoving = false;

        if (curCmd === 'attack') {
          // Идем направо к замку врага
          if (u.group.position.x < enemyBaseX) {
            u.group.position.x += u.speed;
            u.group.scale.x = 1; // Смотрим вправо
            isMoving = true;
          }
        } else if (curCmd === 'defend') {
          // Идем в зону сбора и держим оборону
          const dist = stagingX - u.group.position.x;
          if (Math.abs(dist) > 10) {
            u.group.position.x += Math.sign(dist) * u.speed;
            u.group.scale.x = Math.sign(dist);
            isMoving = true;
          } else {
            u.group.scale.x = 1; // Стоим лицом к врагу
          }
        } else if (curCmd === 'retreat') {
          // Бежим назад к башне
          if (u.group.position.x > retreatX) {
            u.group.position.x -= u.speed * 1.3;
            u.group.scale.x = -1; // Смотрим влево (бежим назад)
            isMoving = true;
          }
        }

        // Анимация шага или стойки
        if (isMoving) {
          u.walkTimer += delta * 7.5;
          const swing = Math.sin(u.walkTimer);

          u.parts.frontLeg.rotation.z = swing * 0.55;
          u.parts.backLeg.rotation.z = -swing * 0.55;
          u.parts.frontArm.rotation.z = -swing * 0.45;
          u.parts.backArm.rotation.z = swing * 0.45;

          u.parts.torso.position.y = WARRIOR_TOTAL_H * 0.38 + Math.abs(swing) * 2;
          u.parts.head.rotation.z = Math.sin(u.walkTimer * 0.5) * 0.06;
          u.parts.sword.rotation.z = -Math.PI / 5 + swing * 0.12;
        } else {
          // Плавное дыхание в боевой стойке (Idle)
          const breathe = Math.sin(now * 0.003 + i);
          u.parts.frontLeg.rotation.z = 0.05;
          u.parts.backLeg.rotation.z = -0.05;
          u.parts.frontArm.rotation.z = -0.1 + breathe * 0.04;
          u.parts.backArm.rotation.z = 0.1 - breathe * 0.04;
          u.parts.torso.position.y = WARRIOR_TOTAL_H * 0.38 + breathe * 1;
          u.parts.head.rotation.z = breathe * 0.03;
          u.parts.sword.rotation.z = -Math.PI / 5 + breathe * 0.05;
        }
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

  const handleBuyWarrior = () => {
    if (spawnCd > 0) return; // Кулдаун активен
    setSpawnCd(8.0); // Запуск кулдауна 8 секунд
  };

  return (
    <div style={styles.stageContainer}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {/* ==========================================
          ВЕРХНИЙ HUD: ЗОЛОТО И КАРТОЧКИ ЮНИТОВ
          ========================================== */}
      <div style={styles.topHud}>
        <div className="hud-element" style={styles.goldCounter}>
          <span style={styles.coinIcon}>🪙</span>
          <span style={styles.goldAmount}>{gold}</span>
        </div>

        <div style={styles.summonRow}>
          {/* 1. WARRIOR С КУЛДАУНОМ 8 СЕКУНД */}
          <button
            className="hud-element"
            onClick={handleBuyWarrior}
            disabled={spawnCd > 0}
            style={{
              ...styles.unitCard,
              filter: spawnCd > 0 ? 'grayscale(0.6)' : 'none'
            }}
          >
            {/* Картинка из public/Warrior.png или запасная иконка */}
            <img
              src="/Warrior.png"
              alt="Warrior"
              style={styles.unitImg}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span style={styles.unitName}>WARRIOR</span>
            <span style={styles.unitCost}>{spawnCd > 0 ? `${spawnCd}s` : '0 🪙'}</span>

            {/* Круговой/высотный прогресс-бар кулдауна */}
            {spawnCd > 0 && (
              <div
                style={{
                  ...styles.cdOverlay,
                  height: `${(spawnCd / 8) * 100}%`
                }}
              />
            )}
          </button>

          {/* 2. ARCHER */}
          <button className="hud-element" style={{ ...styles.unitCard, ...styles.unitDisabled }}>
            <img
              src="/Archer.png"
              alt="Archer"
              style={styles.unitImg}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span style={styles.unitName}>ARCHER</span>
            <span style={styles.unitCost}>0 🪙</span>
          </button>

          {/* 3. KNIGHT */}
          <button className="hud-element" style={{ ...styles.unitCard, ...styles.unitDisabled }}>
            <img
              src="/Knight.png"
              alt="Knight"
              style={styles.unitImg}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span style={styles.unitName}>KNIGHT</span>
            <span style={styles.unitCost}>0 🪙</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          КОМАНДНЫЙ ПОЛУКРУГ STICK WAR (СПРАВА)
          ========================================== */}
      <div style={styles.commandCircleWrapper}>
        <div style={styles.commandArc}>
          {/* ВЕРХ: ОТСТУПЛЕНИЕ */}
          <button
            className="hud-element"
            onClick={() => setCommand('retreat')}
            style={{
              ...styles.arcBtn,
              backgroundColor: command === 'retreat' ? '#c62828' : 'rgba(25, 25, 25, 0.85)',
              borderColor: command === 'retreat' ? '#ffffff' : '#555555',
              transform: command === 'retreat' ? 'scale(1.1) translateX(-6px)' : 'none'
            }}
          >
            <Flag size={20} color="#ffffff" />
            <span style={styles.arcBtnLabel}>RETREAT</span>
          </button>

          {/* ЦЕНТР: ЗАЩИТА */}
          <button
            className="hud-element"
            onClick={() => setCommand('defend')}
            style={{
              ...styles.arcBtn,
              backgroundColor: command === 'defend' ? '#1565c0' : 'rgba(25, 25, 25, 0.85)',
              borderColor: command === 'defend' ? '#ffffff' : '#555555',
              transform: command === 'defend' ? 'scale(1.1) translateX(-8px)' : 'none'
            }}
          >
            <Shield size={20} color="#ffffff" />
            <span style={styles.arcBtnLabel}>DEFEND</span>
          </button>

          {/* НИЗ: АТАКА */}
          <button
            className="hud-element"
            onClick={() => setCommand('attack')}
            style={{
              ...styles.arcBtn,
              backgroundColor: command === 'attack' ? '#2e7d32' : 'rgba(25, 25, 25, 0.85)',
              borderColor: command === 'attack' ? '#ffffff' : '#555555',
              transform: command === 'attack' ? 'scale(1.1) translateX(-6px)' : 'none'
            }}
          >
            <Swords size={20} color="#ffffff" />
            <span style={styles.arcBtnLabel}>ATTACK</span>
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
  topHud: {
    position: 'absolute',
    top: '14px',
    left: '110px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  goldCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
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
    position: 'relative',
    width: '74px',
    height: '74px',
    backgroundColor: 'rgba(26, 12, 14, 0.85)',
    border: '2px solid #8e2424',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    overflow: 'hidden',
    padding: 0
  },
  unitDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    borderColor: '#444444',
    backgroundColor: 'rgba(30, 30, 30, 0.7)'
  },
  unitImg: {
    width: '36px',
    height: '36px',
    objectFit: 'contain'
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
  },
  cdOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    pointerEvents: 'none',
    transition: 'height 0.05s linear'
  },
  // ПОЛУКРУГ STICK WAR СПРАВА
  commandCircleWrapper: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center'
  },
  commandArc: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'flex-end'
  },
  arcBtn: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '2.5px solid #555555',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    touchAction: 'manipulation',
    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
    transition: 'all 0.15s ease-out'
  },
  arcBtnLabel: {
    color: '#ffffff',
    fontSize: '8px',
    fontWeight: 900,
    letterSpacing: '0.5px'
  }
};
