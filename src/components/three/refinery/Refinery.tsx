"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer } from "@react-three/drei";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { PREDRAWN, type MatKey } from "./builder";
import type { SceneSpec } from "./specs";
import { refineryState as S } from "./state";
import Truck from "./Truck";
import Smoke from "./Smoke";

const PAPER = new THREE.Color("#f4f1ea");
const BLACK = new THREE.Color("#000000");
const GRAPHITE = new THREE.Color("#26232e");
const SKY = {
  zenithDay: new THREE.Color("#7f9bd8"),
  zenithDusk: new THREE.Color("#170a3f"),
  horizonDay: new THREE.Color("#f7d6b2"),
  horizonDusk: new THREE.Color("#e9773d"),
  ground: new THREE.Color("#2b2233"),
};
const GROUND_DAY = new THREE.Color("#7c7860");
const GROUND_DUSK = new THREE.Color("#302a2c");
const FOG_DAY = new THREE.Color("#d8c3b0");
const FOG_DUSK = new THREE.Color("#4f2448");
const LIGHT_WARM = new THREE.Color("#ffc58a");

const MATERIALS: Record<MatKey, THREE.MeshStandardMaterialParameters> = {
  paint: { color: "#e8e5de", roughness: 0.42, metalness: 0.12 },
  steel: { color: "#c8ccd2", roughness: 0.26, metalness: 1 },
  insul: { color: "#d3d6da", roughness: 0.38, metalness: 0.85 },
  carbon: { color: "#5d6168", roughness: 0.5, metalness: 0.75 },
  pipe: { color: "#b4b8be", roughness: 0.32, metalness: 0.9 },
  accent: { color: "#ea7131", roughness: 0.45, metalness: 0.2 },
  band: { color: "#d9542a", roughness: 0.5, metalness: 0.1 },
  concrete: { color: "#a19d96", roughness: 0.95, metalness: 0 },
  asphalt: { color: "#3b3a3d", roughness: 0.9, metalness: 0 },
  wall: { color: "#dcd6cb", roughness: 0.9, metalness: 0 },
  roof: { color: "#24085c", roughness: 0.5, metalness: 0.35 },
  cladding: { color: "#2c2c32", roughness: 0.45, metalness: 0.6 },
  glass: { color: "#1c1a22", roughness: 0.1, metalness: 0.2, emissive: "#ffb46b", emissiveIntensity: 0 },
  rail: { color: "#e2b63a", roughness: 0.5, metalness: 0.3 },
  lamp: { color: "#2a2a2a", roughness: 0.4, metalness: 0.5, emissive: "#ffd9a8", emissiveIntensity: 0 },
  foliage: { color: "#4b6236", roughness: 0.95, metalness: 0, flatShading: true },
  trunk: { color: "#5a4636", roughness: 0.95, metalness: 0 },
};

// Which procedural surface each material gets (see SURFACE_GLSL).
const SURFACE: Partial<Record<MatKey, number>> = {
  concrete: 1,
  wall: 1,
  asphalt: 2,
  paint: 3,
  carbon: 3,
  pipe: 3,
  accent: 3,
  band: 3,
  steel: 3,
  rail: 3,
  cladding: 3,
  roof: 3,
  insul: 4,
};

const NOISE_GLSL = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
  vec2 surfUV() {
    vec3 n = abs(vWorldNormal);
    return n.y > 0.6 ? vWorldPos.xz : (n.x > n.z ? vWorldPos.zy : vWorldPos.xy);
  }
`;

// Procedural wear: concrete joints and stains, asphalt aggregate, grime and rust
// streaks on steel, cladding seams on insulated columns, grass and dry earth on land.
const SURFACE_GLSL = /* glsl */ `
#ifdef SURFACE
  vec2 suv = surfUV();
  float n1 = fbm(vec3(suv * 0.25, 1.7));
  float n2 = vnoise(vec3(suv * 5.0, 4.1));
  #if SURFACE == 1
    vec2 jg = abs(fract(suv / 6.0) - 0.5);
    float joint = smoothstep(0.488, 0.5, max(jg.x, jg.y));
    float stain = smoothstep(0.5, 0.75, fbm(vec3(suv * 0.06, 9.0)));
    diffuseColor.rgb *= mix(0.8, 1.1, n1) * mix(0.93, 1.05, n2) * (1.0 - 0.3 * joint) * (1.0 - 0.22 * stain);
  #elif SURFACE == 2
    float patchy = smoothstep(0.45, 0.7, fbm(vec3(suv * 0.12, 2.0)));
    float speck = step(0.92, vnoise(vec3(suv * 28.0, 3.0)));
    diffuseColor.rgb = diffuseColor.rgb * mix(0.85, 1.15, n1) * (1.0 - 0.2 * patchy) + speck * 0.05;
  #elif SURFACE == 3 || SURFACE == 4
    float hgt = vWorldPos.y;
    float streak = fbm(vec3((vWorldPos.x + vWorldPos.z) * 1.6, hgt * 0.12, 5.0));
    float dirt = 1.0 - smoothstep(0.0, 3.0, hgt);
    diffuseColor.rgb *= 1.0 - 0.3 * dirt * (0.5 + 0.5 * n1);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.8, 0.72, 0.62), 0.35 * smoothstep(0.55, 0.85, streak));
    #if SURFACE == 4
      float seamLine = smoothstep(0.465, 0.5, abs(fract(hgt / 1.25) - 0.5));
      diffuseColor.rgb *= 1.0 - 0.22 * seamLine;
    #endif
  #elif SURFACE == 5
    float dry = smoothstep(0.35, 0.7, fbm(vec3(suv * 0.02, 6.0)));
    vec3 grass = vec3(0.3, 0.36, 0.2);
    vec3 earth = vec3(0.46, 0.36, 0.26);
    diffuseColor.rgb *= mix(grass, earth, dry) * 2.3 * mix(0.82, 1.12, n1) * mix(0.94, 1.04, n2);
  #endif
#endif
`;

const ROUGH_GLSL = /* glsl */ `
#ifdef SURFACE
  #if SURFACE == 3 || SURFACE == 4
    roughnessFactor = clamp(roughnessFactor + (n1 - 0.45) * 0.32, 0.05, 1.0);
  #elif SURFACE == 1 || SURFACE == 2
    roughnessFactor = clamp(roughnessFactor - n2 * 0.08, 0.5, 1.0);
  #endif
#endif
`;

/** Adds world-space varyings, surface detail and the construction seam to a standard material. */
function patchMaterial(
  m: THREE.MeshStandardMaterial,
  surface: number | undefined,
  cut?: { uCut: { value: number }; uEdge: { value: number }; uSeam: { value: number } },
) {
  // programs are cached by this key, so each surface type compiles its own variant
  m.customProgramCacheKey = () => `surface-${surface ?? 0}-${cut ? 1 : 0}`;
  m.onBeforeCompile = (shader) => {
    if (cut) Object.assign(shader.uniforms, cut);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;")
      .replace(
        "#include <fog_vertex>",
        "#include <fog_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      );
    let frag = (surface ? `#define SURFACE ${surface}\n` : "") + shader.fragmentShader;
    frag = frag
      .replace("#include <common>", "#include <common>\n" + NOISE_GLSL + (cut ? "uniform float uCut;\nuniform float uEdge;\nuniform float uSeam;\n" : ""))
      .replace("#include <map_fragment>", "#include <map_fragment>\n" + SURFACE_GLSL)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n" + ROUGH_GLSL);
    if (cut) {
      // a hot seam glows where the construction sweep currently is
      frag = frag.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\nfloat seam = smoothstep(uSeam, 0.0, uCut - vWorldPos.y) * uEdge;\ntotalEmissiveRadiance += vec3(1.0, 0.42, 0.14) * seam * 5.0;",
      );
    }
    shader.fragmentShader = frag;
  };
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 uPaper; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
  uniform vec3 uSunDir; uniform float uReal; uniform float uDusk; uniform float uTime;
  varying vec3 vDir;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
  float fbm2(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n2(p); p *= 2.07; a *= 0.5; } return s; }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.45, h));
    // sun disc and glow
    float sd = max(dot(d, normalize(uSunDir)), 0.0);
    vec3 sunCol = mix(vec3(1.0, 0.85, 0.6), vec3(1.0, 0.5, 0.2), uDusk);
    sky += sunCol * (pow(sd, 900.0) * 6.0 + pow(sd, 12.0) * 0.35 * (1.0 - uDusk * 0.4));
    // clouds on a plane above the horizon, lit warm at dusk
    vec2 cuv = d.xz / max(h, 0.06) * 0.9 + vec2(uTime * 0.004, 0.0);
    float c = fbm2(cuv * 1.3);
    float clouds = smoothstep(0.52, 0.85, c) * smoothstep(0.02, 0.16, h) * (1.0 - smoothstep(0.45, 0.85, h));
    vec3 cloudCol = mix(vec3(1.0, 0.97, 0.92), mix(vec3(1.0, 0.56, 0.3), vec3(0.32, 0.16, 0.38), smoothstep(0.1, 0.4, h)), uDusk);
    sky = mix(sky, cloudCol, clouds * 0.8);
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
      gapSize: 1e7,
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

export default function Refinery({ spec }: { spec: SceneSpec }) {
  const plant = useMemo(() => spec.build(), [spec]);
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);

  const solidClip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const sketchClip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const cut = useMemo(() => ({ uCut: { value: 0 }, uEdge: { value: 0 }, uSeam: { value: spec.seam } }), [spec.seam]);

  const materials = useMemo(() => {
    const out = {} as Record<MatKey, THREE.MeshStandardMaterial>;
    for (const key of Object.keys(MATERIALS) as MatKey[]) {
      const m = new THREE.MeshStandardMaterial({ ...MATERIALS[key], side: THREE.DoubleSide });
      m.clippingPlanes = [solidClip];
      m.clipShadows = true;
      patchMaterial(m, SURFACE[key], cut);
      out[key] = m;
    }
    return out;
  }, [solidClip, cut]);

  const { lines, mat: lineMat } = useSketch(plant.sketchPositions, plant.sketchDistances, sketchClip);

  // every light fitting on the plant: one instanced mesh, glowing at dusk
  const lightMesh = useMemo(() => {
    const count = plant.lights.length / 3;
    const mat = new THREE.MeshBasicMaterial({ color: LIGHT_WARM.clone(), toneMapped: false });
    mat.clippingPlanes = [solidClip];
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(spec.seam > 0.5 ? 0.45 : 0.12, 8, 6), mat, count);
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.makeTranslation(plant.lights[i * 3], plant.lights[i * 3 + 1], plant.lights[i * 3 + 2]);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [plant, solidClip, spec.seam]);

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
          uSunDir: { value: new THREE.Vector3(...spec.sun).normalize() },
          uReal: { value: 0 },
          uDusk: { value: 0 },
          uTime: { value: 0 },
        },
      }),
    [spec.sun],
  );

  const ground = useMemo(
    () => {
      const m = new THREE.MeshStandardMaterial({ color: PAPER.clone(), roughness: 1, emissive: PAPER.clone(), emissiveIntensity: 1 });
      patchMaterial(m, 5);
      return m;
    },
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

  const fog = useMemo(() => new THREE.Fog(PAPER.clone(), spec.fog.near, spec.fog.far), [spec.fog]);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const flareLights = useRef<(THREE.PointLight | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const cam = sun.current?.shadow.camera;
    if (!cam) return;
    const e = spec.shadowExtent;
    Object.assign(cam, { left: -e, right: e, top: e, bottom: -e, far: e * 6 });
    cam.updateProjectionMatrix();
  }, [spec.shadowExtent]);

  useEffect(
    () => () => {
      plant.solids.forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      lines.geometry.dispose();
      lineMat.dispose();
      lightMesh.geometry.dispose();
      (lightMesh.material as THREE.Material).dispose();
      sky.dispose();
      ground.dispose();
      flame.dispose();
    },
    [plant, materials, lines, lineMat, lightMesh, sky, ground, flame],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { reveal, real, dusk, labels } = S;
    const draw = Math.max(S.draw, S.intro);

    // sketch: draw in, then hand over to the solid as the sweep passes
    lineMat.resolution.set(size.width, size.height);
    lineMat.dashSize = PREDRAWN + draw * (plant.maxDistance + 1 - PREDRAWN);
    // lighter graphite while the hero text sits over the drawing
    lineMat.opacity = 0.9 * (1 - THREE.MathUtils.smoothstep(reveal, 0.75, 1)) * (1 - 0.55 * S.side);
    lines.visible = lineMat.opacity > 0.001;

    const cutY = -0.05 + reveal * spec.top;
    solidClip.constant = cutY;
    sketchClip.constant = -cutY;
    cut.uCut.value = cutY;
    cut.uEdge.value = reveal > 0 && reveal < 1 ? 1 : 0;

    // world: paper → day → dusk
    const u = sky.uniforms;
    u.uReal.value = real;
    u.uDusk.value = dusk;
    u.uTime.value = t;
    (u.uZenith.value as THREE.Color).lerpColors(SKY.zenithDay, SKY.zenithDusk, dusk);
    (u.uHorizon.value as THREE.Color).lerpColors(SKY.horizonDay, SKY.horizonDusk, dusk);
    // On paper the ground is pure emissive paper (black albedo), so light only
    // shows on real objects like the truck; it gains albedo as the world turns real.
    ground.color.lerpColors(BLACK, GROUND_DAY, real).lerp(GROUND_DUSK, dusk);
    ground.emissiveIntensity = 1 - real;
    fog.color.lerpColors(PAPER, FOG_DAY, real).lerp(FOG_DUSK, dusk);
    fog.near = THREE.MathUtils.lerp(spec.fog.near, spec.fog.duskNear, dusk);

    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(1.8, THREE.MathUtils.lerp(3.2, 1.4, dusk), real);
      sun.current.color.setRGB(1, THREE.MathUtils.lerp(0.84, 0.6, dusk), THREE.MathUtils.lerp(0.68, 0.4, dusk));
    }
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.9, THREE.MathUtils.lerp(1.1, 0.45, dusk), real);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.45, THREE.MathUtils.lerp(1, 0.6, dusk), real);

    const lightsOn = THREE.MathUtils.smoothstep(dusk, 0.35, 1);
    materials.lamp.emissiveIntensity = lightsOn * 9;
    materials.glass.emissiveIntensity = lightsOn * 2;
    (lightMesh.material as THREE.MeshBasicMaterial).color.copy(LIGHT_WARM).multiplyScalar(0.25 + lightsOn * 7);
    flame.uniforms.uTime.value = t;
    flame.uniforms.uOn.value = THREE.MathUtils.smoothstep(dusk, 0.2, 0.8);
    flareLights.current.forEach((l, i) => {
      if (l) l.intensity = flame.uniforms.uOn.value * 220 * spec.flares[i].size ** 2;
    });

    labelRefs.current.forEach((el, i) => {
      if (!el) return;
      const a = THREE.MathUtils.clamp(labels * spec.labels.length - i, 0, 1);
      el.style.opacity = String(a);
      el.style.transform = `translate3d(-50%, ${(1 - a) * 12}px, 0)`;
    });
  });

  return (
    <>
      <mesh material={sky} renderOrder={-1}>
        <sphereGeometry args={[spec.sky, 32, 16]} />
      </mesh>
      <mesh material={ground} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[spec.sky * 2.2, spec.sky * 2.2]} />
      </mesh>

      <hemisphereLight ref={hemi} args={["#f3ecdf", "#4a3d33", 0.6]} />
      <directionalLight
        ref={sun}
        position={spec.sun}
        intensity={0}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={spec.seam > 0.5 ? 0.6 : 0.03}
      />
      {spec.flares.map((f, i) => (
        <pointLight
          key={i}
          ref={(l) => {
            flareLights.current[i] = l;
          }}
          position={f.tip.toArray()}
          color="#ff8a3d"
          distance={45 * f.size * 2}
          decay={1.6}
          intensity={0}
        />
      ))}

      <Suspense fallback={null}>
      <Environment files="/hdri/venice.exr" resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffb27a" position={[-30, 6, 20]} scale={[40, 8, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={0.8} color="#fff1e2" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
      </Environment>
      {spec.smoke && <Smoke emitters={spec.smoke} />}
      </Suspense>

      {[...plant.solids].map(([key, geo]) => (
        <mesh key={key} geometry={geo} material={materials[key]} castShadow={key !== "concrete" && key !== "asphalt"} receiveShadow />
      ))}
      <primitive object={lightMesh} />
      {spec.truck && <Truck route={spec.truck} />}
      <primitive object={lines} />

      {spec.flares.map((f, i) => (
        <mesh key={i} material={flame} position={[f.tip.x, f.tip.y + 1.5 * f.size, f.tip.z]} scale={f.size}>
          <coneGeometry args={[0.55, 3.2, 16, 8, true]} />
        </mesh>
      ))}

      {spec.labels.map((l, i) => (
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
