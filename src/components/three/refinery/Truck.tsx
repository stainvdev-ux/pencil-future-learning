"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { SceneSpec } from "./specs";
import { refineryState as S } from "./state";
import { truckPosition } from "./truckPath";

// A 10-wheel road tanker in brand colours, built facing -z (its direction of
// travel). Origin: ground level, centre of the footprint.

const TYRE_R = 0.52;

function useMaterials() {
  return useMemo(
    () => ({
      cab: new THREE.MeshPhysicalMaterial({ color: "#2c0a6e", metalness: 0.45, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
      tank: new THREE.MeshPhysicalMaterial({ color: "#f6f4ef", metalness: 0, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
      stripe: new THREE.MeshPhysicalMaterial({ color: "#ea7131", metalness: 0.1, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#0d0f14", metalness: 0.9, roughness: 0.04 }),
      chrome: new THREE.MeshStandardMaterial({ color: "#d6d9de", metalness: 1, roughness: 0.18 }),
      dark: new THREE.MeshStandardMaterial({ color: "#1d1d21", metalness: 0.5, roughness: 0.55 }),
      tyre: new THREE.MeshStandardMaterial({ color: "#151517", metalness: 0, roughness: 0.92 }),
      rim: new THREE.MeshStandardMaterial({ color: "#b9bcc2", metalness: 0.9, roughness: 0.3 }),
      head: new THREE.MeshStandardMaterial({ color: "#e9eef5", emissive: "#fff4e0", emissiveIntensity: 0.2, roughness: 0.1 }),
      tail: new THREE.MeshStandardMaterial({ color: "#5a0d0d", emissive: "#ff2a1a", emissiveIntensity: 0.3, roughness: 0.3 }),
      amber: new THREE.MeshStandardMaterial({ color: "#7a3a06", emissive: "#ff8a1f", emissiveIntensity: 0.3, roughness: 0.3 }),
      shadow: new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.5, depthWrite: false, alphaMap: blobTexture() }),
    }),
    [],
  );
}

function blobTexture() {
  // soft elliptical contact shadow: a radial gradient stretched along the truck
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.scale(1, 4);
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, "#fff");
  grad.addColorStop(0.6, "#777");
  grad.addColorStop(1, "#000");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

type M = ReturnType<typeof useMaterials>;

function Wheel({ x, z, dual, m, wheels }: { x: number; z: number; dual?: boolean; m: M; wheels: React.RefObject<THREE.Group[]> }) {
  const side = Math.sign(x);
  return (
    <group
      position={[x, TYRE_R, z]}
      ref={(g) => {
        if (g && !wheels.current.includes(g)) wheels.current.push(g);
      }}
    >
      {[0, ...(dual ? [-0.33 * side] : [])].map((dx) => (
        <group key={dx} position={[dx, 0, 0]}>
          <mesh material={m.tyre} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[TYRE_R, TYRE_R, 0.3, 28]} />
          </mesh>
          <mesh material={m.tyre} rotation-y={Math.PI / 2}>
            <torusGeometry args={[TYRE_R - 0.05, 0.06, 8, 28]} />
          </mesh>
        </group>
      ))}
      <mesh material={m.rim} position={[side * 0.02, 0, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.31, 0.31, 0.32, 20]} />
      </mesh>
      <mesh material={m.chrome} position={[side * 0.18, 0, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.12, 0.16, 0.08, 12]} />
      </mesh>
      {/* wheel nuts make the rotation readable */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} material={m.dark} position={[side * 0.17, Math.sin(a) * 0.21, Math.cos(a) * 0.21]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.025, 0.025, 0.05, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Truck({ route }: { route: NonNullable<SceneSpec["truck"]> }) {
  const m = useMaterials();
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const beams = useRef<(THREE.SpotLight | null)[]>([]);
  const beamTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0, -30);
    return o;
  }, []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);

  useFrame(() => {
    if (!root.current) return;
    truckPosition(route, S.truck, pos);
    root.current.position.copy(pos);
    const travelled = route.z0 - pos.z;
    wheels.current.forEach((w) => (w.rotation.x = -travelled / TYRE_R));
    // a little suspension movement while rolling
    if (body.current) {
      const moving = S.truck > 0.001 && S.truck < 0.999 ? 1 : 0;
      body.current.position.y = Math.sin(travelled * 1.7) * 0.012 * moving;
      body.current.rotation.x = Math.sin(travelled * 0.9) * 0.0025 * moving;
    }
    const lightsOn = THREE.MathUtils.smoothstep(S.dusk, 0.3, 0.9);
    m.head.emissiveIntensity = 0.2 + lightsOn * 6;
    beams.current.forEach((b) => b && (b.intensity = lightsOn * 260));
    m.tail.emissiveIntensity = 0.3 + lightsOn * 4;
    m.shadow.opacity = 0.5 * (1 - S.real * 0.6);
  });

  return (
    <group ref={root}>
      <mesh material={m.shadow} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} renderOrder={1}>
        <planeGeometry args={[3.4, 12]} />
      </mesh>

      <primitive object={beamTarget} />
      {[-0.82, 0.82].map((x, i) => (
        <spotLight
          key={x}
          ref={(l) => {
            beams.current[i] = l;
          }}
          position={[x, 1.42, -5.45]}
          target={beamTarget}
          color="#fff1d6"
          angle={0.42}
          penumbra={0.7}
          distance={60}
          decay={1.5}
          intensity={0}
        />
      ))}
      <group ref={body}>
        {/* chassis */}
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} material={m.dark} position={[x, 0.95, 0.2]} castShadow>
            <boxGeometry args={[0.18, 0.3, 9.8]} />
          </mesh>
        ))}

        {/* cab */}
        <RoundedBox args={[2.45, 2.2, 2.1]} radius={0.14} smoothness={4} position={[0, 2.25, -4.25]} material={m.cab} castShadow />
        <mesh material={m.cab} position={[0, 3.55, -3.95]} rotation-x={-0.22} castShadow>
          <boxGeometry args={[2.3, 0.42, 1.5]} />
        </mesh>
        <mesh material={m.glass} position={[0, 2.78, -5.31]} rotation-x={0.06}>
          <boxGeometry args={[2.2, 0.95, 0.04]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={m.glass} position={[s * 1.23, 2.8, -4.62]}>
              <boxGeometry args={[0.04, 0.72, 0.95]} />
            </mesh>
            <mesh material={m.dark} position={[s * 1.5, 2.65, -5.05]} castShadow>
              <boxGeometry args={[0.08, 0.5, 0.26]} />
            </mesh>
            <mesh material={m.dark} position={[s * 1.36, 2.95, -5.05]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
            </mesh>
            <mesh material={m.head} position={[s * 0.82, 1.42, -5.33]}>
              <boxGeometry args={[0.42, 0.2, 0.06]} />
            </mesh>
            <mesh material={m.amber} position={[s * 1.13, 1.42, -5.32]}>
              <boxGeometry args={[0.14, 0.2, 0.06]} />
            </mesh>
            <mesh material={m.dark} position={[s * 1.15, 0.82, -4.3]}>
              <boxGeometry args={[0.3, 0.08, 0.7]} />
            </mesh>
            {/* hose box and side guard */}
            <mesh material={m.dark} position={[s * 1.12, 1.02, 0.6]} castShadow>
              <boxGeometry args={[0.32, 0.42, 2.4]} />
            </mesh>
            <mesh material={m.chrome} position={[s * 1.2, 0.72, 1.6]}>
              <boxGeometry args={[0.04, 0.12, 3.4]} />
            </mesh>
            {/* mudflaps */}
            <mesh material={m.dark} position={[s * 0.95, 0.6, 4.62]}>
              <boxGeometry args={[0.62, 0.55, 0.03]} />
            </mesh>
          </group>
        ))}
        <mesh material={m.dark} position={[0, 1.78, -5.33]}>
          <boxGeometry args={[1.5, 0.5, 0.05]} />
        </mesh>
        <mesh material={m.dark} position={[0, 1.0, -5.32]} castShadow>
          <boxGeometry args={[2.5, 0.38, 0.36]} />
        </mesh>
        <mesh material={m.chrome} position={[-1.0, 0.86, -2.6]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.3, 0.3, 1.1, 20]} />
        </mesh>

        {/* tank: elliptical barrel with dished ends and a side stripe */}
        <group position={[0, 2.33, 1.65]} scale={[1.12, 0.95, 1]}>
          <mesh material={m.tank} rotation-x={Math.PI / 2} castShadow receiveShadow>
            <cylinderGeometry args={[1.1, 1.1, 7, 48, 1, true]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={m.tank} position={[0, 0, s * 3.5]} scale={[1, 0.3, 1]} rotation-x={s * (Math.PI / 2)} castShadow>
              <sphereGeometry args={[1.1, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          ))}
          {[Math.PI / 2, (3 * Math.PI) / 2].map((c) => (
            <mesh key={c} material={m.stripe} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[1.108, 1.108, 7, 6, 1, true, c - 0.13, 0.26]} />
            </mesh>
          ))}
          {[-2.4, 0, 2.4].map((z) => (
            <mesh key={z} material={m.tank} position={[0, 0, z]}>
              <torusGeometry args={[1.1, 0.025, 6, 48]} />
            </mesh>
          ))}
        </group>
        {[0.1, 1.75, 3.4].map((z) => (
          <mesh key={z} material={m.chrome} position={[0, 3.42, z]}>
            <cylinderGeometry args={[0.28, 0.3, 0.14, 20]} />
          </mesh>
        ))}
        {[-0.48, 0.48].map((x) => (
          <group key={x}>
            <mesh material={m.chrome} position={[x, 3.75, 1.75]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.025, 0.025, 6.2, 6]} />
            </mesh>
            {[-1.2, 1.75, 4.7].map((z) => (
              <mesh key={z} material={m.chrome} position={[x, 3.58, z]}>
                <cylinderGeometry args={[0.02, 0.02, 0.36, 6]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* rear ladder, bumper and tail lights */}
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} material={m.chrome} position={[x, 2.1, 5.32]}>
            <cylinderGeometry args={[0.025, 0.025, 2.6, 6]} />
          </mesh>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} material={m.chrome} position={[0, 1.0 + i * 0.36, 5.32]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.018, 0.018, 0.5, 5]} />
          </mesh>
        ))}
        <mesh material={m.dark} position={[0, 0.78, 5.3]} castShadow>
          <boxGeometry args={[2.45, 0.24, 0.2]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={m.tail} position={[s * 0.95, 0.8, 5.41]}>
            <boxGeometry args={[0.34, 0.14, 0.04]} />
          </mesh>
        ))}

        {/* wheels: steer axle, then a tandem with duals */}
        {[-1.05, 1.05].map((x) => (
          <Wheel key={`f${x}`} x={x} z={-4.05} m={m} wheels={wheels} />
        ))}
        {[2.6, 3.95].flatMap((z) => [-1.07, 1.07].map((x) => <Wheel key={`${x}${z}`} x={x} z={z} dual m={m} wheels={wheels} />))}
      </group>
    </group>
  );
}
