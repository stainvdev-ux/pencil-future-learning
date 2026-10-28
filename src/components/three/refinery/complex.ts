import * as THREE from "three";
import { PlantBuilder, V } from "./builder";

// A full-scale oil refinery: the industry Pencil's proposed programs lead
// into. Illustrative only; it is not a depiction of Pencil's facilities.
// Units are metres; x runs east, z runs south towards the main gate.

const RACK_Z = -15;

export const COMPLEX_GATE = V(20, 0, 140);
export const COMPLEX_GANTRY = V(20, 0, 95);

// Each tag names a proposed program from the website copy, placed on the part
// of the plant where that discipline does its work.
export const COMPLEX_LABELS = [
  { id: "oil-gas", name: "Oil & Gas Engineering", at: V(0, 62, -45) },
  { id: "piping", name: "Piping & Pipeline Engineering", at: V(100, 19, RACK_Z) },
  { id: "qaqc", name: "QA/QC Mechanical", at: V(-125, 22, -65) },
  { id: "ndt", name: "Non-Destructive Testing (NDT)", at: V(-125, 24, 95) },
  { id: "maintenance", name: "Industrial Maintenance", at: V(130, 18, -82) },
  { id: "automation", name: "Robotics & Automation", at: V(130, 17, 75) },
  { id: "logistics", name: "Logistics & Supply Chain Management", at: V(20, 15, 95) },
];

export const COMPLEX_FLARES = [
  { tip: V(175, 95, -120), size: 4.5 },
  { tip: V(158, 76, -128), size: 3.4 },
];

export function buildComplex() {
  const b = new PlantBuilder(70, 0.6);

  // ---------- ground: slab, roads, approach road ----------
  b.box("concrete", V(5, 0.05, 0), [390, 0.1, 280], true);
  const road = (x0: number, z0: number, x1: number, z1: number, w: number) => {
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const size: [number, number, number] = x0 === x1 ? [w, 0.06, Math.abs(z1 - z0) + w] : [Math.abs(x1 - x0) + w, 0.06, w];
    b.box("asphalt", V(cx, 0.13, cz), size, true);
  };
  b.setPredrawn(true);
  road(20, 40, 20, 640, 12); // main gate road, continues outside the site
  b.setPredrawn(false);
  road(-180, 50, 190, 50, 10); // ring road, south
  road(-180, -135, 190, -135, 8); // ring road, north
  road(-65, -135, -65, 50, 8);
  road(98, -135, 98, 50, 8);
  road(-180, -135, -180, 50, 8);
  road(190, -135, 190, 50, 8);
  b.box("asphalt", V(20, 0.13, 95), [64, 0.06, 42], false); // loading apron
  // perimeter fence line
  for (const [x0, z0, x1, z1] of [
    [-195, -145, 205, -145],
    [-195, 145, 12, 145],
    [28, 145, 205, 145],
    [-195, -145, -195, 145],
    [205, -145, 205, 145],
  ]) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const vertical = x0 === x1;
    b.box("wall", V((x0 + x1) / 2, 1.2, (z0 + z1) / 2), vertical ? [0.4, 2.4, len] : [len, 2.4, 0.4], true);
  }

  // ---------- landscape: horizon, approach-road lamps, trees (already drawn: the opening rides through them) ----------
  b.next();
  b.setPredrawn(true);
  b.ring(V(5, 0, 0), 1100, "y", 180, 0, Math.PI * 2, 0.03);
  for (let z = 60; z <= 640; z += 30) {
    for (const x of [12, 28]) {
      b.vCylinder("carbon", x, z, 0, 10, 0.16, { verticals: 1, segments: 8 });
      b.light(V(x, 10.3, z));
    }
  }
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let planted = 0;
  while (planted < 520) {
    const x = -330 + rand() * 680;
    const z = -260 + rand() * 900;
    const inSite = x > -205 && x < 215 && z > -155 && z < 155;
    const onRoad = x > -40 && x < 80 && z > 120; // keep the side-view camera corridor clear
    if (inSite || onRoad) continue;
    b.tree(x, z, 9 + rand() * 9, rand() * 6);
    planted++;
  }
  b.setPredrawn(false);


  // ---------- tank farm (west) ----------
  b.next();
  const tankXs = [-160, -125, -90];
  const tankZs = [-105, -65, -25, 15];
  tankZs.forEach((z, row) => {
    tankXs.forEach((x, col) => {
      const r = 13 + ((row + col) % 3) * 1.2;
      const h = 15 + ((row * 3 + col) % 3) * 1.5;
      b.floatingTank(x, z, r, h);
    });
    // bund walls between rows
    b.box("wall", V(-125, 0.8, z + 20), [110, 1.6, 0.6], true);
  });
  b.box("wall", V(-125, 0.8, -125), [110, 1.6, 0.6], true);
  b.box("wall", V(-180, 0.8, -55), [0.6, 1.6, 140], true);
  b.box("wall", V(-70, 0.8, -55), [0.6, 1.6, 140], true);

  // ---------- storage spheres (south-west) ----------
  b.next();
  for (const x of [-150, -125, -100]) b.sphere(x, 95, 9);
  b.rack([V(-160, 0, 80), V(-60, 0, 80), V(-60, 0, RACK_Z)], 6, [5], 3);

  // ---------- main pipe rack and branches ----------
  b.next();
  b.rack([V(-72, 0, RACK_Z), V(150, 0, RACK_Z)], 10, [6, 10, 14], 5);
  b.rack([V(30, 0, RACK_Z), V(30, 0, 42)], 8, [6, 10], 4);
  b.rack([V(-72, 0, RACK_Z), V(-72, 0, -110)], 6, [6], 3);

  // ---------- crude distillation unit (north of the rack) ----------
  b.next();
  b.column(0, -45, 52, 3.4, 7);
  b.column(18, -50, 34, 5.2, 8);
  b.column(-12, -38, 24, 1.4, 7);
  b.column(-8, -55, 20, 1.2, 7);
  // fired heater with two stacks
  b.box("cladding", V(-32, 7, -58), [26, 14, 16], true);
  b.box("band", V(-32, 14.4, -58), [26.4, 0.8, 16.4], false);
  b.stack(-40, -58, 55, 2);
  b.stack(-24, -58, 55, 2);
  // exchanger bank under the rack
  for (let i = 0; i < 6; i++) {
    const x = -2 + i * 7.5;
    b.hCylinder("steel", V(x, 1.8, RACK_Z - 10), 6.5, 0.85, "x");
    b.hCylinder("steel", V(x, 3.8, RACK_Z - 10), 6.5, 0.85, "x");
    b.box("carbon", V(x, 1.4, RACK_Z - 10), [5, 2.8, 2.2], false);
  }
  // column connections to the rack
  const toRack = (x: number, z: number, r: number, y: number, rackY: number, rad = 0.35) => {
    const out = x + r + 1.2;
    b.pipe("pipe", [V(x + r, y, z), V(out, y, z), V(out, rackY + 0.6, z), V(out, rackY + 0.6, RACK_Z - 4.2)], rad, 1, 8);
  };
  toRack(0, -45, 3.4, 30, 14);
  toRack(0, -45, 3.4, 12, 10);
  toRack(18, -50, 5.2, 20, 14, 0.5);
  toRack(-12, -38, 1.4, 14, 6);
  toRack(-8, -55, 1.2, 10, 10);

  // ---------- fluid catalytic cracking unit ----------
  b.next();
  b.frame(60, -50, 26, 22, 48, 6);
  b.column(55, -50, 62, 2.2, 10);
  b.vCylinder("insul", 67, -46, 0, 34, 6, { rings: [0.5], verticals: 4, segments: 40 });
  b.head("insul", V(67, 34, -46), 6, [0, 1, 0], 0.5);
  b.platform(67, -46, 34 * 0.6, 6, 1.4, 6);
  b.column(42, -32, 44, 3, 7);
  b.stack(80, -64, 85, 3);
  b.pipe("pipe", [V(57.2, 52, -50), V(61, 52, -50), V(61, 36, -46)], 0.9, 2, 8);
  toRack(42, -32, 3, 26, 14, 0.5);

  // ---------- hydrotreaters (south of the rack) ----------
  b.next();
  for (const [x, z, h, r] of [
    [8, 14, 30, 2],
    [18, 24, 26, 1.8],
    [46, 18, 36, 2.6],
    [56, 8, 22, 1.5],
  ]) {
    b.column(x, z, h, r, 7);
    b.pipe("pipe", [V(x, h * 0.6, z - r), V(x, h * 0.6, z - r - 1.5), V(x, 10.6, z - r - 1.5), V(x, 10.6, RACK_Z + 4.4)], 0.35, 1, 8);
  }
  for (const x of [66, 72]) {
    b.vCylinder("steel", x, 22, 1.5, 16, 2.6, { rings: [0.5], verticals: 4, segments: 32 });
    b.head("steel", V(x, 17.5, 22), 2.6, [0, 1, 0], 0.5);
    b.head("steel", V(x, 1.5, 22), 2.6, [0, -1, 0], 0.4);
  }
  b.frame(35, 30, 18, 12, 24, 3);

  // ---------- utilities: cooling towers ----------
  b.next();
  b.coolingTower(140, -72, 7);
  b.coolingTower(140, -96, 7);
  b.rack([V(98, 0, -84), V(150, 0, -84)], 4, [5], 2);

  // ---------- flares ----------
  b.next();
  for (const f of COMPLEX_FLARES) {
    const r = f.size * 0.3;
    b.vCylinder("carbon", f.tip.x, f.tip.z, 0, 4, r + 1.2, { verticals: 4, segments: 24 });
    b.vCylinder("steel", f.tip.x, f.tip.z, 4, f.tip.y - 5, r, { rings: [0.33, 0.66], verticals: 2, segments: 24 });
    b.vCylinder("band", f.tip.x, f.tip.z, f.tip.y - 1, 1, r + 0.3, { verticals: 0, segments: 24 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      for (const k of [0.45, 0.8]) {
        b.pipe("rail", [V(f.tip.x, f.tip.y * k, f.tip.z), V(f.tip.x + Math.cos(a) * f.tip.y * 0.35, 0.2, f.tip.z + Math.sin(a) * f.tip.y * 0.35)], 0.06, 0, 5);
      }
    }
    b.light(V(f.tip.x + r + 0.4, f.tip.y * 0.5, f.tip.z));
  }
  b.pipe("accent", [V(150, 14.6, RACK_Z), V(165, 14.6, RACK_Z), V(165, 14.6, -120), V(173.4, 14.6, -120)], 0.9, 2, 8);

  // ---------- buildings: control building and admin ----------
  b.next();
  const building = (c: THREE.Vector3, size: [number, number, number], windows: number) => {
    b.box("cladding", c.clone().setY(size[1] / 2), size, true);
    b.box("roof", V(c.x, size[1] + 0.3, c.z), [size[0] + 1.6, 0.6, size[2] + 1.6], true);
    for (let i = 0; i < windows; i++) {
      const x = c.x - size[0] / 2 + (size[0] / windows) * (i + 0.5);
      b.box("glass", V(x, size[1] * 0.55, c.z + size[2] / 2 + 0.05), [size[0] / windows - 1.4, size[1] * 0.35, 0.1], false);
    }
  };
  building(V(130, 0, 75), [40, 12, 22], 8);
  building(V(72, 0, 98), [30, 8, 16], 6);

  // ---------- truck loading gantry ----------
  b.next();
  const gx = COMPLEX_GANTRY.x;
  const gz = COMPLEX_GANTRY.z;
  b.frame(gx, gz, 40, 18, 9, 1);
  b.box("roof", V(gx, 9.6, gz), [44, 0.8, 22], true);
  for (let i = 0; i < 4; i++) {
    const x = gx - 15 + i * 10;
    b.pipe("accent", [V(x, 9, gz - 6), V(x, 6, gz - 6), V(x + 2.5, 4.4, gz - 6)], 0.18, 0.6, 8);
    b.light(V(x, 8.6, gz));
  }
  b.rack([V(gx, 0, gz - 11), V(gx, 0, 50)], 4, [6], 2);
  // gate posts
  for (const x of [12, 28]) b.box("wall", V(x, 2, 145), [1.2, 4, 1.2], true);

  // ---------- lamp posts along the roads ----------
  b.next();
  for (let x = -170; x <= 185; x += 30) {
    for (const z of [44, -129]) {
      b.vCylinder("carbon", x, z, 0, 12, 0.18, { verticals: 1, segments: 8 });
      b.light(V(x, 12.3, z));
    }
  }

  return b.build();
}
