"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import Refinery from "./Refinery";
import { refineryState as S } from "./state";

// Camera path: plan view (a site drawing) → isometric → low three-quarter → hero.
export const CAMERA_KEYS = [
  { p: [0.5, 62, 13], t: [0.5, 0, 0] },
  { p: [30, 24, 34], t: [1, 2, 0] },
  { p: [-25, 8.5, 27], t: [2, 4, -1] },
  { p: [10, 3.6, 22], t: [7, 7, -6] },
] as const;

const smooth = (x: number) => x * x * (3 - 2 * x);

function Rig() {
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const c = THREE.MathUtils.clamp(S.cam, 0, CAMERA_KEYS.length - 1);
    const i = Math.min(Math.floor(c), CAMERA_KEYS.length - 2);
    const f = smooth(c - i);
    pos.lerpVectors(a.fromArray(CAMERA_KEYS[i].p), b.fromArray(CAMERA_KEYS[i + 1].p), f);
    target.lerpVectors(a.fromArray(CAMERA_KEYS[i].t), b.fromArray(CAMERA_KEYS[i + 1].t), f);

    // Portrait screens: step back so the plant still fits.
    const aspect = state.size.width / state.size.height;
    if (aspect < 1) pos.sub(target).multiplyScalar(THREE.MathUtils.lerp(1.9, 1, aspect)).add(target);

    // a slow breathing drift so the scene never feels frozen
    const t = state.clock.elapsedTime;
    const drift = Math.min(c, 1);
    pos.x += Math.sin(t * 0.25) * 0.35 * drift;
    pos.y += Math.sin(t * 0.31) * 0.2 * drift;

    state.camera.position.copy(pos);
    state.camera.lookAt(target);
  });
  return null;
}

export default function RefineryCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 35, near: 0.5, far: 600, position: [0.5, 62, 13] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <Refinery />
      <Rig />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={2.2} intensity={2.2} distanceFalloff={1.2} halfRes />
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.2} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </Canvas>
  );
}
