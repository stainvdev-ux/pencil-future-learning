"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer } from "@react-three/drei";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { buildPlant, FLARE_TIP, LABELS } from "./plant";
import type { MatKey } from "./builder";
import { refineryState as S } from "./state";

const TOP = 16.5; // highest point of the plant, for the construction sweep

const PAPER = new THREE.Color("#f4f1ea");
const GRAPHITE = new THREE.Color("#26232e");
const SKY = {
  zenithDay: new THREE.Color("#7f9bd8"),
  zenithDusk: new THREE.Color("#170a3f"),
  horizonDay: new THREE.Color("#f7d6b2"),
  horizonDusk: new THREE.Color("#e9773d"),
  ground: new THREE.Color("#2b2233"),
};
const GROUND_DAY = new THREE.Color("#8a8278");
const GROUND_DUSK = new THREE.Color("#3a3238");
const FOG_DAY = new THREE.Color("#cdb7a6");
const FOG_DUSK = new THREE.Color("#4f2448");

const MATERIALS: Record<MatKey, THREE.MeshStandardMaterialParameters> = {
  paint: { color: "#e8e5de", roughness: 0.42, metalness: 0.12 },
  steel: { color: "#c8ccd2", roughness: 0.26, metalness: 1 },
  carbon: { color: "#5d6168", roughness: 0.5, metalness: 0.75 },
  pipe: { color: "#b4b8be", roughness: 0.32, metalness: 0.9 },
  accent: { color: "#ea7131", roughness: 0.45, metalness: 0.2 },
  concrete: { color: "#a19d96", roughness: 0.95, metalness: 0 },
  wall: { color: "#dcd6cb", roughness: 0.9, metalness: 0 },
  roof: { color: "#24085c", roughness: 0.5, metalness: 0.35 },
  cladding: { color: "#2c2c32", roughness: 0.45, metalness: 0.6 },
  glass: { color: "#1c1a22", roughness: 0.1, metalness: 0.2, emissive: "#ffb46b", emissiveIntensity: 0 },
  rail: { color: "#e2b63a", roughness: 0.5, metalness: 0.3 },
  lamp: { color: "#2a2a2a", roughness: 0.4, metalness: 0.5, emissive: "#ffd9a8", emissiveIntensity: 0 },
};

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 uPaper; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
  uniform float uReal;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.45, h));
    sky = mix(uGround, sky, smoothstep(-0.04, 0.015, h));
    gl_FragColor = vec4(mix(uPaper, sky, uReal), 1.0);
  }
`;

const flameVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float sway = sin(uTime * 7.0 + p.y * 3.0) * 0.08 + sin(uTime * 13.0) * 0.04;
    p.x += sway * uv.y; p.z += cos(uTime * 9.0 + p.y * 2.0) * 0.06 * uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const flameFragment = /* glsl */ `
  uniform float uTime; uniform float uOn;
  varying vec2 vUv;
  void main() {
    float flicker = 0.85 + 0.15 * sin(uTime * 23.0 + vUv.y * 9.0);
    vec3 core = vec3(1.0, 0.9, 0.6);
    vec3 outer = vec3(1.0, 0.38, 0.08);
    vec3 col = mix(core, outer, smoothstep(0.0, 0.8, vUv.y));
    float a = (1.0 - vUv.y) * flicker * uOn;
    gl_FragColor = vec4(col * 6.0 * uOn, a);
  }
`;

function useSketch(positions: Float32Array, distances: Float32Array, clip: THREE.Plane) {
  return useMemo(() => {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(positions);
    const buf = new THREE.InstancedInterleavedBuffer(distances, 2, 1);
    geo.setAttribute("instanceDistanceStart", new THREE.InterleavedBufferAttribute(buf, 1, 0));
    geo.setAttribute("instanceDistanceEnd", new THREE.InterleavedBufferAttribute(buf, 1, 1));
    const mat = new LineMaterial({
      color: GRAPHITE.getHex(),
      linewidth: 1.4,
      dashed: true,
      dashSize: 0,
      gapSize: 1e6,
      transparent: true,
      depthWrite: false,
    });
    mat.clippingPlanes = [clip];
    const lines = new LineSegments2(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 2;
    return { lines, mat };
  }, [positions, distances, clip]);
}

export default function Refinery() {
  const plant = useMemo(() => buildPlant(), []);
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);

  const solidClip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const sketchClip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const cut = useMemo(() => ({ uCut: { value: 0 }, uEdge: { value: 0 } }), []);

  const materials = useMemo(() => {
    const out = {} as Record<MatKey, THREE.MeshStandardMaterial>;
    for (const key of Object.keys(MATERIALS) as MatKey[]) {
      const m = new THREE.MeshStandardMaterial({ ...MATERIALS[key], side: THREE.DoubleSide });
      m.clippingPlanes = [solidClip];
      m.clipShadows = true;
      // A hot seam glows where the construction sweep currently is.
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uCut = cut.uCut;
        shader.uniforms.uEdge = cut.uEdge;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying float vWorldY;")
          .replace("#include <fog_vertex>", "#include <fog_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\nuniform float uCut;\nuniform float uEdge;\nvarying float vWorldY;")
          .replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\nfloat seam = smoothstep(0.16, 0.0, uCut - vWorldY) * uEdge;\ntotalEmissiveRadiance += vec3(1.0, 0.42, 0.14) * seam * 5.0;",
          );
      };
      out[key] = m;
    }
    return out;
  }, [solidClip, cut]);

  const { lines, mat: lineMat } = useSketch(plant.sketchPositions, plant.sketchDistances, sketchClip);

  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uPaper: { value: PAPER.clone() },
          uZenith: { value: SKY.zenithDay.clone() },
          uHorizon: { value: SKY.horizonDay.clone() },
          uGround: { value: SKY.ground.clone() },
          uReal: { value: 0 },
        },
      }),
    [],
  );

  const ground = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PAPER.clone(), roughness: 1, emissive: PAPER.clone(), emissiveIntensity: 1 }),
    [],
  );

  const flame = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOn: { value: 0 } },
      }),
    [],
  );

  const fog = useMemo(() => new THREE.Fog(PAPER.clone(), 60, 170), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const flareLight = useRef<THREE.PointLight>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(
    () => () => {
      plant.solids.forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      lines.geometry.dispose();
      lineMat.dispose();
      sky.dispose();
      ground.dispose();
      flame.dispose();
    },
    [plant, materials, lines, lineMat, sky, ground, flame],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { reveal, real, dusk, labels } = S;
    const draw = Math.max(S.draw, S.intro);

    // sketch: draw in, then hand over to the solid as the sweep passes
    lineMat.resolution.set(size.width, size.height);
    lineMat.dashSize = draw * (plant.maxDistance + 1);
    lineMat.opacity = 0.9 * (1 - THREE.MathUtils.smoothstep(reveal, 0.75, 1));
    lines.visible = lineMat.opacity > 0.001 && draw > 0;

    const cutY = -0.05 + reveal * TOP;
    solidClip.constant = cutY;
    sketchClip.constant = -cutY;
    cut.uCut.value = cutY;
    cut.uEdge.value = reveal > 0 && reveal < 1 ? 1 : 0;

    // world: paper → day → dusk
    const u = sky.uniforms;
    u.uReal.value = real;
    (u.uZenith.value as THREE.Color).lerpColors(SKY.zenithDay, SKY.zenithDusk, dusk);
    (u.uHorizon.value as THREE.Color).lerpColors(SKY.horizonDay, SKY.horizonDusk, dusk);
    ground.color.lerpColors(PAPER, GROUND_DAY, real).lerp(GROUND_DUSK, dusk);
    ground.emissiveIntensity = 1 - real;
    fog.color.lerpColors(PAPER, FOG_DAY, real).lerp(FOG_DUSK, dusk);
    fog.near = THREE.MathUtils.lerp(60, 35, dusk);

    if (sun.current) {
      sun.current.intensity = real * THREE.MathUtils.lerp(3.2, 1.4, dusk);
      sun.current.color.setRGB(1, THREE.MathUtils.lerp(0.84, 0.6, dusk), THREE.MathUtils.lerp(0.68, 0.4, dusk));
    }
    // On paper only the drawing exists: keep the sheet flat and unlit.
    if (hemi.current) hemi.current.intensity = real * THREE.MathUtils.lerp(1.1, 0.45, dusk);
    scene.environmentIntensity = real * THREE.MathUtils.lerp(1, 0.6, dusk);

    const lightsOn = THREE.MathUtils.smoothstep(dusk, 0.35, 1);
    materials.lamp.emissiveIntensity = lightsOn * 9;
    materials.glass.emissiveIntensity = lightsOn * 2;
    flame.uniforms.uTime.value = t;
    flame.uniforms.uOn.value = THREE.MathUtils.smoothstep(dusk, 0.2, 0.8);
    if (flareLight.current) flareLight.current.intensity = flame.uniforms.uOn.value * 220;

    labelRefs.current.forEach((el, i) => {
      if (!el) return;
      const a = THREE.MathUtils.clamp(labels * LABELS.length - i, 0, 1);
      el.style.opacity = String(a);
      el.style.transform = `translate3d(-50%, ${(1 - a) * 12}px, 0)`;
    });
  });

  return (
    <>
      <mesh material={sky} renderOrder={-1}>
        <sphereGeometry args={[260, 32, 16]} />
      </mesh>
      <mesh material={ground} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[600, 600]} />
      </mesh>

      <hemisphereLight ref={hemi} args={["#f3ecdf", "#4a3d33", 0.6]} />
      <directionalLight
        ref={sun}
        position={[-42, 24, 30]}
        intensity={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={140}
      />
      <pointLight ref={flareLight} position={FLARE_TIP.toArray()} color="#ff8a3d" distance={45} decay={1.6} intensity={0} />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#8d86a3"]} />
        <Lightformer form="rect" intensity={3} color="#ffb27a" position={[-30, 6, 20]} scale={[40, 8, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={1.6} color="#a9b6ff" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[30, 5, -20]} scale={[30, 5, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        <Lightformer form="ring" intensity={2} color="#ff7a3d" position={[10, 3, 30]} scale={6} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      </Environment>

      {[...plant.solids].map(([key, geo]) => (
        <mesh key={key} geometry={geo} material={materials[key]} castShadow={key !== "concrete"} receiveShadow />
      ))}
      <primitive object={lines} />

      <mesh material={flame} position={[FLARE_TIP.x, FLARE_TIP.y + 1.5, FLARE_TIP.z]}>
        <coneGeometry args={[0.55, 3.2, 16, 8, true]} />
      </mesh>

      {LABELS.map((l, i) => (
        <Html key={l.id} position={l.at.toArray()} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            className="plant-tag"
            style={{ opacity: 0 }}
          >
            {l.name}
          </div>
        </Html>
      ))}
    </>
  );
}
