"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { categories } from "../../data/categories";
import { World } from "./worlds";

const INTRO = {
  id: "dairy",
  name: "Farm",
  icon: "🌅",
  title: "GreenBasket",
  subtitle: "",
  world: "pasture",
  particle: "pollen",
  theme: {
    sky: "#f3d9ae",
    horizon: "#fdf1d6",
    ground: "#6f9a5a",
    fog: "#f6e6c8",
    light: "#ffe6ab",
    accent: "#f2c14e",
    glass: "#fdf8ec",
  },
};

function Environment({ category, reduced }) {
  const { scene } = useThree();
  const sky = useRef(new THREE.Color(category.theme.sky));
  const fog = useRef(new THREE.Color(category.theme.fog));
  const ground = useRef(null);
  const sun = useRef(null);
  const target = useRef({
    sky: new THREE.Color(category.theme.sky),
    fog: new THREE.Color(category.theme.fog),
    ground: new THREE.Color(category.theme.ground),
    light: new THREE.Color(category.theme.light),
  });

  useEffect(() => {
    target.current.sky.set(category.theme.sky);
    target.current.fog.set(category.theme.fog);
    target.current.ground.set(category.theme.ground);
    target.current.light.set(category.theme.light);
  }, [category]);

  useEffect(() => {
    scene.background = sky.current;
    scene.fog = new THREE.Fog(fog.current, 12, 46);
  }, [scene]);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-2.2 * Math.min(delta, 0.1));
    sky.current.lerp(target.current.sky, k);
    fog.current.lerp(target.current.fog, k);
    if (scene.fog) scene.fog.color.copy(fog.current);
    ground.current?.color.lerp(target.current.ground, k);
    sun.current?.color.lerp(target.current.light, k);

    const t = state.clock.elapsedTime;
    const amp = reduced ? 0.15 : 1;
    state.camera.position.x += (Math.sin(t * 0.12) * 1.1 * amp - state.camera.position.x) * k;
    state.camera.position.y +=
      (2.6 + Math.sin(t * 0.18) * 0.35 * amp - state.camera.position.y) * k;
    state.camera.lookAt(0, 1.6, -6);
  });

  return (
    <>
      <hemisphereLight args={["#ffffff", "#6d8b57", 1.1]} />
      <directionalLight
        ref={sun}
        position={[6, 9, 4]}
        intensity={1.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.5, -6]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial ref={ground} color={category.theme.ground} roughness={1} />
      </mesh>
    </>
  );
}

export function Scene({ categoryIndex, intro, reduced }) {
  const [mounted, setMounted] = useState(false);
  const [dpr, setDpr] = useState(1);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDpr(Math.min(window.devicePixelRatio || 1, 1.75));
    setMobile(window.innerWidth < 768);
  }, []);

  if (!mounted) return <div className="fixed inset-0 -z-10 bg-[#eef3e2]" />;

  const category = intro ? INTRO : (categories[categoryIndex] ?? categories[0]);
  const particles = reduced ? 0 : mobile ? 26 : 70;

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: !mobile, powerPreference: "high-performance" }}
        camera={{ position: [0, 2.6, 9], fov: 55 }}
      >
        <Suspense fallback={null}>
          <Environment category={category} reduced={reduced} />
          <World key={category.world + (intro ? "-intro" : "")} category={category} particleCount={particles} />
        </Suspense>
      </Canvas>
    </div>
  );
}
