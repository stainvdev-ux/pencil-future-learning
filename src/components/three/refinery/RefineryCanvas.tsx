"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import Refinery from "./Refinery";
import type { SceneSpec } from "./specs";
import { refineryState as S } from "./state";
import { truckPosition } from "./truckPath";

const smooth = (x: number) => x * x * (3 - 2 * x);

// Camera path through the spec's keys: plan view (a site drawing) →
// isometric → low three-quarter → hero, driven by refineryState.cam.
function Rig({ keys, truck }: { keys: SceneSpec["cameraKeys"]; truck?: SceneSpec["truck"] }) {
  const tp = useMemo(() => new THREE.Vector3(), []);
  const sidePos = useMemo(() => new THREE.Vector3(), []);
  const sideTarget = useMemo(() => new THREE.Vector3(), []);
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

    // Riding alongside the tanker (side view), easing out into the keyframe path.
    if (truck && S.side > 0) {
      truckPosition(truck, S.truck, tp);
      sidePos.set(tp.x + 25, 2.4, tp.z + 2);
      sideTarget.set(tp.x, 4.8, tp.z + 5.2);
      const k = smooth(S.side);
      // rise late and fast, like a crane shot pulling up and away
      pos.x = THREE.MathUtils.lerp(pos.x, sidePos.x, k);
      pos.z = THREE.MathUtils.lerp(pos.z, sidePos.z, k);
      pos.y = THREE.MathUtils.lerp(pos.y, sidePos.y, Math.pow(k, 0.35));
      target.lerp(sideTarget, k);
    }

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
      <Rig keys={spec.cameraKeys} truck={spec.truck} />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={spec.ao} intensity={2.2} distanceFalloff={1.2} halfRes />
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.2} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </Canvas>
  );
}
