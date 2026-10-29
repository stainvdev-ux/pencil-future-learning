"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, sectionEntrances } from "@/lib/motion";
import { PROGRAM_NOTE, schools, schoolsIntro } from "@/content/site";
import SchoolDrawing from "@/components/home/illustrations";

// Five schools on a horizontal track: the section pins and the track slides
// sideways, each school's pencil drawing sketching itself as its panel arrives.
export default function Schools() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      sectionEntrances(el);
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        if (prefersReducedMotion()) return;
        const track = el.querySelector<HTMLElement>(".schools-track")!;
        const distance = () => track.scrollWidth - window.innerWidth;
        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: el.querySelector(".schools-stage"),
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        el.querySelectorAll<HTMLElement>(".school-panel").forEach((panel) => {
          gsap.from(panel.querySelectorAll("[data-sketch]"), {
            drawSVG: "0%",
            ease: "none",
            stagger: 0.04,
            scrollTrigger: { trigger: panel, containerAnimation: slide, start: "left 85%", end: "left 15%", scrub: true },
          });
          gsap.from(panel.querySelectorAll(".school-copy > *"), {
            x: 80,
            autoAlpha: 0,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: { trigger: panel, containerAnimation: slide, start: "left 80%", end: "left 35%", scrub: true },
          });
        });
      });
      mm.add("(max-width: 899px)", () => {
        if (prefersReducedMotion()) return;
        el.querySelectorAll<HTMLElement>(".school-panel").forEach((panel) => {
          gsap.from(panel.querySelectorAll("[data-sketch]"), {
            drawSVG: "0%",
            duration: 1.6,
            ease: "power2.inOut",
            stagger: 0.03,
            scrollTrigger: { trigger: panel, start: "top 75%", once: true },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="schools" id="schools" data-theme="light">
      <div className="schools-intro">
        <h2 data-split>{schoolsIntro.headline}</h2>
        <div className="schools-intro-body" data-rise>
          <p>{schoolsIntro.body}</p>
          <Link href="/programs" className="button is-primary">
            Explore Programs
          </Link>
        </div>
      </div>
      <div className="schools-stage">
        <div className="schools-track">
          {schools.map((s) => (
            <article key={s.id} className={`school-panel is-${s.id}`} aria-labelledby={`school-${s.id}`}>
              <SchoolDrawing id={s.id} />
              <div className="school-copy">
                <h3 id={`school-${s.id}`}>{s.name}</h3>
                <p>{s.intro}</p>
                <h4>Proposed programs</h4>
                <ul>
                  {s.programs.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <small>{PROGRAM_NOTE}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
