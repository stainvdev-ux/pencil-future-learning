"use client";

import { useRef } from "react";
import Image from "next/image";
import { Draggable, gsap, useGSAP } from "@/lib/gsap";
import { sectionEntrances } from "@/lib/motion";

const RENDERS = [
  { src: "/media/campus/campus-dusk.webp", w: 862, h: 436, caption: "Campus building at dusk" },
  { src: "/media/campus/plant-gate-day.webp", w: 742, h: 452, caption: "Miniature process plant behind the gate" },
  { src: "/media/campus/campus-day.webp", w: 764, h: 452, caption: "Campus building by day" },
  { src: "/media/campus/plant-gate-dusk.webp", w: 646, h: 494, caption: "Process plant at dusk" },
  { src: "/media/campus/corridor.webp", w: 342, h: 206, caption: "Covered walkway to classrooms and labs" },
  { src: "/media/campus/process-lab.webp", w: 274, h: 142, caption: "Process lab" },
  { src: "/media/campus/lounge.webp", w: 346, h: 208, caption: "Student lounge" },
];

// A strip of concept renders you can drag through, with a little inertia.
export default function CampusGallery() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      sectionEntrances(el);
      const strip = el.querySelector<HTMLElement>(".gallery-strip")!;
      Draggable.create(strip, {
        type: "x",
        bounds: el.querySelector(".gallery-viewport"),
        inertia: true,
        edgeResistance: 0.85,
      });
      gsap.from(strip.children, {
        x: 120,
        autoAlpha: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 70%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="gallery" data-theme="dark" aria-label="Concept visualisations">
      <div className="gallery-viewport" data-cursor="Drag">
        <div className="gallery-strip">
          {RENDERS.map((r) => (
            <figure key={r.src}>
              <Image src={r.src} width={r.w} height={r.h} alt={`Concept visualisation: ${r.caption.toLowerCase()}`} sizes="(max-width: 900px) 80vw, 40vw" draggable={false} />
              <figcaption>{r.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <p className="gallery-note">Concept visualisations. These facilities are planned and are not yet operational.</p>
    </section>
  );
}
