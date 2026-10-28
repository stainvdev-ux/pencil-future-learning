import * as THREE from "three";
import type { SceneSpec } from "./specs";

/** Where the tanker is at route progress t (0 → 1). It drives towards -z. */
export function truckPosition(truck: NonNullable<SceneSpec["truck"]>, t: number, out: THREE.Vector3) {
  return out.set(truck.x, 0, THREE.MathUtils.lerp(truck.z0, truck.z1, THREE.MathUtils.clamp(t, 0, 1)));
}
