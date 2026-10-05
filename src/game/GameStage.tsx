import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Swords, Shield, Castle } from 'lucide-react';

const WORLD_TOTAL_WIDTH = 2105;
const PART_WIDTH = WORLD_TOTAL_WIDTH / 3;

type ArmyCommand = 'retreat' | 'defend' | 'attack';

interface BoneTransform {
  x: number;
  y: number;
  size: number;
}

interface RigConfig {
  head: BoneTransform;
  torso: BoneTransform;
  armFront: BoneTransform;
  armBack: BoneTransform;
  legFront: BoneTransform;
  legBack: BoneTransform;
  sword: BoneTransform & { rot: number };
}

// Начальная калибровка под референс chibi-рыцаря
const DEFAULT_RIG: RigConfig = {
  torso: { x: 0, y: 38, size: 66 },
  head: { x: 2, y: 44, size: 90 }, // Огромный шлем
  armFront: { x: 0, y: 52, size: 62 },
  armBack: { x: 0, y: 52, size: 62 },
  legFront: { x: 0, y: 28, size: 60 },
  legBack: { x: 0, y: 28, size: 60 },
  sword: { x: 14, y: -26, size: 85, rot: -36 }
};

interface UnitInstance {
  id: number;
  isEnemy: boolean;
  group: THREE.Group;
  parts: {
    torso: THREE.Mesh;
    head: THREE.Mesh;
    armF: THREE.Group;
    armB: THREE.Group;
    legF: THREE.Group;
    legB: THREE.Group;
    sword: THREE.Mesh;
  };
  row: number;
  rankCol: number;
  hp: number;
  maxHp: number;
  speed: number;
  state: 'walk' | 'idle' | 'attack1' | 'attack2' | 'dead';
  attackTimer: number;
  walkTimer: number;
  hpBar: THREE.Mesh;
}

export const GameStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Состояние экономики и очереди Stick War
  const [gold] = useState(950);
  const [pop, setPop] = useState(0);
  const [command, setCommand] = useState<ArmyCommand>('defend');
  const [trainQueue, setTrainQueue] = useState<number>(0);
  const [trainProgress, setTrainProgress] = useState<number>(0);

  // Редактор рига
  const [showEditor, setShowEditor] = useState(false);
  const [rig, setRig] = useState<RigConfig>(DEFAULT_RIG);
  const [copySuccess, setCopySuccess] = useState(false);

  const spawnUnitRef = useRef<(isEnemy: boolean) => void>(() => {});
  const commandRef = useRef<ArmyCommand>('defend');
  const rigRef = useRef<RigConfig>(DEFAULT_RIG);

  useEffect(() => { commandRef.current = command; }, [command]);
  useEffect(() => { rigRef.current = rig; }, [rig]);

  // Обработка очереди обучения юнитов (по одному)
  useEffect(() => {
    if (trainQueue <= 0) {
      setTrainProgress(0);
      return;
    }

    const duration = 6000; // 6 секунд на воина
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setTrainProgress((prev) => {
        if (prev + step >= 100) {
          spawnUnitRef.current(false); // Спавним нашего рыцаря
          setTrainQueue((q) => Math.max(0, q - 1));
          setPop((p) => p + 1);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [trainQueue]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Сцена
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101010');

    // 2. Ортографическая камера
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
    // 4. ПАНОРАМА 2105 PX
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
    // 5. БАШНИ
    // ==========================================
    const towerHeight = viewHeight * 0.85;
    const defaultTowerWidth = towerHeight * 0.55;
    const groundLevelY = -viewHeight / 2 + towerHeight / 2 - 10;

    // Наша башня (СЛЕВА)
    const playerTowerGeo = new THREE.PlaneGeometry(defaultTowerWidth, towerHeight);
    const playerTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const playerTower = new THREE.Mesh(playerTowerGeo, playerTowerMat);
    playerTower.position.set(-WORLD_TOTAL_WIDTH / 2 + defaultTowerWidth / 2 + 25, groundLevelY, 2);
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
        playerTower.position.x = -WORLD_TOTAL_WIDTH / 2 + realW / 2 + 25;
      }
    });

    // Вражеская башня (СПРАВА)
    const enemyTowerGeo = new THREE.PlaneGeometry(defaultTowerWidth, towerHeight);
    const enemyTowerMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 });
    const enemyTower = new THREE.Mesh(enemyTowerGeo, enemyTowerMat);
    enemyTower.position.set(WORLD_TOTAL_WIDTH / 2 - defaultTowerWidth / 2 - 25, groundLevelY, 2);
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
        enemyTower.position.x = WORLD_TOTAL_WIDTH / 2 - realW / 2 - 25;
      }
    });

    // ==========================================
    // 6. ЗАГРУЗКА ЧАСТЕЙ ТЕЛА С КВАДРАТНЫМИ ХИТБОКСАМИ
    // ==========================================
    const createSquareFallback = (color: string, isBack = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = isBack ? '#2c313a' : color;
      ctx.fillRect(4, 4, 56, 56);
      ctx.strokeStyle = '#121417';
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 56, 56);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      return tex;
    };

    const loadPiece = (names: string[], fallbackColor: string, isBack = false) => {
      const fallback = createSquareFallback(fallbackColor, isBack);
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

    const mats = {
      head: loadPiece(['Whead', 'WHead'], '#5a6273'),
      torso: loadPiece(['WTorso'], '#505666'),
      armFront: loadPiece(['WArm1'], '#505666'),
      armBack: loadPiece(['WArm2'], '#30343d', true),
      legFront: loadPiece(['WLeg1'], '#464c59'),
      legBack: loadPiece(['WLeg2'], '#2b2f38', true),
      sword: loadPiece(['WSword'], '#d6dadf')
    };

    // Создание 1:1 КВАДРАТНОЙ плоскости с точной точкой крепления кости
    const createSquareBone = (size: number, mat: THREE.Material, anchor: 'top' | 'bottom' | 'center') => {
      const geo = new THREE.PlaneGeometry(size, size);
      if (anchor === 'top') {
        // Кость крепится за самый верх квадрата (руки и ноги)
        geo.translate(0, -size / 2, 0);
      } else if (anchor === 'bottom') {
        // Кость крепится за самый низ квадрата (голова)
        geo.translate(0, size / 2, 0);
      }
      return new THREE.Mesh(geo, mat);
    };

    // ==========================================
    // 7. СБОРКА РЫЦАРЯ И ШЕРЕНГИ ПО 4 В РЯДУ
    // ==========================================
    const allUnits: UnitInstance[] = [];
    const baseFloorY = -viewHeight / 2 + 35;
    let unitIdCounter = 0;

    const buildRiggedKnight = (isEnemy: boolean, rankIndex: number, spawnX: number) => {
      const cfg = rigRef.current;
      const root = new THREE.Group();

      // Шеренга из 4 рядов:
      // Ряд 0 (передний): крупный (scale = 1.0), внизу
      // Ряд 3 (задний): меньше (scale = 0.82), стоит выше по Y
      const row = rankIndex % 4;
      const rankCol = Math.floor(rankIndex / 4);
      const depthScale = 1.0 - row * 0.06; // Уменьшение вдаль
      const rowOffsetY = row * 11; // Смещение рядов по высоте
      const depthZ = 5 - row * 0.1; // Слои глубины

      root.position.set(spawnX, baseFloorY + rowOffsetY, depthZ);
      root.scale.set(isEnemy ? -depthScale : depthScale, depthScale, 1);

      // 1. ТОРС (центр)
      const torso = createSquareBone(cfg.torso.size, mats.torso, 'center');
      torso.position.set(cfg.torso.x, cfg.torso.y, 0);
      root.add(torso);

      // 2. ГОЛОВА (крепится за самый низ квадрата)
      const head = createSquareBone(cfg.head.size, mats.head, 'bottom');
      head.position.set(cfg.head.x, cfg.head.y, 0.05);
      torso.add(head);

      // 3. НОГИ (крепятся за самый верх квадрата в одной центральной точке)
      const backLegPivot = new THREE.Group();
      backLegPivot.position.set(cfg.legBack.x, cfg.legBack.y, -0.03);
      const backLegMesh = createSquareBone(cfg.legBack.size, mats.legBack, 'top');
      backLegPivot.add(backLegMesh);
      root.add(backLegPivot);

      const frontLegPivot = new THREE.Group();
      frontLegPivot.position.set(cfg.legFront.x, cfg.legFront.y, 0.03);
      const frontLegMesh = createSquareBone(cfg.legFront.size, mats.legFront, 'top');
      frontLegPivot.add(frontLegMesh);
      root.add(frontLegPivot);

      // 4. РУКИ (крепятся за самый верх квадрата в одной центральной точке плеча)
      const backArmPivot = new THREE.Group();
      backArmPivot.position.set(cfg.armBack.x, cfg.armBack.y, -0.04);
      const backArmMesh = createSquareBone(cfg.armBack.size, mats.armBack, 'top');
      backArmPivot.add(backArmMesh);
      torso.add(backArmPivot);

      const frontArmPivot = new THREE.Group();
      frontArmPivot.position.set(cfg.armFront.x, cfg.armFront.y, 0.06);
      const frontArmMesh = createSquareBone(cfg.armFront.size, mats.armFront, 'top');
      frontArmPivot.add(frontArmMesh);

      // 5. МЕЧ (ПОД РУКОЙ, Z = -0.01)
      const sword = createSquareBone(cfg.sword.size, mats.sword, 'bottom');
      sword.position.set(cfg.sword.x, cfg.sword.y, -0.01);
      sword.rotation.z = (cfg.sword.rot * Math.PI) / 180;
      frontArmPivot.add(sword);

      torso.add(frontArmPivot);

      // Полоска HP над головой
      const hpBarGeo = new THREE.PlaneGeometry(36, 5);
      const hpBarMat = new THREE.MeshBasicMaterial({ color: isEnemy ? '#e53935' : '#43a047' });
      const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
      hpBar.position.set(0, cfg.torso.y + cfg.head.size + 15, 0.1);
      root.add(hpBar);

      scene.add(root);

      const newUnit: UnitInstance = {
        id: ++unitIdCounter,
        isEnemy,
        group: root,
        parts: {
          torso,
          head,
          armF: frontArmPivot,
          armB: backArmPivot,
          legF: frontLegPivot,
          legB: backLegPivot,
          sword
        },
        row,
        rankCol,
        hp: 120,
        maxHp: 120,
        speed: 1.3,
        state: 'walk',
        attackTimer: 0,
        walkTimer: 0,
        hpBar
      };

      allUnits.push(newUnit);
      return newUnit;
    };

    // Спавн слева далеко за экраном
    spawnUnitRef.current = (isEnemy: boolean) => {
      const alliesCount = allUnits.filter((u) => !u.isEnemy).length;
      const enemiesCount = allUnits.filter((u) => u.isEnemy).length;
      const rankIdx = isEnemy ? enemiesCount : alliesCount;

      const spawnX = isEnemy
        ? WORLD_TOTAL_WIDTH / 2 + 120 // Враги выходят справа из-за экрана
        : -WORLD_TOTAL_WIDTH / 2 - 140; // Мы выходим слева из-за экрана

      buildRiggedKnight(isEnemy, rankIdx, spawnX);
    };

    // Периодический спавн врагов для теста боя
    const enemySpawnInterval = setInterval(() => {
      if (allUnits.filter((u) => u.isEnemy).length < 8) {
        spawnUnitRef.current(true);
      }
    }, 9000);

    // ==========================================
    // 8. СВАЙПЫ КАМЕРЫ (СТАРТ СЛЕВА)
    // ==========================================
    const halfWorld = WORLD_TOTAL_WIDTH / 2;
    const minCamX = -halfWorld + viewWidth / 2;
    const maxCamX = halfWorld - viewWidth / 2;

    const startCamX = minCamX;
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
    // 9. АНИМАЦИИ: БОЙ, 2 АТАКИ, ПОХОДКА, СТОЙКА
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
      const allies = allUnits.filter((u) => !u.isEnemy && u.state !== 'dead');
      const enemies = allUnits.filter((u) => u.isEnemy && u.state !== 'dead');

      for (let i = 0; i < allUnits.length; i++) {
        const u = allUnits[i];
        if (u.state === 'dead') continue;

        // Поиск ближайшего врага
        const opponentList = u.isEnemy ? allies : enemies;
        let nearestTarget: UnitInstance | null = null;
        let minDist = 99999;

        for (const opp of opponentList) {
          const d = Math.abs(opp.group.position.x - u.group.position.x);
          if (d < minDist) {
            minDist = d;
            nearestTarget = opp;
          }
        }

        const ATTACK_RANGE = 62; // Дистанция удара мечом

        // 1. ПРОВЕРКА БОЯ: Если рядом враг — атакуем!
        if (nearestTarget && minDist <= ATTACK_RANGE) {
          if (u.state !== 'attack1' && u.state !== 'attack2') {
            // Случайный выбор между двумя типами атаки:
            u.state = Math.random() > 0.5 ? 'attack1' : 'attack2';
            u.attackTimer = 0;
          }
        } else {
          // 2. ДВИЖЕНИЕ ВНЕ БОЯ
          if (u.isEnemy) {
            // Враг всегда идет влево на штурм
            u.group.position.x -= u.speed;
            u.state = 'walk';
          } else {
            // Логика Stick War для игрока
            if (curCmd === 'attack') {
              u.group.position.x += u.speed;
              u.state = 'walk';
            } else if (curCmd === 'defend') {
              // Позиция построения шеренги у базы
              const targetSlotX = -WORLD_TOTAL_WIDTH / 2 + 500 + u.rankCol * 48;
              const diff = targetSlotX - u.group.position.x;
              if (Math.abs(diff) > 8) {
                u.group.position.x += Math.sign(diff) * u.speed;
                u.state = 'walk';
              } else {
                u.state = 'idle';
              }
            } else if (curCmd === 'retreat') {
              const castleDoorX = -WORLD_TOTAL_WIDTH / 2 + 100;
              if (u.group.position.x > castleDoorX) {
                u.group.position.x -= u.speed * 1.4;
                u.state = 'walk';
              } else {
                u.state = 'idle';
              }
            }
          }
        }

        // ==========================================
        // 3. АНИМАЦИОННЫЙ РЕНДЕР СОСТОЯНИЙ
        // ==========================================
        const baseTorsoY = rigRef.current.torso.y;
        const defaultSwordRot = (rigRef.current.sword.rot * Math.PI) / 180;

        if (u.state === 'walk') {
          u.walkTimer += delta * 7.5;
          const swing = Math.sin(u.walkTimer);

          u.parts.legF.rotation.z = swing * 0.55;
          u.parts.legB.rotation.z = -swing * 0.55;
          u.parts.armF.rotation.z = -swing * 0.45;
          u.parts.armB.rotation.z = swing * 0.45;
          u.parts.torso.position.y = baseTorsoY + Math.abs(swing) * 3;
          u.parts.sword.rotation.z = defaultSwordRot + swing * 0.12;

        } else if (u.state === 'idle') {
          const breathe = Math.sin(now * 0.003 + u.id);
          u.parts.legF.rotation.z = 0.04;
          u.parts.legB.rotation.z = -0.04;
          u.parts.armF.rotation.z = -0.1 + breathe * 0.04;
          u.parts.armB.rotation.z = 0.1 - breathe * 0.04;
          u.parts.torso.position.y = baseTorsoY + breathe * 1.5;
          u.parts.sword.rotation.z = defaultSwordRot + breathe * 0.05;

        } else if (u.state === 'attack1') {
          // АТАКА 1: РУБЯЩИЙ ЗАМАХ СВЕРХУ ВНИЗ
          u.attackTimer += delta * 4;
          const t = u.attackTimer;

          if (t < 0.4) {
            // Замах назад вверх
            u.parts.armF.rotation.z = -1.2;
            u.parts.sword.rotation.z = 0.8;
          } else if (t < 0.7) {
            // Резкий рубящий удар вниз
            u.parts.armF.rotation.z = 0.7;
            u.parts.sword.rotation.z = -1.2;
            // Урон врагу в момент соприкосновения
            if (nearestTarget && t < 0.48) {
              nearestTarget.hp -= 0.6;
              nearestTarget.hpBar.scale.x = Math.max(0, nearestTarget.hp / nearestTarget.maxHp);
            }
          } else {
            // Возврат в стойку
            u.state = 'idle';
          }

        } else if (u.state === 'attack2') {
          // АТАКА 2: КОЛЮЩИЙ ВЫПАД ВПЕРЕД
          u.attackTimer += delta * 4.5;
          const t = u.attackTimer;

          if (t < 0.3) {
            // Оттяжка назад
            u.parts.armF.rotation.z = -0.5;
            u.parts.sword.rotation.z = -0.2;
          } else if (t < 0.65) {
            // Выпад мечом прямо вперед
            u.parts.armF.rotation.z = 0.9;
            u.parts.sword.rotation.z = -1.55;
            if (nearestTarget && t < 0.4) {
              nearestTarget.hp -= 0.75;
              nearestTarget.hpBar.scale.x = Math.max(0, nearestTarget.hp / nearestTarget.maxHp);
            }
          } else {
            u.state = 'idle';
          }
        }

        // Удаление погибших
        if (u.hp <= 0 && u.state !== 'dead') {
          u.state = 'dead';
          scene.remove(u.group);
          if (!u.isEnemy) setPop((p) => Math.max(0, p - 1));
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(enemySpawnInterval);
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

  // Добавление воина в очередь обучения (Stick War)
  const handleQueueWarrior = () => {
    setTrainQueue((q) => q + 1);
  };

  // Копирование координат из Редактора в буфер обмена
  const handleCopyRig = () => {
    navigator.clipboard.writeText(JSON.stringify(rig, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div style={styles.stageContainer}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {/* ==========================================
          ВЕРХНЯЯ ПАНЕЛЬ STICK WAR: ЗОЛОТО + ЮНИТЫ + ОЧЕРЕДЬ
          ========================================== */}
      <div style={styles.topHud}>
        {/* Кнопка открытия Редактора Костей */}
        <button
          className="hud-element"
          onClick={() => setShowEditor(!showEditor)}
          style={{
            ...styles.editorToggleBtn,
            backgroundColor: showEditor ? '#e53935' : '#1e88e5'
          }}
        >
          {showEditor ? '✕ CLOSE RIG' : '🦴 RIG EDITOR'}
        </button>

        {/* Счётчик золота и лимита армии */}
        <div className="hud-element" style={styles.statPanel}>
          <div style={styles.statItem}>
            <span>🪙</span>
            <span style={styles.goldText}>{gold}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span>👥</span>
            <span style={styles.popText}>{pop}/50</span>
          </div>
        </div>

        {/* Иконки призыва юнитов с индикатором очереди */}
        <div style={styles.summonRow}>
          {/* 1. WARRIOR */}
          <button
            className="hud-element"
            onClick={handleQueueWarrior}
            style={styles.stickWarCard}
          >
            <img
              src="/Warrior.png"
              alt="Warrior"
              style={styles.cardImg}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span style={styles.cardCost}>125</span>

            {/* Круговой индикатор обучения текущего юнита */}
            {trainQueue > 0 && (
              <div
                style={{
                  ...styles.trainFill,
                  height: `${trainProgress}%`
                }}
              />
            )}

            {/* Бейдж количества юнитов в очереди (x2, x3...) */}
            {trainQueue > 0 && (
              <div style={styles.queueBadge}>
                {trainQueue}
              </div>
            )}
          </button>

          {/* 2. ARCHER */}
          <button className="hud-element" style={{ ...styles.stickWarCard, opacity: 0.5 }}>
            <img
              src="/Archer.png"
              alt="Archer"
              style={styles.cardImg}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span style={styles.cardCost}>300</span>
          </button>

          {/* 3. KNIGHT */}
          <button className="hud-element" style={{ ...styles.stickWarCard, opacity: 0.5 }}>
            <img
              src="/Knight.png"
              alt="Knight"
              style={styles.cardImg}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span style={styles.cardCost}>500</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          ПАНЕЛЬ ПРИКАЗОВ STICK WAR (СПРАВА В ПОЛУКРУГЕ)
          ========================================== */}
      <div style={styles.wheelPlate}>
        <button
          className="hud-element"
          onClick={() => setCommand('retreat')}
          style={{
            ...styles.wheelBtn,
            backgroundColor: command === 'retreat' ? '#c62828' : '#3e2723',
            borderColor: command === 'retreat' ? '#ffd54f' : '#8d6e63'
          }}
        >
          <Castle size={22} color="#ffffff" />
          <span style={styles.wheelLabel}>RETREAT</span>
        </button>

        <button
          className="hud-element"
          onClick={() => setCommand('defend')}
          style={{
            ...styles.wheelBtn,
            backgroundColor: command === 'defend' ? '#1565c0' : '#3e2723',
            borderColor: command === 'defend' ? '#ffd54f' : '#8d6e63'
          }}
        >
          <Shield size={22} color="#ffffff" />
          <span style={styles.wheelLabel}>DEFEND</span>
        </button>

        <button
          className="hud-element"
          onClick={() => setCommand('attack')}
          style={{
            ...styles.wheelBtn,
            backgroundColor: command === 'attack' ? '#2e7d32' : '#3e2723',
            borderColor: command === 'attack' ? '#ffd54f' : '#8d6e63'
          }}
        >
          <Swords size={22} color="#ffffff" />
          <span style={styles.wheelLabel}>ATTACK</span>
        </button>
      </div>

      {/* ==========================================
          ВИЗУАЛЬНЫЙ РЕДАКТОР КОСТЕЙ (RIG EDITOR)
          ========================================== */}
      {showEditor && (
        <div style={styles.editorPanel}>
          <div style={styles.editorHeader}>
            <span style={{ fontWeight: 900 }}>🦴 RIG EDITOR</span>
            <button
              onClick={handleCopyRig}
              style={styles.copyBtn}
            >
              {copySuccess ? '✓ COPIED!' : '📋 COPY CONFIG'}
            </button>
          </div>

          <div style={styles.editorScrollArea}>
            {(['head', 'torso', 'armFront', 'armBack', 'legFront', 'legBack'] as const).map((bone) => (
              <div key={bone} style={styles.editorRow}>
                <span style={styles.boneName}>{bone.toUpperCase()}</span>
                <div style={styles.sliderGroup}>
                  <label>X: {rig[bone].x}</label>
                  <input
                    type="range" min="-40" max="40" value={rig[bone].x}
                    onChange={(e) => setRig({ ...rig, [bone]: { ...rig[bone], x: +e.target.value } })}
                  />
                  <label>Y: {rig[bone].y}</label>
                  <input
                    type="range" min="0" max="80" value={rig[bone].y}
                    onChange={(e) => setRig({ ...rig, [bone]: { ...rig[bone], y: +e.target.value } })}
                  />
                  <label>S: {rig[bone].size}</label>
                  <input
                    type="range" min="30" max="130" value={rig[bone].size}
                    onChange={(e) => setRig({ ...rig, [bone]: { ...rig[bone], size: +e.target.value } })}
                  />
                </div>
              </div>
            ))}

            {/* Меч */}
            <div style={styles.editorRow}>
              <span style={styles.boneName}>SWORD</span>
              <div style={styles.sliderGroup}>
                <label>X: {rig.sword.x}</label>
                <input
                  type="range" min="-40" max="40" value={rig.sword.x}
                  onChange={(e) => setRig({ ...rig, sword: { ...rig.sword, x: +e.target.value } })}
                />
                <label>Y: {rig.sword.y}</label>
                <input
                  type="range" min="-60" max="20" value={rig.sword.y}
                  onChange={(e) => setRig({ ...rig, sword: { ...rig.sword, y: +e.target.value } })}
                />
                <label>ROT: {rig.sword.rot}°</label>
                <input
                  type="range" min="-180" max="180" value={rig.sword.rot}
                  onChange={(e) => setRig({ ...rig, sword: { ...rig.sword, rot: +e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
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
    top: '12px',
    left: '100px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  editorToggleBtn: {
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 900,
    padding: '8px 12px',
    borderRadius: '10px',
    border: '2px solid #ffffff',
    cursor: 'pointer',
    letterSpacing: '1px'
  },
  statPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#3e2723',
    border: '2.5px solid #8d6e63',
    padding: '6px 14px',
    borderRadius: '14px',
    color: '#ffffff'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: '"Rubik", "Arial Black", sans-serif',
    fontWeight: 900,
    fontSize: '14px'
  },
  statDivider: {
    width: '1.5px',
    height: '16px',
    backgroundColor: '#8d6e63'
  },
  goldText: {
    color: '#ffd54f'
  },
  popText: {
    color: '#e0e0e0'
  },
  summonRow: {
    display: 'flex',
    gap: '8px'
  },
  // Круглая золотая иконка из Stick War
  stickWarCard: {
    position: 'relative',
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    backgroundColor: '#ffb300',
    border: '3px solid #ff6f00',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    overflow: 'hidden',
    padding: 0,
    boxShadow: '0 4px 8px rgba(0,0,0,0.6)'
  },
  cardImg: {
    width: '32px',
    height: '32px',
    objectFit: 'contain'
  },
  cardCost: {
    position: 'absolute',
    bottom: '2px',
    color: '#212121',
    fontSize: '9px',
    fontWeight: 900,
    fontFamily: 'sans-serif'
  },
  trainFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    pointerEvents: 'none'
  },
  queueBadge: {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#d32f2f',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #ffffff'
  },
  // Деревянный командный полукруг Stick War (справа)
  wheelPlate: {
    position: 'absolute',
    right: '12px',
    top: '48%',
    transform: 'translateY(-50%)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'flex-end'
  },
  wheelBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '3px solid #8d6e63',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1px',
    touchAction: 'manipulation',
    boxShadow: '0 4px 10px rgba(0,0,0,0.65)',
    transition: 'all 0.15s ease-out'
  },
  wheelLabel: {
    color: '#ffffff',
    fontSize: '8px',
    fontWeight: 900,
    letterSpacing: '0.5px'
  },
  // Панель редактора костей
  editorPanel: {
    position: 'absolute',
    top: '64px',
    right: '85px',
    width: '320px',
    maxHeight: '75vh',
    backgroundColor: 'rgba(18, 18, 18, 0.94)',
    border: '2px solid #29b6f6',
    borderRadius: '12px',
    zIndex: 1000,
    padding: '12px',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
    paddingBottom: '6px'
  },
  copyBtn: {
    backgroundColor: '#00c853',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 900,
    padding: '4px 8px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer'
  },
  editorScrollArea: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '4px'
  },
  editorRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    backgroundColor: '#262626',
    padding: '6px',
    borderRadius: '6px'
  },
  boneName: {
    fontSize: '10px',
    fontWeight: 900,
    color: '#4fc3f7'
  },
  sliderGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px'
  }
};
