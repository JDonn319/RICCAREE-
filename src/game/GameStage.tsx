import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Swords, Shield, Castle } from 'lucide-react';

const WORLD_TOTAL_WIDTH = 2105;
const PART_WIDTH = WORLD_TOTAL_WIDTH / 3;

type ArmyCommand = 'retreat' | 'defend' | 'attack';

interface StickmanLimbs {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Mesh;
  eye?: THREE.Mesh;
  spine: THREE.Mesh;
  armL: THREE.Group;
  forearmL: THREE.Mesh;
  armR: THREE.Group;
  forearmR: THREE.Mesh;
  sword: THREE.Mesh;
  legL: THREE.Group;
  shinL: THREE.Mesh;
  legR: THREE.Group;
  shinR: THREE.Mesh;
}

interface UnitInstance {
  id: number;
  isEnemy: boolean;
  limbs: StickmanLimbs;
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

  // Ресурсы и команды Stick War
  const [gold] = useState(950);
  const [pop, setPop] = useState(0);
  const [command, setCommand] = useState<ArmyCommand>('defend');
  const [trainQueue, setTrainQueue] = useState<number>(0);
  const [trainProgress, setTrainProgress] = useState<number>(0);

  const spawnUnitRef = useRef<(isEnemy: boolean) => void>(() => {});
  const commandRef = useRef<ArmyCommand>('defend');

  useEffect(() => { commandRef.current = command; }, [command]);

  // Очередь найма юнитов
  useEffect(() => {
    if (trainQueue <= 0) {
      setTrainProgress(0);
      return;
    }

    const duration = 5000; // 5 сек на тренировку стикмена
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setTrainProgress((prev) => {
        if (prev + step >= 100) {
          spawnUnitRef.current(false);
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();

    // ==========================================
    // 4. ПАНОРАМА ФОНА (2105 PX)
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
    // 5. БАШНИ (НАША СЛЕВА, ВРАГ СПРАВА)
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

    // Башня врага (СПРАВА)
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
    // 6. ВЕКТОРНЫЙ КОНСТРУКТОР СТИКМЕНОВ STICK WAR
    // ==========================================
    const allUnits: UnitInstance[] = [];
    const baseFloorY = -viewHeight / 2 + 35;
    let unitIdCounter = 0;

    // Материалы фигурок
    const stickMatAlly = new THREE.MeshBasicMaterial({ color: '#111111' });
    const stickMatEnemy = new THREE.MeshBasicMaterial({ color: '#1a1010' });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ff1744' }); // Алые глаза врагов
    const swordMat = new THREE.MeshBasicMaterial({ color: '#cfd8dc' });
    const hiltMat = new THREE.MeshBasicMaterial({ color: '#795548' });

    // Построение сегмента конечности (линия со скруглением)
    const createLimbSegment = (length: number, thickness: number, mat: THREE.Material) => {
      const geo = new THREE.PlaneGeometry(thickness, length);
      geo.translate(0, -length / 2, 0); // Пивот в суставе
      return new THREE.Mesh(geo, mat);
    };

    const buildStickman = (isEnemy: boolean, rankIndex: number, spawnX: number) => {
      const root = new THREE.Group();
      const mat = isEnemy ? stickMatEnemy : stickMatAlly;

      // Шеренги по 4 в ряду с перспективой
      const row = rankIndex % 4;
      const rankCol = Math.floor(rankIndex / 4);
      const depthScale = 1.0 - row * 0.06;
      const rowOffsetY = row * 10;
      const depthZ = 5 - row * 0.1;

      root.position.set(spawnX, baseFloorY + rowOffsetY, depthZ);
      root.scale.set(isEnemy ? -depthScale : depthScale, depthScale, 1);

      // Группа туловища для наклонов при беге
      const bodyGroup = new THREE.Group();
      bodyGroup.position.set(0, 42, 0);
      root.add(bodyGroup);

      // 1. Позвоночник / Тело
      const spine = createLimbSegment(32, 5.5, mat);
      bodyGroup.add(spine);

      // 2. Голова (идеальный круг Stick War)
      const headGeo = new THREE.CircleGeometry(11, 24);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.set(0, 11, 0.05);
      bodyGroup.add(head);

      // Алый глаз для врагов
      let eyeMesh: THREE.Mesh | undefined;
      if (isEnemy) {
        const eyeGeo = new THREE.CircleGeometry(2.5, 12);
        eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(4, 2, 0.06);
        head.add(eyeMesh);
      }

      // 3. Руки (Плечо ➔ Локоть ➔ Меч)
      // Левая рука (задняя)
      const armL = new THREE.Group();
      armL.position.set(0, 0, -0.05);
      const upperArmL = createLimbSegment(16, 4.5, mat);
      armL.add(upperArmL);
      const forearmL = createLimbSegment(16, 4, mat);
      forearmL.position.set(0, -16, 0);
      armL.add(forearmL);
      bodyGroup.add(armL);

      // Правая рука (передняя с клинком)
      const armR = new THREE.Group();
      armR.position.set(0, 0, 0.05);
      const upperArmR = createLimbSegment(16, 4.5, mat);
      armR.add(upperArmR);
      const forearmR = createLimbSegment(16, 4, mat);
      forearmR.position.set(0, -16, 0);
      armR.add(forearmR);

      // Меч в руке (Swordwrath Blade)
      const swordGroup = new THREE.Group();
      swordGroup.position.set(0, -16, 0.02);
      const bladeGeo = new THREE.PlaneGeometry(5.5, 36);
      bladeGeo.translate(0, 18, 0);
      const blade = new THREE.Mesh(bladeGeo, swordMat);
      const hiltGeo = new THREE.PlaneGeometry(12, 3.5);
      const hilt = new THREE.Mesh(hiltGeo, hiltMat);
      swordGroup.add(blade);
      swordGroup.add(hilt);
      swordGroup.rotation.z = Math.PI / 4;
      forearmR.add(swordGroup);

      bodyGroup.add(armR);

      // 4. Ноги (Бедро ➔ Колено/Голень)
      // Левая нога (задняя)
      const legL = new THREE.Group();
      legL.position.set(0, 22, -0.05);
      const thighL = createLimbSegment(20, 5, mat);
      legL.add(thighL);
      const shinL = createLimbSegment(22, 4.5, mat);
      shinL.position.set(0, -20, 0);
      legL.add(shinL);
      root.add(legL);

      // Правая нога (передняя)
      const legR = new THREE.Group();
      legR.position.set(0, 22, 0.05);
      const thighR = createLimbSegment(20, 5, mat);
      legR.add(thighR);
      const shinR = createLimbSegment(22, 4.5, mat);
      shinR.position.set(0, -20, 0);
      legR.add(shinR);
      root.add(legR);

      // Полоска HP
      const hpBarGeo = new THREE.PlaneGeometry(28, 4);
      const hpBarMat = new THREE.MeshBasicMaterial({ color: isEnemy ? '#e53935' : '#43a047' });
      const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
      hpBar.position.set(0, 75, 0.2);
      root.add(hpBar);

      scene.add(root);

      const unit: UnitInstance = {
        id: ++unitIdCounter,
        isEnemy,
        limbs: {
          root,
          bodyGroup,
          head,
          eye: eyeMesh,
          spine,
          armL,
          forearmL,
          armR,
          forearmR,
          sword: swordGroup as unknown as THREE.Mesh,
          legL,
          shinL,
          legR,
          shinR
        },
        row,
        rankCol,
        hp: 100,
        maxHp: 100,
        speed: 1.5,
        state: 'walk',
        attackTimer: 0,
        walkTimer: 0,
        hpBar
      };

      allUnits.push(unit);
      return unit;
    };

    // Спавн слева за экраном
    spawnUnitRef.current = (isEnemy: boolean) => {
      const alliesCount = allUnits.filter((u) => !u.isEnemy).length;
      const enemiesCount = allUnits.filter((u) => u.isEnemy).length;
      const rankIdx = isEnemy ? enemiesCount : alliesCount;

      const spawnX = isEnemy
        ? WORLD_TOTAL_WIDTH / 2 + 100
        : -WORLD_TOTAL_WIDTH / 2 - 120;

      buildStickman(isEnemy, rankIdx, spawnX);
    };

    // Спавн врагов для теста битвы
    const enemyTimer = setInterval(() => {
      if (allUnits.filter((u) => u.isEnemy && u.state !== 'dead').length < 8) {
        spawnUnitRef.current(true);
      }
    }, 8500);

    // ==========================================
    // 7. СВАЙПЫ КАМЕРЫ
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
    // 8. ЦИКЛ АНИМАЦИИ И ФИЗИКИ СТИКМЕНОВ
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

        const opponentList = u.isEnemy ? allies : enemies;
        let nearestTarget: UnitInstance | null = null;
        let minDist = 99999;

        for (const opp of opponentList) {
          const d = Math.abs(opp.limbs.root.position.x - u.limbs.root.position.x);
          if (d < minDist) {
            minDist = d;
            nearestTarget = opp;
          }
        }

        const ATTACK_RANGE = 58;

        // 1. Поведение ИИ и команд
        if (nearestTarget && minDist <= ATTACK_RANGE) {
          if (u.state !== 'attack1' && u.state !== 'attack2') {
            u.state = Math.random() > 0.5 ? 'attack1' : 'attack2';
            u.attackTimer = 0;
          }
        } else {
          if (u.isEnemy) {
            u.limbs.root.position.x -= u.speed;
            u.state = 'walk';
          } else {
            if (curCmd === 'attack') {
              u.limbs.root.position.x += u.speed;
              u.state = 'walk';
            } else if (curCmd === 'defend') {
              const targetSlotX = -WORLD_TOTAL_WIDTH / 2 + 500 + u.rankCol * 48;
              const diff = targetSlotX - u.limbs.root.position.x;
              if (Math.abs(diff) > 8) {
                u.limbs.root.position.x += Math.sign(diff) * u.speed;
                u.state = 'walk';
              } else {
                u.state = 'idle';
              }
            } else if (curCmd === 'retreat') {
              const castleDoorX = -WORLD_TOTAL_WIDTH / 2 + 100;
              if (u.limbs.root.position.x > castleDoorX) {
                u.limbs.root.position.x -= u.speed * 1.4;
                u.state = 'walk';
              } else {
                u.state = 'idle';
              }
            }
          }
        }

        // ==========================================
        // 2. ВЕКТОРНАЯ АНИМАЦИЯ СУСТАВОВ
        // ==========================================
        const limbs = u.limbs;

        if (u.state === 'walk') {
          // Бег Stick War: наклон тела вперед, энергичные шаги
          u.walkTimer += delta * 9;
          const cycle = u.walkTimer;
          const swing = Math.sin(cycle);

          limbs.bodyGroup.rotation.z = 0.22; // Наклон корпуса вперед
          limbs.head.rotation.z = -0.1;

          // Размах бедер
          limbs.legL.rotation.z = swing * 0.75;
          limbs.legR.rotation.z = -swing * 0.75;

          // Сгиб коленей (реалистичный бег)
          limbs.shinL.rotation.z = swing > 0 ? swing * 0.9 : 0;
          limbs.shinR.rotation.z = swing < 0 ? -swing * 0.9 : 0;

          // Движение рук
          limbs.armL.rotation.z = -swing * 0.7;
          limbs.forearmL.rotation.z = -0.4;
          limbs.armR.rotation.z = swing * 0.7 - 0.4;
          limbs.forearmR.rotation.z = -0.3;

        } else if (u.state === 'idle') {
          // Боевая стойка: легкое пружинящее дыхание
          const breathe = Math.sin(now * 0.004 + u.id);

          limbs.bodyGroup.rotation.z = 0.05;
          limbs.head.rotation.z = breathe * 0.03;

          limbs.legL.rotation.z = 0.2;
          limbs.shinL.rotation.z = -0.2;
          limbs.legR.rotation.z = -0.2;
          limbs.shinR.rotation.z = 0.2;

          limbs.armL.rotation.z = 0.3 + breathe * 0.05;
          limbs.forearmL.rotation.z = -0.5;
          limbs.armR.rotation.z = -0.4 + breathe * 0.05;
          limbs.forearmR.rotation.z = -0.6;

        } else if (u.state === 'attack1') {
          // АТАКА 1: Сокрушительный рубящий замах сверху
          u.attackTimer += delta * 4;
          const t = u.attackTimer;

          if (t < 0.35) {
            // Замах обеими руками назад-вверх
            limbs.bodyGroup.rotation.z = -0.25;
            limbs.armR.rotation.z = -2.1;
            limbs.forearmR.rotation.z = -0.8;
            limbs.armL.rotation.z = -1.8;
            limbs.legR.rotation.z = -0.4;
            limbs.shinR.rotation.z = 0.6;
          } else if (t < 0.7) {
            // Резкий мощный удар вниз
            limbs.bodyGroup.rotation.z = 0.35;
            limbs.armR.rotation.z = 1.1;
            limbs.forearmR.rotation.z = 0.2;
            limbs.armL.rotation.z = 0.8;
            limbs.legR.rotation.z = 0.4;
            limbs.shinR.rotation.z = 0.1;

            if (nearestTarget && t < 0.45) {
              nearestTarget.hp -= 0.7;
              nearestTarget.hpBar.scale.x = Math.max(0, nearestTarget.hp / nearestTarget.maxHp);
            }
          } else {
            u.state = 'idle';
          }

        } else if (u.state === 'attack2') {
          // АТАКА 2: Быстрый колющий выпад вперед
          u.attackTimer += delta * 5;
          const t = u.attackTimer;

          if (t < 0.3) {
            // Оттяжка корпуса назад
            limbs.bodyGroup.rotation.z = -0.15;
            limbs.armR.rotation.z = -0.8;
            limbs.forearmR.rotation.z = -1.2;
          } else if (t < 0.65) {
            // Выпад мечом прямо вперед
            limbs.bodyGroup.rotation.z = 0.4;
            limbs.armR.rotation.z = 1.45;
            limbs.forearmR.rotation.z = 0.05;
            limbs.legR.rotation.z = 0.6;
            limbs.shinR.rotation.z = -0.4;

            if (nearestTarget && t < 0.4) {
              nearestTarget.hp -= 0.85;
              nearestTarget.hpBar.scale.x = Math.max(0, nearestTarget.hp / nearestTarget.maxHp);
            }
          } else {
            u.state = 'idle';
          }
        }

        // Гибель воина
        if (u.hp <= 0) {
          u.state = 'dead';
          scene.remove(u.limbs.root);
          if (!u.isEnemy) setPop((p) => Math.max(0, p - 1));
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(enemyTimer);
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

      {/* ==========================================
          ВЕРХНИЙ ХУД STICK WAR: ЗОЛОТО + ЮНИТЫ
          ========================================== */}
      <div style={styles.topHud}>
        {/* Панель ресурсов */}
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

        {/* Круглые иконки юнитов */}
        <div style={styles.summonRow}>
          {/* 1. WARRIOR */}
          <button
            className="hud-element"
            onClick={() => setTrainQueue((q) => q + 1)}
            style={styles.stickWarCard}
          >
            <img
              src="/Warrior.png"
              alt="Warrior"
              style={styles.cardImg}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span style={styles.cardCost}>125</span>

            {/* Прогресс тренировки */}
            {trainQueue > 0 && (
              <div
                style={{
                  ...styles.trainFill,
                  height: `${trainProgress}%`
                }}
              />
            )}

            {/* Счетчик очереди (x2, x3...) */}
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
          КОМАНДНЫЙ ПОЛУКРУГ STICK WAR (СПРАВА)
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
  }
};
