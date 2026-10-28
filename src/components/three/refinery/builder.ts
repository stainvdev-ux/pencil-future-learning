import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Builds the plant twice: as solid geometry merged per material (few draw
// calls), and as pencil strokes for the sketch phase. Each stroke carries its
// own distance range so the sketch can be "drawn" by sweeping one uniform.

export type MatKey =
  | "paint"
  | "steel"
  | "carbon"
  | "pipe"
  | "accent"
  | "concrete"
  | "wall"
  | "roof"
  | "cladding"
  | "glass"
  | "rail"
  | "lamp";

type Vec = [number, number, number];
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function compose(pos: Vec, rot: Vec = [0, 0, 0], scale: Vec = [1, 1, 1]) {
  return new THREE.Matrix4().compose(
    V(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    V(...scale),
  );
}

export class PlantBuilder {
  private geos = new Map<MatKey, THREE.BufferGeometry[]>();
  private positions: number[] = [];
  private distances: number[] = [];
  private group = 0;
  private strokeInGroup = 0;
  maxDistance = 0;

  /** Start a new drawing group: everything added after this is sketched next. */
  next() {
    this.group += 1;
    this.strokeInGroup = 0;
  }

  add(key: MatKey, geo: THREE.BufferGeometry, m?: THREE.Matrix4) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (m) g.applyMatrix4(m);
    g.clearGroups();
    g = new THREE.BufferGeometry()
      .setAttribute("position", g.getAttribute("position"))
      .setAttribute("normal", g.getAttribute("normal"));
    const list = this.geos.get(key) ?? [];
    list.push(g);
    this.geos.set(key, list);
  }

  /** A continuous pencil stroke through the points. */
  stroke(points: THREE.Vector3[]) {
    let d = this.group * 5 + this.strokeInGroup * 0.35;
    this.strokeInGroup += 1;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const len = a.distanceTo(b);
      this.positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      this.distances.push(d, d + len);
      d += len;
    }
    this.maxDistance = Math.max(this.maxDistance, d);
  }

  ring(c: THREE.Vector3, r: number, axis: "x" | "y" | "z" = "y", n = 40, from = 0, to = Math.PI * 2) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * i) / n;
      const u = Math.cos(a) * r;
      const v = Math.sin(a) * r;
      pts.push(
        axis === "y" ? V(c.x + u, c.y, c.z + v) : axis === "x" ? V(c.x, c.y + u, c.z + v) : V(c.x + u, c.y + v, c.z),
      );
    }
    this.stroke(pts);
  }

  // ---------- primitives ----------

  vCylinder(key: MatKey, x: number, z: number, y0: number, h: number, r: number, opts: { rings?: number[]; verticals?: number; sketch?: boolean } = {}) {
    this.add(key, new THREE.CylinderGeometry(r, r, h, 40, 1), compose([x, y0 + h / 2, z]));
    if (opts.sketch === false) return;
    this.ring(V(x, y0, z), r);
    for (const t of opts.rings ?? []) this.ring(V(x, y0 + h * t, z), r);
    this.ring(V(x, y0 + h, z), r);
    const n = opts.verticals ?? 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / 4;
      this.stroke([V(x + Math.cos(a) * r, y0, z + Math.sin(a) * r), V(x + Math.cos(a) * r, y0 + h, z + Math.sin(a) * r)]);
    }
  }

  /** Horizontal cylinder along x or z, centred on c. */
  hCylinder(key: MatKey, c: THREE.Vector3, len: number, r: number, axis: "x" | "z" = "x", sketch = true) {
    const rot: Vec = axis === "x" ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
    this.add(key, new THREE.CylinderGeometry(r, r, len, 40, 1), compose([c.x, c.y, c.z], rot));
    if (!sketch) return;
    const dir = axis === "x" ? V(1, 0, 0) : V(0, 0, 1);
    const a = c.clone().addScaledVector(dir, -len / 2);
    const b = c.clone().addScaledVector(dir, len / 2);
    this.ring(a, r, axis);
    this.ring(b, r, axis);
    const up = V(0, r, 0);
    const side = axis === "x" ? V(0, 0, r) : V(r, 0, 0);
    for (const o of [up, up.clone().negate(), side, side.clone().negate()]) {
      this.stroke([a.clone().add(o), b.clone().add(o)]);
    }
  }

  /** Elliptical vessel head. dir: the axis it points along (+y, -y, +x, -x, +z, -z). */
  head(key: MatKey, c: THREE.Vector3, r: number, dir: Vec, depth = 0.5) {
    const geo = new THREE.SphereGeometry(r, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(...dir).normalize());
    const m = new THREE.Matrix4().compose(c, q, V(1, depth, 1));
    this.add(key, geo, m);
    // two meridian arcs
    for (const phi of [0, Math.PI / 2]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = (i / 16) * Math.PI;
        pts.push(V(Math.cos(t) * r * Math.cos(phi), Math.sin(t) * r * depth, Math.cos(t) * r * Math.sin(phi)).applyQuaternion(q).add(c));
      }
      this.stroke(pts);
    }
  }

  box(key: MatKey, c: THREE.Vector3, size: Vec, sketch = true, rotY = 0) {
    this.add(key, new THREE.BoxGeometry(...size), compose([c.x, c.y, c.z], [0, rotY, 0]));
    if (!sketch) return;
    const [w, h, d] = size.map((s) => s / 2);
    const m = new THREE.Matrix4().makeRotationY(rotY);
    const p = (x: number, y: number, z: number) => V(x, y, z).applyMatrix4(m).add(c);
    const b = [p(-w, -h, -d), p(w, -h, -d), p(w, -h, d), p(-w, -h, d)];
    const t = [p(-w, h, -d), p(w, h, -d), p(w, h, d), p(-w, h, d)];
    this.stroke([...b, b[0]]);
    this.stroke([...t, t[0]]);
    for (let i = 0; i < 4; i++) this.stroke([b[i], t[i]]);
  }

  /** Pipe through the points, with rounded elbows. Sketched as a single line, like a P&ID. */
  pipe(key: MatKey, pts: THREE.Vector3[], r = 0.12, bend = 0.5) {
    const path = new THREE.CurvePath<THREE.Vector3>();
    let cur = pts[0].clone();
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (i < pts.length - 1) {
        const prev = pts[i - 1];
        const next = pts[i + 1];
        const b = Math.min(bend, p.distanceTo(prev) / 2, next.distanceTo(p) / 2);
        const a = p.clone().addScaledVector(p.clone().sub(prev).normalize(), -b);
        const c = p.clone().addScaledVector(next.clone().sub(p).normalize(), b);
        if (cur.distanceTo(a) > 1e-4) path.add(new THREE.LineCurve3(cur.clone(), a));
        path.add(new THREE.QuadraticBezierCurve3(a, p.clone(), c));
        cur = c;
      } else if (cur.distanceTo(p) > 1e-4) {
        path.add(new THREE.LineCurve3(cur.clone(), p.clone()));
      }
    }
    const len = path.getLength();
    this.add(key, new THREE.TubeGeometry(path, Math.max(8, Math.ceil(len * 5)), r, 12, false));
    // flanges at both ends
    for (const [end, inner] of [
      [pts[0], pts[1]],
      [pts[pts.length - 1], pts[pts.length - 2]],
    ]) {
      const dir = inner.clone().sub(end).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
      this.add(key, new THREE.CylinderGeometry(r * 1.7, r * 1.7, 0.06, 20), new THREE.Matrix4().compose(end.clone().addScaledVector(dir, 0.05), q, V(1, 1, 1)));
    }
    this.stroke(pts);
  }

  /** Flat annular platform with a handrail, around a vertical column. */
  platform(x: number, z: number, y: number, rInner: number, width = 0.8) {
    const shape = new THREE.Shape().absarc(0, 0, rInner + width, 0, Math.PI * 2, false);
    shape.holes.push(new THREE.Path().absarc(0, 0, rInner, 0, Math.PI * 2, true));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false, curveSegments: 40 });
    this.add("carbon", geo, compose([x, y, z], [-Math.PI / 2, 0, 0]));
    const R = rInner + width - 0.05;
    this.add("rail", new THREE.TorusGeometry(R, 0.025, 6, 48), compose([x, y + 1.05, z], [Math.PI / 2, 0, 0]));
    this.add("rail", new THREE.TorusGeometry(R, 0.02, 6, 48), compose([x, y + 0.55, z], [Math.PI / 2, 0, 0]));
    const posts = 10;
    for (let i = 0; i < posts; i++) {
      const a = (i / posts) * Math.PI * 2;
      this.add("rail", new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), compose([x + Math.cos(a) * R, y + 0.52, z + Math.sin(a) * R]));
    }
    this.ring(V(x, y, z), rInner + width);
    this.ring(V(x, y + 1.05, z), R, "y", 32);
  }

  /** Caged ladder running up the +x side of a column. */
  ladder(x: number, z: number, y0: number, h: number, offset: number) {
    const lx = x + offset;
    for (const dz of [-0.22, 0.22]) {
      this.add("rail", new THREE.CylinderGeometry(0.025, 0.025, h, 6), compose([lx, y0 + h / 2, z + dz]));
    }
    for (let y = y0 + 0.3; y < y0 + h; y += 0.32) {
      this.add("rail", new THREE.CylinderGeometry(0.018, 0.018, 0.44, 5), compose([lx, y, z], [Math.PI / 2, 0, 0]));
    }
    this.stroke([V(lx, y0, z - 0.22), V(lx, y0 + h, z - 0.22)]);
    this.stroke([V(lx, y0, z + 0.22), V(lx, y0 + h, z + 0.22)]);
  }

  build() {
    const solids = new Map<MatKey, THREE.BufferGeometry>();
    for (const [key, list] of this.geos) {
      const merged = mergeGeometries(list, false);
      if (merged) solids.set(key, merged);
      list.forEach((g) => g.dispose());
    }
    return {
      solids,
      sketchPositions: new Float32Array(this.positions),
      sketchDistances: new Float32Array(this.distances),
      maxDistance: this.maxDistance,
    };
  }
}

export { V };
