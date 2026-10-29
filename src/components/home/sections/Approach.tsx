"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, sectionEntrances } from "@/lib/motion";
import { about, home } from "@/content/site";
import PencilLine from "@/components/motion/PencilLine";

// About: the approach set as a staircase, each step sliding into place as you scroll.
export default function Approach() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      sectionEntrances(root.current!);
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>(".stair-line", root.current).forEach((line, i) => {
        gsap.fromTo(
          line,
          { xPercent: -14 - i * 4, opacity: 0.12 },
          {
            xPercent: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: line, start: "top 92%", end: "top 48%", scrub: 0.8 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="approach" data-theme="dark" id="about">
      <div className="approach-head">
        <h2 data-split>{about.headline}</h2>
        <p data-rise>
          <span>{about.intro}</span>
        </p>
      </div>
      <div className="approach-body">
        <p className="stairs">
          {about.approach.map((line, i) => (
            <span key={line} className="stair-line" style={{ paddingLeft: `${i * 6}vw` }}>
              {line}
            </span>
          ))}
        </p>
        <div className="approach-pictures" data-rise>
          <figure>
            <Image
              src="/media/campus/plant-gate-dusk.webp"
              width={646}
              height={494}
              sizes="(max-width: 900px) 46vw, 22vw"
              alt="Concept visualisation of the planned miniature process plant at dusk"
            />
          </figure>
          <figure>
            <Image
              src="/media/campus/campus-day.webp"
              width={764}
              height={452}
              sizes="(max-width: 900px) 46vw, 22vw"
              alt="Concept visualisation of the planned campus building by day"
            />
          </figure>
          <figcaption>Concept visualisations of the planned campus.</figcaption>
        </div>
      </div>
      <ul className="highlights" data-rise>
        {home.highlights.map((h) => (
          <li key={h}>
            {h}
            <PencilLine />
          </li>
        ))}
      </ul>
    </section>
  );
}
