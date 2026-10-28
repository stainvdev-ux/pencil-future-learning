import * as THREE from "three";
import { PlantBuilder, V, compose } from "./builder";

// The planned miniature industrial learning facility, from the website copy:
// one process column, one vessel, one storage tank, two heat exchangers,
// one reactor and a flare demonstration concept, with supporting piping.
// Units are metres.

export const LAYOUT = {
  tank: { x: -10, z: -3, r: 3.2, h: 4.4 },
  column: { x: 3, z: -4.5, r: 0.6, skirt: 1.5, h: 12 },
  reactor: { x: 8, z: -3.5, r: 1, y0: 1.4, h: 2.8 },
  vessel: { c: V(-0.5, 1.4, 4.2), len: 4, r: 0.8 },
  exchangers: { x: 7, z: 4.2, ys: [1.1, 2.2], len: 3.6, r: 0.45 },
  flare: { x: 15, z: -9, r: 0.3, h: 15 },
  drum: { c: V(13, 0.9, -5.5), len: 2.5, r: 0.6 },
  control: { c: V(-9, 1.6, 7.5), size: [6.5, 3.2, 4.2] as [number, number, number] },
  plot: { x0: -16, x1: 18, z0: -13, z1: 12 },
};

export const LABELS = [
  { id: "column", name: "Process column", at: V(3, 14.6, -4.5) },
  { id: "tank", name: "Storage tank", at: V(-10, 5.6, -3) },
  { id: "vessel", name: "Vessel", at: V(-0.5, 2.8, 4.2) },
  { id: "exchangers", name: "Two heat exchangers", at: V(7, 3.3, 4.2) },
  { id: "reactor", name: "Reactor", at: V(8, 5.9, -3.5) },
  { id: "flare", name: "Flare demonstration", at: V(15, 16.2, -9) },
];

export const FLARE_TIP = V(15, 15.2, -9);

export const LAMPS: THREE.Vector3[] = [
  V(-15, 5, -12), V(17, 5, -12), V(-15, 5, 11), V(17, 5, 11), V(1, 5, -12), V(1, 5, 11),
];

export function buildPlant() {
  const b = new PlantBuilder();
  const { tank, column, reactor, vessel, exchangers, flare, drum, control, plot } = LAYOUT;

  // --- plot: slab and boundary wall, gate gap at the front ---
  b.box("concrete", V((plot.x0 + plot.x1) / 2, 0.05, (plot.z0 + plot.z1) / 2), [plot.x1 - plot.x0, 0.1, plot.z1 - plot.z0], true);
  const wallH = 1.4;
  const wall = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const rot = Math.atan2(z1 - z0, x1 - x0);
    b.box("wall", V((x0 + x1) / 2, wallH / 2, (z0 + z1) / 2), [len, wallH, 0.25], true, -rot);
  };
  wall(plot.x0, plot.z0, plot.x1, plot.z0);
  wall(plot.x0, plot.z0, plot.x0, plot.z1);
  wall(plot.x1, plot.z0, plot.x1, plot.z1);
  wall(plot.x0, plot.z1, -2, plot.z1);
  wall(3, plot.z1, plot.x1, plot.z1);
  for (const x of [-2, 3]) b.box("wall", V(x, 1.1, plot.z1), [0.6, 2.2, 0.6], true);

  // --- storage tank with roof, top handrail and spiral stair ---
  b.next();
  b.vCylinder("paint", tank.x, tank.z, 0.1, tank.h, tank.r, { rings: [0.33, 0.66], verticals: 6 });
  b.add("paint", new THREE.ConeGeometry(tank.r + 0.05, 0.55, 40, 1), compose([tank.x, 0.1 + tank.h + 0.27, tank.z]));
  b.add("rail", new THREE.TorusGeometry(tank.r, 0.03, 6, 64), compose([tank.x, tank.h + 1.1, tank.z], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    b.add("rail", new THREE.CylinderGeometry(0.025, 0.025, 1, 6), compose([tank.x + Math.cos(a) * tank.r, tank.h + 0.6, tank.z + Math.sin(a) * tank.r]));
  }
  const steps = 22;
  const stairPts: THREE.Vector3[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = Math.PI * 0.15 + t * Math.PI * 1.1;
    const R = tank.r + 0.45;
    const y = 0.25 + t * (tank.h - 0.2);
    const p = V(tank.x + Math.cos(a) * R, y, tank.z + Math.sin(a) * R);
    b.box("carbon", p, [0.8, 0.06, 0.3], false, -a);
    stairPts.push(V(tank.x + Math.cos(a) * (R + 0.42), y + 0.95, tank.z + Math.sin(a) * (R + 0.42)));
  }
  b.pipe("rail", stairPts, 0.025, 0.2);

  // --- pipe rack ---
  b.next();
  for (let x = -6; x <= 10; x += 4) {
    for (const z of [-0.9, 0.9]) b.box("carbon", V(x, 2.3, z), [0.22, 4.6, 0.22]);
    for (const y of [3.1, 4.3]) b.box("carbon", V(x, y, 0), [0.18, 0.18, 2], false);
  }
  for (const z of [-0.9, 0.9]) for (const y of [3.1, 4.3]) b.box("carbon", V(2, y + 0.1, z), [16.2, 0.16, 0.16], false);
  b.pipe("pipe", [V(-6.5, 4.5, -0.5), V(10.5, 4.5, -0.5)], 0.14);
  b.pipe("pipe", [V(-6.5, 4.5, 0.4), V(10.5, 4.5, 0.4)], 0.1);
  b.pipe("pipe", [V(-6.5, 3.3, -0.5), V(10.5, 3.3, -0.5)], 0.12);

  // --- pumps on a skid ---
  b.next();
  for (const z of [3.5, 5.2]) {
    b.box("concrete", V(-5, 0.2, z), [2, 0.3, 1], true);
    b.hCylinder("accent", V(-5.4, 0.7, z), 0.9, 0.28, "x");
    b.hCylinder("steel", V(-4.6, 0.7, z), 0.35, 0.36, "x");
  }

  // --- horizontal pressure vessel on saddles ---
  b.next();
  b.hCylinder("paint", vessel.c, vessel.len, vessel.r, "x");
  b.head("paint", vessel.c.clone().add(V(vessel.len / 2, 0, 0)), vessel.r, [1, 0, 0]);
  b.head("paint", vessel.c.clone().add(V(-vessel.len / 2, 0, 0)), vessel.r, [-1, 0, 0]);
  for (const dx of [-1.2, 1.2]) b.box("concrete", V(vessel.c.x + dx, 0.35, vessel.c.z), [0.4, 0.7, 1.4]);

  // --- process column with skirt, platforms, ladder ---
  b.next();
  b.vCylinder("carbon", column.x, column.z, 0, column.skirt, column.r + 0.05, { verticals: 4 });
  b.vCylinder("steel", column.x, column.z, column.skirt, column.h, column.r, { rings: [0.25, 0.5, 0.75], verticals: 4 });
  b.head("steel", V(column.x, column.skirt + column.h, column.z), column.r, [0, 1, 0], 0.55);
  for (const y of [4, 7.5, 11, 13.5]) b.platform(column.x, column.z, y, column.r, 0.85);
  b.ladder(column.x, column.z, 0.1, 13.8, column.r + 0.55);

  // --- two heat exchangers on a frame ---
  b.next();
  for (const y of exchangers.ys) {
    const c = V(exchangers.x, y, exchangers.z);
    b.hCylinder("steel", c, exchangers.len, exchangers.r, "x");
    b.hCylinder("carbon", c.clone().add(V(-exchangers.len / 2 - 0.25, 0, 0)), 0.5, exchangers.r + 0.1, "x");
    b.head("carbon", c.clone().add(V(-exchangers.len / 2 - 0.5, 0, 0)), exchangers.r + 0.1, [-1, 0, 0], 0.4);
    b.head("steel", c.clone().add(V(exchangers.len / 2, 0, 0)), exchangers.r, [1, 0, 0], 0.45);
  }
  for (const dx of [-1.2, 1.2]) for (const dz of [-0.5, 0.5]) b.box("carbon", V(exchangers.x + dx, 1.4, exchangers.z + dz), [0.15, 2.8, 0.15]);
  b.box("carbon", V(exchangers.x, 1.65, exchangers.z), [2.6, 0.12, 1.15], false);

  // --- reactor on legs with agitator drive ---
  b.next();
  b.vCylinder("paint", reactor.x, reactor.z, reactor.y0, reactor.h, reactor.r, { rings: [0.5], verticals: 4 });
  b.head("paint", V(reactor.x, reactor.y0 + reactor.h, reactor.z), reactor.r, [0, 1, 0], 0.5);
  b.head("paint", V(reactor.x, reactor.y0, reactor.z), reactor.r, [0, -1, 0], 0.5);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.vCylinder("carbon", reactor.x + Math.cos(a) * reactor.r, reactor.z + Math.sin(a) * reactor.r, 0, reactor.y0 + 0.4, 0.07, { verticals: 0 });
  }
  b.vCylinder("accent", reactor.x, reactor.z, reactor.y0 + reactor.h + 0.45, 0.8, 0.28, { verticals: 2 });

  // --- flare demonstration concept with knockout drum and guy wires ---
  b.next();
  b.hCylinder("paint", drum.c, drum.len, drum.r, "z");
  b.head("paint", drum.c.clone().add(V(0, 0, drum.len / 2)), drum.r, [0, 0, 1]);
  b.head("paint", drum.c.clone().add(V(0, 0, -drum.len / 2)), drum.r, [0, 0, -1]);
  b.vCylinder("carbon", flare.x, flare.z, 0, 1.2, flare.r + 0.25, { verticals: 4 });
  b.vCylinder("steel", flare.x, flare.z, 1.2, flare.h - 1.2, flare.r, { rings: [0.5], verticals: 2 });
  b.vCylinder("carbon", flare.x, flare.z, flare.h - 0.2, 0.35, flare.r + 0.08, { verticals: 0 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const top = V(flare.x, flare.h * 0.75, flare.z);
    const ground = V(flare.x + Math.cos(a) * 6, 0.1, flare.z + Math.sin(a) * 6);
    b.pipe("rail", [top, ground], 0.018, 0);
  }

  // --- process piping ---
  b.next();
  b.pipe("pipe", [V(-6.8, 0.7, -3), V(-6, 0.7, -3), V(-6, 0.7, 3.5), V(-5.85, 0.7, 3.5)]);
  b.pipe("pipe", [V(-4.4, 0.7, 3.5), V(-4.4, 3.3, 3.5), V(-4.4, 3.3, 0.3), V(2.2, 3.3, 0.3), V(2.2, 3.3, -4.5), V(2.4, 3.3, -4.5)]);
  b.pipe("pipe", [V(-4.4, 0.7, 5.2), V(-3.6, 0.7, 5.2), V(-3.6, 1.4, 5.2), V(-3.6, 1.4, 4.2), V(-3.25, 1.4, 4.2)]);
  b.pipe("pipe", [V(3, 14.1, -4.5), V(3, 14.8, -4.5), V(4.6, 14.8, -4.5), V(4.6, 4.5, -4.5), V(4.6, 4.5, 0.3), V(4.6, 4.5, 4.2), V(4.6, 2.2, 4.2), V(4.75, 2.2, 4.2)]);
  b.pipe("pipe", [V(2.25, 1.4, 4.2), V(3.6, 1.4, 4.2), V(3.6, 1.1, 4.2), V(4.75, 1.1, 4.2)]);
  b.pipe("pipe", [V(9.1, 1.1, 4.2), V(9.7, 1.1, 4.2), V(9.7, 2.6, 4.2), V(9.7, 2.6, -3.5), V(9, 2.6, -3.5)]);
  b.pipe("accent", [V(8, 5.1, -3.5), V(8, 5.8, -3.5), V(8, 5.8, -5.5), V(13, 5.8, -5.5), V(13, 1.5, -5.5)], 0.16);
  b.pipe("accent", [V(13, 0.9, -6.75), V(13, 0.9, -9), V(14.6, 0.9, -9)], 0.16);

  // --- control room: ribbed cladding, indigo roof, lit windows ---
  b.next();
  b.box("cladding", control.c, control.size, true);
  b.box("roof", V(control.c.x, control.c.y + control.size[1] / 2 + 0.12, control.c.z + 0.3), [control.size[0] + 0.8, 0.24, control.size[2] + 1.4], true);
  for (let i = 0; i < 4; i++) {
    b.box("glass", V(control.c.x - 2.4 + i * 1.6, control.c.y + 0.2, control.c.z + control.size[2] / 2 + 0.02), [1.2, 1.3, 0.04], i === 0);
  }
  for (let i = 0; i < 14; i++) {
    b.box("cladding", V(control.c.x - 3.2 + i * 0.5, control.c.y, control.c.z - control.size[2] / 2 - 0.03), [0.12, control.size[1], 0.06], false);
  }

  // --- lamp posts ---
  b.next();
  for (const p of LAMPS) {
    b.vCylinder("carbon", p.x, p.z, 0, p.y, 0.07, { verticals: 1 });
    b.box("lamp", V(p.x, p.y + 0.05, p.z), [0.5, 0.12, 0.25], false);
  }

  return b.build();
}
