"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, sectionEntrances } from "@/lib/motion";
import { PROGRAM_NOTE, schools } from "@/content/site";
import SchoolDrawing from "@/components/home/illustrations";
import PencilLine from "@/components/motion/PencilLine";

const TONES = ["indigo", "paper", "plum", "sand", "black"] as const;

// One full section per school; each drawing sketches itself as you scroll past it.
export default function SchoolSections() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      sectionEntrances(el);
      if (prefersReducedMotion()) return;
      el.querySelectorAll<HTMLElement>(".school-section").forEach((section) => {
        gsap.from(section.querySelectorAll("[data-sketch]"), {
          drawSVG: "0%",
          ease: "none",
          stagger: 0.04,
          scrollTrigger: { trigger: section, start: "top 80%", end: "center 45%", scrub: 0.6 },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      {schools.map((s, i) => {
        const tone = TONES[i];
        const dark = tone === "indigo" || tone === "plum" || tone === "black";
        return (
          <section key={s.id} id={s.id} className={`school-section is-${tone}`} data-theme={dark ? "dark" : "light"}>
            <SchoolDrawing id={s.id} />
            <div>
              <h2 data-split>{s.name}</h2>
              <p className="block-intro" data-rise>
                <span>{s.intro}</span>
              </p>
              <h3>Proposed programs</h3>
              <ul data-rise>
                {s.programs.map((p) => (
                  <li key={p}>
                    <Link href={`/programs?school=${s.id}`}>{p}</Link>
                    <PencilLine />
                  </li>
                ))}
              </ul>
              <small>{PROGRAM_NOTE}</small>
            </div>
          </section>
        );
      })}
    </div>
  );
}
