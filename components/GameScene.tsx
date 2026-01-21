import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, PerspectiveCamera, Grid, Float, Stars, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { GameStatus, UnitData, SPAWN_DISTANCE, PLAYER_Z, LANE_WIDTH } from '../types';

// Fix for missing R3F JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      capsuleGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshToonMaterial: any;
      pointLight: any;
      icosahedronGeometry: any;
      color: any;
      fog: any;
      ambientLight: any;
      spotLight: any;
      directionalLight: any;
    }
  }
}

// --- Assets & Constants ---
const BG_COLOR = "#1a3c34"; 
const PLAYER_BODY_COLOR = "#38bdf8";
const PLAYER_HEAD_COLOR = "#fca5a5";
const UNIT_COLOR = "#fbbf24";

interface GameSceneProps {
  status: GameStatus;
  onScore: (score: number) => void;
  onGameOver: () => void;
}

// --- Background Floating Debris (Math & Kanji) ---
const FloatingDebris = () => {
  const items = useMemo(() => {
    const symbols = ["∑", "∫", "π", "√", "sin", "cos", "x", "y", "勉", "強", "落", "単", "位"];
    return new Array(50).fill(0).map(() => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30 + 10,
        (Math.random() - 0.5) * 60 - 20
      ] as [number, number, number],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      scale: Math.random() * 1.5 + 0.5
    }));
  }, []);

  return (
    <group>
      {items.map((item, i) => (
        <Float key={i} speed={Math.random() * 2 + 1} rotationIntensity={2} floatIntensity={2}>
          <Text
            position={item.position}
            rotation={item.rotation}
            fontSize={item.scale}
            color="#ffffff"
            fillOpacity={0.1}
            anchorX="center"
            anchorY="middle"
          >
            {item.symbol}
          </Text>
        </Float>
      ))}
    </group>
  );
};

// --- Pop-up Grade Effect ---
const GradePopup = ({ position, grade }: { position: [number, number, number], grade: string }) => {
  const textRef = useRef<any>(null);
  const [active, setActive] = useState(true);

  useFrame((state, delta) => {
    if (textRef.current && active) {
      textRef.current.position.y += delta * 3;
      textRef.current.scale.x += delta * 1; // Reduced growth speed
      textRef.current.scale.y += delta * 1;
      textRef.current.material.opacity -= delta * 1.5;
      if (textRef.current.material.opacity <= 0) setActive(false);
    }
  });

  if (!active) return null;

  const color = grade === "秀" ? "#fbbf24" : grade === "優" ? "#38bdf8" : "#ffffff";

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.8} // Reduced size
      color={color}
      outlineWidth={0.05}
      outlineColor="black"
      anchorX="center"
      anchorY="middle"
    >
      {grade}
    </Text>
  );
};

// --- Player Component ---
const Player = ({ positionX, isPanic }: { positionX: number, isPanic: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, positionX, delta * 25);
      
      const velocity = groupRef.current.position.x - positionX;
      groupRef.current.rotation.z = velocity * 0.3; 
      groupRef.current.rotation.y = velocity * 0.15;
      
      // Panic vibration
      if (isPanic) {
        groupRef.current.position.x += (Math.random() - 0.5) * 0.1;
      }
      
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 20)) * 0.3;
    }
  });

  return (
    <group position={[0, 0, PLAYER_Z]} ref={groupRef}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
        <meshStandardMaterial color={PLAYER_BODY_COLOR} />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={PLAYER_HEAD_COLOR} />
      </mesh>
      {/* Glasses */}
      <mesh position={[0, 1.45, 0.3]}>
         <boxGeometry args={[0.4, 0.1, 0.05]} />
         <meshStandardMaterial color="black" />
      </mesh>
      {/* Sweat particles if panic */}
      {isPanic && (
        <Text position={[0.6, 1.8, 0]} fontSize={0.5} color="#00ffff">💦</Text>
      )}
    </group>
  );
};

// --- Unit Component ---
const Unit = ({ x, z, text }: { x: number, z: number, text: string }) => {
  return (
    <group position={[x, 0.8, z]}>
      <Float speed={15} rotationIntensity={5} floatIntensity={2}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color={UNIT_COLOR} emissive={UNIT_COLOR} emissiveIntensity={1} />
        </mesh>
        <Text
          position={[0, 0, 0.7]}
          fontSize={0.7}
          fontWeight={900}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </Float>
    </group>
  );
};

// --- Main Logic ---
const GameLogic = ({ status, onScore, onGameOver }: GameSceneProps) => {
  const { viewport, mouse, camera } = useThree();
  const [units, setUnits] = useState<(UnitData & { text: string })[]>([]);
  const [popups, setPopups] = useState<{id: number, pos: [number, number, number], grade: string}[]>([]);
  
  const scoreRef = useRef(0);
  const timeSinceLastSpawn = useRef(0);
  
  // Game State Refs
  const isPanic = useRef(false);
  const cameraShakeIntensity = useRef(0);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      setUnits([]);
      setPopups([]);
      scoreRef.current = 0;
      isPanic.current = false;
      cameraShakeIntensity.current = 0;
    }
  }, [status]);

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) {
        // Reset camera when not playing
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta * 2);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 10, delta * 2);
        return;
    }

    const score = scoreRef.current;
    
    // --- DIFFICULTY & CHAOS ---
    // Speed ramps up indefinitely
    const currentSpeed = 18 + (score * 0.4); 
    
    // Camera Shake Logic (The "Kusoge" feel)
    const shakeBase = Math.min(score * 0.005, 0.3);
    cameraShakeIntensity.current = THREE.MathUtils.lerp(cameraShakeIntensity.current, shakeBase, delta);
    camera.position.x = (Math.random() - 0.5) * cameraShakeIntensity.current;
    camera.position.y = 10 + (Math.random() - 0.5) * cameraShakeIntensity.current;

    // Panic Mode visual trigger
    isPanic.current = score > 50;

    // Spawn Logic
    // Faster spawn rate
    const spawnRateFactor = 0.08;
    const minSpawnTime = 0.1; // Crazy fast
    const dynamicSpawnTime = 0.9 / (1 + score * spawnRateFactor);
    const spawnInterval = Math.max(minSpawnTime, dynamicSpawnTime);

    // Player Input
    const targetX = Math.max(-LANE_WIDTH * 2.5, Math.min(LANE_WIDTH * 2.5, mouse.x * viewport.width * 0.5));
    
    timeSinceLastSpawn.current += delta;
    if (timeSinceLastSpawn.current > spawnInterval) {
      timeSinceLastSpawn.current = 0;
      
      const id = Math.random().toString(36).substr(2, 9);
      // Determine Lane Logic (Chaos pattern)
      // Sometimes spawn 2 units at once if score is high
      const spawnCount = (score > 30 && Math.random() > 0.7) ? 2 : 1;
      
      for(let i=0; i<spawnCount; i++) {
        const widthMulti = Math.min(3.5, 2 + score * 0.02);
        const spawnX = (Math.random() - 0.5) * (LANE_WIDTH * widthMulti); 
        const unitText = ["必修", "選択", "実験", "語学", "体育"][Math.floor(Math.random() * 5)];
        
        setUnits(prev => [...prev, {
            id: id + i,
            x: spawnX,
            z: SPAWN_DISTANCE - (i * 2), // Stagger slightly
            speed: currentSpeed,
            active: true,
            type: 'REQUIRED',
            text: unitText
        }]);
      }
    }

    // Update Units
    setUnits(prevUnits => {
      const nextUnits: (UnitData & { text: string })[] = [];
      let missed = false;
      let newScore = scoreRef.current;

      const playerRadius = 1.4;

      prevUnits.forEach(unit => {
        unit.z += unit.speed * delta;
        const dx = Math.abs(unit.x - targetX);
        const dz = Math.abs(unit.z - PLAYER_Z);

        if (unit.active) {
          if (dx < playerRadius && dz < playerRadius) {
            // Collected!
            newScore++;
            
            // Spawn Grade Text Effect
            const grades = ["秀", "優", "良", "可"];
            // Higher probability of "Passable" (可) as panic increases
            const grade = grades[Math.floor(Math.random() * (score > 80 ? 4 : 2))]; 
            
            setPopups(prev => [...prev, {
                id: Date.now() + Math.random(),
                pos: [unit.x, 2, unit.z] as [number, number, number],
                grade
            }].slice(-10)); // Keep only last 10 popups to save memory

            return; 
          }

          // Missed?
          if (unit.z > PLAYER_Z + 1.0) {
             missed = true;
          }
          nextUnits.push(unit);
        }
      });

      if (missed) {
        onGameOver();
        return prevUnits;
      }

      if (newScore !== scoreRef.current) {
        scoreRef.current = newScore;
        onScore(newScore);
      }

      return nextUnits;
    });
  });

  return (
    <>
      <Player positionX={Math.max(-LANE_WIDTH * 2.5, Math.min(LANE_WIDTH * 2.5, mouse.x * viewport.width * 0.5))} isPanic={isPanic.current} />
      {units.map(unit => (
        <Unit key={unit.id} x={unit.x} z={unit.z} text={unit.text} />
      ))}
      {popups.map(p => (
          <GradePopup key={p.id} position={p.pos} grade={p.grade} />
      ))}
    </>
  );
};

// --- Scene Setup ---
export const GameScene: React.FC<GameSceneProps> = (props) => {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas shadows dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <PerspectiveCamera makeDefault position={[0, 10, 14]} fov={55} rotation={[-0.5, 0, 0]} />
        
        <color attach="background" args={[BG_COLOR]} />
        <fog attach="fog" args={[BG_COLOR, 20, 70]} />
        
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        
        {/* Floating Background */}
        <FloatingDebris />

        <Grid 
          position={[0, 0, 0]} 
          args={[60, 100]} 
          cellSize={2} 
          cellThickness={1} 
          cellColor="#ffffff" 
          sectionSize={10} 
          sectionThickness={1.5} 
          sectionColor="#5eead4" 
          fadeDistance={60}
          infiniteGrid
        />

        <GameLogic {...props} />
      </Canvas>
    </div>
  );
};