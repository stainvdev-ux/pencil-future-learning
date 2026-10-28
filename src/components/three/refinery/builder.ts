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
  | "lamp"
  | "insul"
  | "asphalt"
  | "band"
  | "foliage"
  | "trunk";

type Vec = [number, number, number];

/** Pencil distance reserved for strokes that are already drawn when the scene opens. */
export const PREDRAWN = 1;
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
  private lights: number[] = [];
  private group = 0;
  private strokeInGroup = 0;
  private predrawn = false;
  maxDistance = 0;

  /** Strokes added while true are on the paper from the start (distance ≤ PREDRAWN). */
  setPredrawn(on: boolean) {
    this.predrawn = on;
  }

  /** groupGap: how far (in metres of pencil travel) each drawing group starts after the previous one. */
  constructor(private groupGap = 5, private strokeGap = 0.35) {}

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

  /** A continuous pencil stroke through the points. pace < 1 draws long lines faster. */
  stroke(points: THREE.Vector3[], pace = 1) {
    if (this.predrawn) {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        this.positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        this.distances.push(0, PREDRAWN * 0.5);
      }
      return;
    }
    let d = PREDRAWN + this.group * this.groupGap + this.strokeInGroup * this.strokeGap;
    this.strokeInGroup += 1;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const len = a.distanceTo(b);
      this.positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      this.distances.push(d, d + len * pace);
      d += len * pace;
    }
    this.maxDistance = Math.max(this.maxDistance, d);
  }

  ring(c: THREE.Vector3, r: number, axis: "x" | "y" | "z" = "y", n = 40, from = 0, to = Math.PI * 2, pace = 1) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * i) / n;
      const u = Math.cos(a) * r;
      const v = Math.sin(a) * r;
      pts.push(
        axis === "y" ? V(c.x + u, c.y, c.z + v) : axis === "x" ? V(c.x, c.y + u, c.z + v) : V(c.x + u, c.y + v, c.z),
      );
    }
    this.stroke(pts, pace);
  }

  // ---------- primitives ----------

  /** A light fitting: collected separately and drawn as one instanced, glowing mesh. */
  light(p: THREE.Vector3) {
    this.lights.push(p.x, p.y, p.z);
  }

  vCylinder(
    key: MatKey,
    x: number,
    z: number,
    y0: number,
    h: number,
    r: number,
    opts: { rings?: number[]; verticals?: number; sketch?: boolean; segments?: number; open?: boolean } = {},
  ) {
    this.add(key, new THREE.CylinderGeometry(r, r, h, opts.segments ?? 40, 1, opts.open ?? false), compose([x, y0 + h / 2, z]));
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
  pipe(key: MatKey, pts: THREE.Vector3[], r = 0.12, bend = 0.5, radial = 12, sketch = true) {
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
    const perMetre = radial > 8 ? 5 : 0.6;
    this.add(key, new THREE.TubeGeometry(path, Math.max(4, Math.ceil(len * perMetre) + (pts.length - 2) * 6), r, radial, false));
    // flanges at both ends
    for (const [end, inner] of [
      [pts[0], pts[1]],
      [pts[pts.length - 1], pts[pts.length - 2]],
    ]) {
      const dir = inner.clone().sub(end).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
      this.add(key, new THREE.CylinderGeometry(r * 1.7, r * 1.7, r * 0.5, radial + 4), new THREE.Matrix4().compose(end.clone().addScaledVector(dir, r * 0.4), q, V(1, 1, 1)));
    }
    if (sketch) this.stroke(pts);
  }

  /** Flat annular platform with a handrail, around a vertical column. */
  platform(x: number, z: number, y: number, rInner: number, width = 0.8, lights = 0) {
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
    for (let i = 0; i < lights; i++) {
      const a = (i / lights) * Math.PI * 2 + 0.3;
      this.light(V(x + Math.cos(a) * R, y + 1.3, z + Math.sin(a) * R));
    }
  }

  /** Refinery column: skirt, insulated shell, top head, platforms with lights, caged ladder. */
  column(x: number, z: number, h: number, r: number, platformEvery = 8) {
    const skirt = Math.max(2, r * 1.2);
    this.vCylinder("carbon", x, z, 0, skirt, r + 0.08, { verticals: 4, segments: 32 });
    this.vCylinder("insul", x, z, skirt, h, r, { rings: [0.5], verticals: 4, segments: 32 });
    this.head("insul", V(x, skirt + h, z), r, [0, 1, 0], 0.55);
    for (let y = skirt + platformEvery * 0.7; y < skirt + h; y += platformEvery) {
      this.platform(x, z, y, r, Math.min(1.4, 0.6 + r * 0.25), 3);
    }
    this.platform(x, z, skirt + h - 0.2, r * 0.6, r * 0.4 + 0.9, 4);
    this.ladder(x, z, 0.1, skirt + h, r + 0.5);
  }

  /** Floating-roof crude tank with wind girder and spiral stair. */
  floatingTank(x: number, z: number, r: number, h: number) {
    this.vCylinder("paint", x, z, 0, h, r, { rings: [0.5], verticals: 8, segments: 64, open: true });
    this.add("carbon", new THREE.CircleGeometry(r - 0.3, 64), compose([x, h - 1.6, z], [-Math.PI / 2, 0, 0]));
    this.add("rail", new THREE.TorusGeometry(r + 0.6, 0.12, 6, 96), compose([x, h - 1, z], [Math.PI / 2, 0, 0]));
    const steps = Math.ceil(h * 2.2);
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const a = 0.4 + t * 1.6;
      this.box("carbon", V(x + Math.cos(a) * (r + 0.7), 0.3 + t * (h - 0.4), z + Math.sin(a) * (r + 0.7)), [1.1, 0.12, 0.45], false, -a);
    }
    this.light(V(x + Math.cos(2) * (r + 0.6), h + 0.6, z + Math.sin(2) * (r + 0.6)));
    this.light(V(x + Math.cos(5) * (r + 0.6), h + 0.6, z + Math.sin(5) * (r + 0.6)));
  }

  /** Pressurised storage sphere on legs. */
  sphere(x: number, z: number, r: number) {
    const cy = r * 1.15;
    this.add("paint", new THREE.SphereGeometry(r, 48, 24), compose([x, cy, z]));
    this.ring(V(x, cy, z), r, "y", 48);
    this.ring(V(x, cy, z), r, "x", 48);
    this.ring(V(x, cy, z), r, "z", 48);
    const legs = 8;
    for (let i = 0; i < legs; i++) {
      const a = (i / legs) * Math.PI * 2;
      const lx = x + Math.cos(a) * r * 0.98;
      const lz = z + Math.sin(a) * r * 0.98;
      this.vCylinder("carbon", lx, lz, 0, cy, 0.35, { verticals: 1, segments: 10 });
    }
    this.add("rail", new THREE.TorusGeometry(r * 0.45, 0.06, 6, 40), compose([x, cy + r * 0.9, z], [Math.PI / 2, 0, 0]));
    this.light(V(x, cy + r + 0.6, z));
  }

  /** Open steel structure: columns, beams and grating floors, lit at the corners. */
  frame(x: number, z: number, w: number, d: number, h: number, levels: number) {
    const nx = Math.max(1, Math.round(w / 7));
    const nz = Math.max(1, Math.round(d / 7));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= nz; j++) {
        const px = x - w / 2 + (w * i) / nx;
        const pz = z - d / 2 + (d * j) / nz;
        this.box("carbon", V(px, h / 2, pz), [0.5, h, 0.5], i === 0 || i === nx ? j === 0 || j === nz : false);
      }
    }
    for (let l = 1; l <= levels; l++) {
      const y = (h * l) / levels;
      this.box("carbon", V(x, y, z), [w + 0.4, 0.25, d + 0.4], true);
      for (const [cx, cz] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        this.light(V(x + (cx * w) / 2, y + 1.2, z + (cz * d) / 2));
      }
    }
  }

  /** A round tree, drawn on the plan as a circle like an architect's tree symbol. */
  tree(x: number, z: number, h: number, seed: number) {
    const crown = h * 0.32;
    this.add("trunk", new THREE.CylinderGeometry(h * 0.025, h * 0.035, h * 0.5, 6), compose([x, h * 0.25, z]));
    const geo = new THREE.IcosahedronGeometry(crown, 1);
    this.add("foliage", geo, compose([x, h * 0.62, z], [seed, seed * 2, 0], [1, 0.82 + (seed % 0.2), 1]));
    this.ring(V(x, 0.2, z), crown, "y", 10); // plan
    this.ring(V(x, h * 0.62, z), crown, "x", 14); // elevation, seen from the approach road
    this.stroke([V(x, 0, z), V(x, h * 0.62 - crown, z)]);
  }

  /** Tall stack with banded top. */
  stack(x: number, z: number, h: number, r: number) {
    const plain = h * 0.78;
    this.vCylinder("concrete", x, z, 0, plain, r, { verticals: 2, segments: 32 });
    const bands = 6;
    const bh = (h - plain) / bands;
    for (let i = 0; i < bands; i++) {
      this.vCylinder(i % 2 ? "paint" : "band", x, z, plain + i * bh, bh, r * 0.96, { sketch: false, segments: 32 });
    }
    this.ring(V(x, h, z), r);
    this.light(V(x + r, h - 2, z));
    this.light(V(x - r, h - 2, z));
  }

  /** Mechanical-draught cooling tower: a row of cells with fan stacks. */
  coolingTower(x: number, z: number, cells: number, cell = 12, h = 11) {
    const w = cells * cell;
    this.box("concrete", V(x, h / 2, z), [w, h, cell], true);
    for (let i = 0; i < cells; i++) {
      const cx = x - w / 2 + cell * (i + 0.5);
      this.vCylinder("cladding", cx, z, h, 3.2, cell * 0.38, { verticals: 0, segments: 32, open: true });
      this.light(V(cx, h + 0.4, z + cell / 2));
    }
  }

  /** Pipe rack along an axis-aligned polyline, with stacked pipe runs. */
  rack(points: THREE.Vector3[], width: number, levels: number[], pipesPerLevel: number, spacing = 7) {
    const top = Math.max(...levels);
    for (let s = 1; s < points.length; s++) {
      const a = points[s - 1];
      const b = points[s];
      const dir = b.clone().sub(a);
      const len = dir.length();
      dir.normalize();
      const n = V(-dir.z, 0, dir.x);
      const count = Math.max(1, Math.round(len / spacing));
      for (let i = s === 1 ? 0 : 1; i <= count; i++) {
        const p = a.clone().addScaledVector(dir, (len * i) / count);
        for (const side of [-1, 1]) {
          const q = p.clone().addScaledVector(n, (side * width) / 2);
          this.box("carbon", V(q.x, top / 2, q.z), [0.45, top, 0.45], false);
        }
        for (const y of levels) {
          this.box("carbon", V(p.x, y - 0.2, p.z), dir.x !== 0 ? [0.35, 0.35, width] : [width, 0.35, 0.35], false);
        }
        if (i % 2 === 0) this.light(V(p.x, top + 0.8, p.z));
      }
      for (const y of levels) {
        this.stroke([a.clone().addScaledVector(n, -width / 2).setY(y), b.clone().addScaledVector(n, -width / 2).setY(y)]);
        this.stroke([a.clone().addScaledVector(n, width / 2).setY(y), b.clone().addScaledVector(n, width / 2).setY(y)]);
      }
    }
    // pipe runs, offset across the rack width, mitred at the corners
    for (const y of levels) {
      for (let k = 0; k < pipesPerLevel; k++) {
        const o = -width / 2 + 0.8 + ((width - 1.6) * k) / Math.max(1, pipesPerLevel - 1);
        const r = 0.18 + ((k * 7 + Math.round(y)) % 4) * 0.12;
        const pts = points.map((p, i) => {
          const prev = points[Math.max(0, i - 1)];
          const next = points[Math.min(points.length - 1, i + 1)];
          const d1 = p.clone().sub(prev);
          const d2 = next.clone().sub(p);
          const n1 = d1.lengthSq() ? V(-d1.z, 0, d1.x).normalize() : null;
          const n2 = d2.lengthSq() ? V(-d2.z, 0, d2.x).normalize() : null;
          const nn = n1 && n2 ? n1.clone().add(n2).divideScalar(1 + n1.dot(n2)) : (n1 ?? n2)!;
          return p.clone().addScaledVector(nn, o).setY(y + r);
        });
        this.pipe(k % 5 === 4 ? "accent" : "pipe", pts, r, 1.2, 8, false);
      }
    }
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
      lights: new Float32Array(this.lights),
      sketchPositions: new Float32Array(this.positions),
      sketchDistances: new Float32Array(this.distances),
      maxDistance: this.maxDistance,
    };
  }
}

export { V };
