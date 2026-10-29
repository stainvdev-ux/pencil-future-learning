import type { School } from "@/content/site";

// Pencil line drawings, one per school. Every stroke carries data-sketch so the
// Schools section can draw it in with DrawSVG as its panel slides into view.

const P = (d: string) => <path data-sketch d={d} />;

function Engineering() {
  return (
    <>
      {P("M20 205 H170 M20 245 H170")}
      <rect data-sketch x="170" y="190" width="14" height="70" />
      <circle data-sketch cx="230" cy="225" r="34" />
      <rect data-sketch x="276" y="190" width="14" height="70" />
      {P("M290 205 H460 M290 245 H460")}
      {P("M230 191 V142")}
      <ellipse data-sketch cx="230" cy="134" rx="44" ry="10" />
      {P("M186 134 H274")}
      {P("M100 205 V245 M108 205 V245")}
      {P("M380 205 V172")}
      <circle data-sketch cx="380" cy="150" r="22" />
      {P("M380 150 L393 137")}
      {P("M20 300 H460 M110 245 V300 M410 245 V300")}
    </>
  );
}

function Construction() {
  return (
    <>
      {P("M20 320 H460")}
      {P("M80 320 V140 M150 320 V140 M220 320 V140 M290 320 V140")}
      {P("M80 260 H290 M80 200 H290 M80 140 H290")}
      {P("M80 320 L150 260 M220 260 L290 200 M150 200 L220 140")}
      {P("M380 320 V60 M396 320 V60")}
      {P("M380 300 L396 280 L380 260 L396 240 L380 220 L396 200 L380 180 L396 160 L380 140 L396 120 L380 100 L396 80")}
      {P("M300 60 H470 M380 60 L388 36 L396 60 M388 36 L300 60 M388 36 L470 60")}
      {P("M330 60 V128 M324 128 H336 V136 A6 6 0 0 1 324 136")}
      {P("M300 150 H360 M330 142 V150")}
    </>
  );
}

function Ai() {
  return (
    <>
      {P("M150 320 H310")}
      <rect data-sketch x="195" y="290" width="70" height="30" />
      <circle data-sketch cx="230" cy="280" r="16" />
      {P("M222 266 L180 172 M238 268 L196 168")}
      <circle data-sketch cx="186" cy="160" r="14" />
      {P("M198 152 L300 112 M190 138 L294 98")}
      <circle data-sketch cx="304" cy="104" r="10" />
      {P("M312 98 L336 86 L344 96 M312 112 L338 118 L346 108")}
      {[
        [60, 80],
        [60, 140],
        [60, 200],
        [118, 110],
        [118, 170],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} data-sketch cx={x} cy={y} r="8" />
      ))}
      {P("M68 80 L110 110 M68 80 L110 170 M68 140 L110 110 M68 140 L110 170 M68 200 L110 110 M68 200 L110 170")}
      {P("M126 110 L176 156 M126 170 L174 162")}
    </>
  );
}

function Business() {
  return (
    <>
      {P("M20 330 H460")}
      <rect data-sketch x="40" y="290" width="90" height="40" />
      <rect data-sketch x="130" y="290" width="90" height="40" />
      <rect data-sketch x="85" y="250" width="90" height="40" />
      {P("M58 290 V330 M76 290 V330 M94 290 V330 M112 290 V330 M148 290 V330 M166 290 V330 M184 290 V330 M202 290 V330 M103 250 V290 M121 250 V290 M139 250 V290 M157 250 V290")}
      {[
        [280, 90],
        [380, 60],
        [440, 150],
        [330, 200],
        [260, 250],
        [420, 250],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} data-sketch cx={x} cy={y} r="7" />
      ))}
      {P("M287 88 L373 62 M386 64 L435 144 M434 155 L337 197 M323 196 L285 96 M326 206 L265 245 M336 205 L414 246 M440 157 L422 243")}
    </>
  );
}

function Professional() {
  return (
    <>
      {P("M40 320 H120 V270 H200 V220 H280 V170 H360 V120 H440")}
      {P("M420 120 V50 M420 50 L462 62 L420 74")}
      {P("M80 120 L200 60 M88 134 L208 74 M200 60 L224 60 L208 74 M80 120 L70 130 L88 134")}
      {P("M70 200 H160 A10 10 0 0 1 170 210 V240 A10 10 0 0 1 160 250 H100 L86 264 V250 H70 A10 10 0 0 1 60 240 V210 A10 10 0 0 1 70 200 Z")}
      {P("M78 218 H150 M78 232 H128")}
    </>
  );
}

const DRAWINGS: Record<School["id"], () => React.JSX.Element> = {
  engineering: Engineering,
  construction: Construction,
  ai: Ai,
  business: Business,
  professional: Professional,
};

export default function SchoolDrawing({ id }: { id: School["id"] }) {
  const Drawing = DRAWINGS[id];
  return (
    <svg className="school-drawing" viewBox="0 0 480 360" aria-hidden="true">
      <Drawing />
    </svg>
  );
}
