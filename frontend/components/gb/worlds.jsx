"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function useEntry() {
  const t = useRef(0);
  const group = useRef(null);
  useFrame((_, delta) => {
    t.current = Math.min(1, t.current + delta * 1.1);
    const e = 1 - Math.pow(1 - t.current, 3);
    if (group.current) {
      group.current.scale.setScalar(0.86 + 0.14 * e);
      group.current.position.y = (1 - e) * -1.6;
    }
  });
  return group;
}

function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Tree({ position, scale = 1, canopy = "#4b7f3f" }) {
  const ref = useRef(null);
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + seed) * 0.025;
  });
  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.6, 6]} />
        <meshStandardMaterial color="#7a5233" roughness={1} />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color={canopy} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.6, 1.6, 0.3]} castShadow>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color={canopy} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Bottle({ position, liquid = "#f6f1e2", spin = 0.4 }) {
  const ref = useRef(null);
  const seed = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y += spin * 0.01;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.9 + seed) * 0.12;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.9, 16]} />
        <meshPhysicalMaterial
          color={liquid}
          roughness={0.15}
          transmission={0.4}
          thickness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.35, 12]} />
        <meshStandardMaterial color={liquid} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.09, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Crate({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.7, 0.8]} />
        <meshStandardMaterial color="#a97a45" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[1.14, 0.06, 0.84]} />
        <meshStandardMaterial color="#8b6236" roughness={1} />
      </mesh>
    </group>
  );
}

function Blobs({ count, color, seed, spread = 14, size = 0.5, y = 0, sway = 0.4 }) {
  const mesh = useRef(null);
  const items = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * spread * 2,
      z: -r() * spread - 2,
      s: 0.55 + r() * 0.9,
      p: r() * Math.PI * 2,
    }));
  }, [count, seed, spread]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    items.forEach((it, i) => {
      dummy.position.set(it.x, y + Math.sin(t * 0.7 + it.p) * sway * 0.15, it.z);
      dummy.rotation.set(0, t * 0.05 + it.p, Math.sin(t * 0.6 + it.p) * sway * 0.08);
      dummy.scale.setScalar(size * it.s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </instancedMesh>
  );
}

function Stalks({ count, color, seed }) {
  const mesh = useRef(null);
  const items = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 26,
      z: -r() * 22 - 1,
      h: 0.9 + r() * 1.1,
      p: r() * Math.PI * 2,
    }));
  }, [count, seed]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.h / 2 - 0.4, it.z);
      dummy.rotation.set(0, 0, Math.sin(t * 1.1 + it.p + it.x * 0.2) * 0.16);
      dummy.scale.set(0.07, it.h, 0.07);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 5]} />
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </instancedMesh>
  );
}

export function Particles({ count, color, rise = 0.25, size = 0.06 }) {
  const mesh = useRef(null);
  const items = useMemo(() => {
    const r = rand(97);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 22,
      y: r() * 9,
      z: -r() * 16 + 3,
      s: 0.4 + r() * 1.2,
      p: r() * Math.PI * 2,
    }));
  }, [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    items.forEach((it, i) => {
      const yPos = ((it.y + t * rise * it.s) % 9) - 0.5;
      dummy.position.set(it.x + Math.sin(t * 0.4 + it.p) * 0.7, yPos, it.z);
      dummy.scale.setScalar(size * it.s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </instancedMesh>
  );
}

function Pasture() {
  return (
    <>
      <Blobs count={7} color="#e9e4d4" seed={11} spread={16} size={0.55} y={0.2} sway={0.2} />
      <group position={[-6.5, 0, -9]}>
        <mesh castShadow>
          <boxGeometry args={[4, 2.4, 3]} />
          <meshStandardMaterial color="#b4553f" roughness={1} flatShading />
        </mesh>
        <mesh position={[0, 1.8, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3.1, 1.4, 4]} />
          <meshStandardMaterial color="#7d3a2c" roughness={1} flatShading />
        </mesh>
      </group>
      <Tree position={[7, 0, -8]} scale={1.4} canopy="#4f8443" />
      <Tree position={[10.5, 0, -12]} scale={1.1} canopy="#437439" />
      <Crate position={[4.4, 0.35, -2.5]} rotation={0.3} />
      <Bottle position={[-3.2, 1.6, -1]} />
      <Bottle position={[3.4, 2.2, -3]} spin={-0.5} />
      <Bottle position={[-5, 2.6, -4]} spin={0.7} />
    </>
  );
}

function BakeryWorld() {
  const glow = useRef(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.intensity = 6 + Math.sin(clock.elapsedTime * 2) * 1.6;
  });
  return (
    <>
      <mesh position={[0, -0.35, -3]} receiveShadow>
        <boxGeometry args={[26, 0.5, 12]} />
        <meshStandardMaterial color="#8b5c33" roughness={1} />
      </mesh>
      <group position={[-6, 0.6, -8]}>
        <mesh castShadow>
          <boxGeometry args={[4.4, 3, 2.6]} />
          <meshStandardMaterial color="#a8663a" roughness={1} flatShading />
        </mesh>
        <mesh position={[0, -0.2, 1.35]}>
          <circleGeometry args={[0.9, 20]} />
          <meshBasicMaterial color="#ff9d3d" />
        </mesh>
        <pointLight ref={glow} position={[0, -0.2, 2.6]} color="#ff9a37" distance={12} />
      </group>
      <Blobs count={9} color="#d9a86a" seed={23} spread={9} size={0.42} y={0.5} sway={0.3} />
      <Crate position={[5.5, 0.35, -3]} rotation={-0.25} />
      <Crate position={[6.8, 0.35, -5]} rotation={0.5} />
      <mesh position={[3.2, 0.6, -2]} rotation={[0, 0.4, 0.1]} castShadow>
        <capsuleGeometry args={[0.45, 0.9, 4, 10]} />
        <meshStandardMaterial color="#d99a52" roughness={0.9} flatShading />
      </mesh>
    </>
  );
}

function FieldWorld() {
  return (
    <>
      <Stalks count={140} color="#3f6b32" seed={31} />
      <Blobs count={16} color="#5c9345" seed={41} spread={13} size={0.5} y={0.1} sway={0.8} />
      <Crate position={[-5, 0.35, -2.5]} rotation={0.2} />
      <Crate position={[5.2, 0.35, -3.4]} rotation={-0.4} />
      <Tree position={[-9, 0, -12]} scale={1.5} canopy="#3f7a37" />
      <Tree position={[9.5, 0, -13]} scale={1.3} canopy="#47823c" />
    </>
  );
}

function OrchardWorld() {
  const fruits = useRef(null);
  useFrame(({ clock }) => {
    if (fruits.current) fruits.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.1;
  });
  return (
    <>
      <Tree position={[-7, 0, -7]} scale={1.7} canopy="#5b8c46" />
      <Tree position={[7.5, 0, -8]} scale={1.6} canopy="#638f4a" />
      <Tree position={[-11, 0, -13]} scale={1.3} canopy="#527f42" />
      <Tree position={[11, 0, -14]} scale={1.4} canopy="#547f43" />
      <group ref={fruits}>
        <Blobs count={12} color="#d9603f" seed={53} spread={10} size={0.3} y={2.2} sway={0.9} />
        <Blobs count={9} color="#e2a441" seed={59} spread={9} size={0.26} y={1.4} sway={1.1} />
      </group>
      <Crate position={[3.6, 0.35, -2]} rotation={0.35} />
    </>
  );
}

function KitchenWorld() {
  return (
    <>
      <mesh position={[0, -0.3, -3]} receiveShadow>
        <boxGeometry args={[24, 0.4, 12]} />
        <meshStandardMaterial color="#a97c4c" roughness={0.95} />
      </mesh>
      {[-4, -1.4, 1.4, 4].map((x, i) => (
        <mesh key={x} position={[x, 0.15, -1.6 - i * 0.4]} castShadow>
          <sphereGeometry args={[0.62, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial
            color={["#e2c79a", "#cfae7d", "#e6d2a8", "#d7b98a"][i] ?? "#e2c79a"}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <Bottle position={[-6, 1.2, -3]} liquid="#e5b558" spin={0.3} />
      <Bottle position={[6.2, 1.5, -4]} liquid="#d6a76a" spin={-0.3} />
      <Blobs count={10} color="#c9a97a" seed={67} spread={8} size={0.28} y={0.9} sway={0.5} />
    </>
  );
}

function JuiceWorld() {
  return (
    <>
      <mesh position={[0, -0.3, -3]} receiveShadow>
        <boxGeometry args={[24, 0.4, 12]} />
        <meshStandardMaterial color="#4f7c72" roughness={0.6} metalness={0.1} />
      </mesh>
      <Bottle position={[-4.4, 1.1, -2]} liquid="#eda75f" />
      <Bottle position={[-2, 1.4, -3]} liquid="#8fbc79" spin={-0.6} />
      <Bottle position={[2.2, 1.2, -2.4]} liquid="#c4788e" spin={0.5} />
      <Bottle position={[4.8, 1.6, -3.6]} liquid="#e3cd6a" spin={-0.4} />
      <Blobs count={12} color="#cfeae4" seed={71} spread={9} size={0.24} y={2.4} sway={1.2} />
      <Tree position={[-10, 0, -12]} scale={1.2} canopy="#4a8a72" />
      <Tree position={[10, 0, -13]} scale={1.2} canopy="#4a8a72" />
    </>
  );
}

function GrainWorld() {
  return (
    <>
      <Stalks count={200} color="#c3a24f" seed={83} />
      <Blobs count={7} color="#b98f43" seed={89} spread={9} size={0.6} y={0.2} sway={0.2} />
      <Crate position={[-4.6, 0.35, -2.2]} rotation={0.15} />
      <Crate position={[4.8, 0.35, -3]} rotation={-0.3} />
    </>
  );
}

function GardenWorld() {
  return (
    <>
      <Stalks count={110} color="#3d6b3a" seed={97} />
      <Blobs count={20} color="#5a9a58" seed={101} spread={10} size={0.36} y={0.35} sway={1} />
      {[-5.5, -2.2, 1.4, 4.8].map((x, i) => (
        <group key={x} position={[x, 0, -1.6 - i * 0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.32, 0.6, 12]} />
            <meshStandardMaterial color="#a86a4a" roughness={1} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <icosahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#4e8f5a" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </>
  );
}

const WORLDS = {
  pasture: Pasture,
  bakery: BakeryWorld,
  field: FieldWorld,
  orchard: OrchardWorld,
  kitchen: KitchenWorld,
  juice: JuiceWorld,
  grain: GrainWorld,
  garden: GardenWorld,
};

export function World({ category, particleCount }) {
  const group = useEntry();
  const Body = WORLDS[category.world] || Pasture;
  return (
    <group ref={group}>
      <Body />
      <Particles
        count={particleCount}
        color={category.theme.light}
        rise={category.particle === "dew" ? 0.1 : 0.3}
        size={category.particle === "flour" ? 0.05 : 0.07}
      />
    </group>
  );
}
