"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import Refinery from "./Refinery";
import type { SceneSpec } from "./specs";
import { refineryState as S } from "./state";

const smooth = (x: number) => x * x * (3 - 2 * x);

// Camera path through the spec's keys: plan view (a site drawing) →
// isometric → low three-quarter → hero, driven by refineryState.cam.
function Rig({ keys }: { keys: SceneSpec["cameraKeys"] }) {
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const c = THREE.MathUtils.clamp(S.cam, 0, keys.length - 1);
    const i = Math.min(Math.floor(c), keys.length - 2);
    const f = smooth(c - i);
    pos.lerpVectors(a.fromArray(keys[i].p), b.fromArray(keys[i + 1].p), f);
    target.lerpVectors(a.fromArray(keys[i].t), b.fromArray(keys[i + 1].t), f);

    // Portrait screens: step back so the plant still fits.
    const aspect = state.size.width / state.size.height;
    if (aspect < 1) pos.sub(target).multiplyScalar(THREE.MathUtils.lerp(1.9, 1, aspect)).add(target);

    // a slow breathing drift so the scene never feels frozen
    const t = state.clock.elapsedTime;
    const drift = Math.min(c, 1) * pos.distanceTo(target) * 0.012;
    pos.x += Math.sin(t * 0.25) * drift;
    pos.y += Math.sin(t * 0.31) * drift * 0.6;

    state.camera.position.copy(pos);
    state.camera.lookAt(target);
  });
  return null;
}

export default function RefineryCanvas({ spec }: { spec: SceneSpec }) {
  const start = spec.cameraKeys[0].p;
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 35, near: 0.5, far: spec.sky * 2.5, position: start }}
      gl={{ antialias: false, powerPreference: "high-performance", logarithmicDepthBuffer: false }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <Refinery spec={spec} />
      <Rig keys={spec.cameraKeys} />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={spec.ao} intensity={2.2} distanceFalloff={1.2} halfRes />
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.2} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </Canvas>
  );
}
