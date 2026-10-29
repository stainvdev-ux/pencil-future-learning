import * as THREE from "three";
import type { PlantBuilder } from "./builder";
import { buildPlant, FLARE_TIP, LABELS } from "./plant";
import { buildComplex, COMPLEX_FLARES, COMPLEX_LABELS, COMPLEX_SMOKE } from "./complex";

export type Built = ReturnType<PlantBuilder["build"]>;

export type SceneSpec = {
  build: () => Built;
  labels: { id: string; name: string; at: THREE.Vector3 }[];
  flares: { tip: THREE.Vector3; size: number }[];
  /** highest point, for the construction sweep */
  top: number;
  /** height of the glowing seam at the construction sweep */
  seam: number;
  cameraKeys: { p: [number, number, number]; t: [number, number, number] }[];
  sun: [number, number, number];
  shadowExtent: number;
  fog: { near: number; far: number; duskNear: number };
  sky: number;
  ao: number;
  /** a tanker driving north along x from z0 to z1 */
  truck?: { x: number; z0: number; z1: number };
  /** smoke from stacks, steam from cooling towers */
  smoke?: { p: THREE.Vector3; kind: "smoke" | "steam" }[];
};

/** Pencil's planned miniature industrial learning facility. */
export const miniPlant: SceneSpec = {
  build: buildPlant,
  labels: LABELS,
  flares: [{ tip: FLARE_TIP, size: 1 }],
  top: 16.5,
  seam: 0.16,
  cameraKeys: [
    { p: [0.5, 62, 13], t: [0.5, 0, 0] },
    { p: [30, 24, 34], t: [1, 2, 0] },
    { p: [-25, 8.5, 27], t: [2, 4, -1] },
    { p: [10, 3.6, 22], t: [7, 7, -6] },
  ],
  sun: [-42, 24, 30],
  shadowExtent: 30,
  fog: { near: 60, far: 170, duskNear: 35 },
  sky: 260,
  ao: 2.2,
};

/** A full-scale refinery: the industry the proposed programs lead into. */
export const refineryComplex: SceneSpec = {
  build: buildComplex,
  labels: COMPLEX_LABELS,
  flares: COMPLEX_FLARES,
  top: 96,
  seam: 0.9,
  cameraKeys: [
    { p: [5, 560, 130], t: [5, 0, -5] },
    { p: [310, 210, 330], t: [0, 10, -10] },
    { p: [-240, 60, 235], t: [0, 18, -25] },
    { p: [-14, 7, 150], t: [32, 22, -40] },
  ],
  sun: [-420, 230, 300],
  shadowExtent: 240,
  fog: { near: 320, far: 1400, duskNear: 180 },
  sky: 1800,
  ao: 7,
  truck: { x: 17, z0: 560, z1: 95 },
  smoke: COMPLEX_SMOKE,
};
