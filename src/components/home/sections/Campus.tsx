"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, Draggable, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, sectionEntrances } from "@/lib/motion";
import { campus } from "@/content/site";

const PRINTS = [
  { src: "/media/campus/campus-dusk.webp", w: 862, h: 436, alt: "Concept visualisation of the planned Pencil campus building at dusk", cls: "is-a" },
  { src: "/media/campus/plant-gate-day.webp", w: 742, h: 452, alt: "Concept visualisation of the planned miniature process plant behind the campus gate", cls: "is-b" },
  { src: "/media/campus/corridor.webp", w: 342, h: 206, alt: "Concept visualisation of a covered walkway between classrooms and labs", cls: "is-c" },
  { src: "/media/campus/lounge.webp", w: 346, h: 208, alt: "Concept visualisation of a student lounge", cls: "is-d" },
];

// Campus: concept renders dropped like prints onto the headline. Drag them aside to read it.
export default function Campus() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      sectionEntrances(el);
      const prints = gsap.utils.toArray<HTMLElement>(".print", el);
      if (!prefersReducedMotion()) {
        gsap.from(prints, {
          yPercent: -60,
          y: -200,
          rotation: (i) => (i % 2 ? 24 : -22),
          autoAlpha: 0,
          duration: 1.3,
          ease: "back.out(1.2)",
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 55%", once: true },
        });
      }
      let z = 10;
      Draggable.create(prints, {
        type: "x,y",
        bounds: el,
        inertia: true,
        zIndexBoost: false,
        onPress() {
          z += 1;
          gsap.set(this.target, { zIndex: z });
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="campus" id="campus" data-theme="dark">
      <h2 className="campus-title" data-split>
        A Place
        <br />
        to Explore.
      </h2>
      {PRINTS.map((p) => (
        <figure key={p.src} className={`print ${p.cls}`} data-cursor="Drag">
          <Image src={p.src} width={p.w} height={p.h} alt={p.alt} sizes="(max-width: 900px) 60vw, 30vw" draggable={false} />
        </figure>
      ))}
      <div className="campus-copy" data-rise>
        <p>{campus.intro}</p>
        <p>{campus.spaces}</p>
        <small>Concept visualisations. These facilities are planned and are not yet operational.</small>
        <Link href="/campus" className="text-link">
          Campus &amp; Facilities
        </Link>
      </div>
    </section>
  );
}
