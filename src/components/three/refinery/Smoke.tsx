"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import type { SceneSpec } from "./specs";
import { refineryState as S } from "./state";

const PER_EMITTER = 28;

const vertex = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform float uScale; uniform float uOn;
  attribute float aSeed; attribute float aKind;
  varying float vAlpha; varying float vRot; varying float vKind; varying float vT;
  void main() {
    float t = fract(aSeed + uTime * mix(0.035, 0.07, aKind));
    vec3 p = position;
    p.y += t * mix(38.0, 16.0, aKind);
    // the wind carries it east, more the higher it climbs
    p.x += t * t * mix(30.0, 10.0, aKind) + sin(aSeed * 40.0 + uTime * 0.3) * t * 3.0;
    p.z += -t * t * 8.0 + cos(aSeed * 23.0) * t * 3.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = mix(4.0, 2.5, aKind) + t * mix(22.0, 9.0, aKind);
    gl_PointSize = size * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
    vAlpha = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(mix(0.4, 0.2, aKind), 1.0, t)) * uOn;
    vRot = aSeed * 6.2831 + uTime * 0.05 * (fract(aSeed * 7.0) - 0.5);
    vKind = aKind;
    vT = t;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap; uniform float uDusk;
  varying float vAlpha; varying float vRot; varying float vKind; varying float vT;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    uv = mat2(c, -s, s, c) * uv + 0.5;
    vec4 tx = texture2D(uMap, uv);
    float a = tx.a * vAlpha * mix(0.5, 0.65, vKind);
    vec3 col = mix(vec3(0.6, 0.58, 0.56), vec3(0.95), vKind);
    // at dusk the plume is lit warm from below and fades to violet as it rises
    vec3 duskTint = mix(vec3(0.38, 0.22, 0.34), vec3(1.0, 0.55, 0.35), 1.0 - vT);
    col = mix(col, col * duskTint * 1.5, uDusk);
    gl_FragColor = vec4(col, a);
  }
`;

export default function Smoke({ emitters }: { emitters: NonNullable<SceneSpec["smoke"]> }) {
  const map = useLoader(THREE.TextureLoader, "/textures/cloud.webp");

  const points = useMemo(() => {
    const n = emitters.length * PER_EMITTER;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const kind = new Float32Array(n);
    let k = 0;
    emitters.forEach((e, ei) => {
      for (let i = 0; i < PER_EMITTER; i++, k++) {
        pos.set([e.p.x, e.p.y, e.p.z], k * 3);
        seed[k] = i / PER_EMITTER + ((ei * 0.137) % 1) * 0.03;
        kind[k] = e.kind === "steam" ? 1 : 0;
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uScale: { value: 500 }, uOn: { value: 0 }, uDusk: { value: 0 }, uMap: { value: map } },
    });
    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    p.renderOrder = 3;
    return p;
  }, [emitters, map]);

  useEffect(
    () => () => {
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    },
    [points],
  );

  useFrame((state) => {
    const u = (points.material as THREE.ShaderMaterial).uniforms;
    const cam = state.camera as THREE.PerspectiveCamera;
    u.uTime.value = state.clock.elapsedTime;
    u.uScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    u.uOn.value = THREE.MathUtils.smoothstep(S.reveal, 0.9, 1) * S.real;
    u.uDusk.value = S.dusk;
  });

  return <primitive object={points} />;
}
