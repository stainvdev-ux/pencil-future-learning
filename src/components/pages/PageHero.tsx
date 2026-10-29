"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

type Tone = "indigo" | "plum" | "orange" | "black" | "paper";

// The opening of every inner page: the page's headline from the copy, set
// large on a field of brand colour, with a pencil line drawn under it as it arrives.
export default function PageHero({
  title,
  intro,
  tone = "indigo",
  children,
}: {
  title: string;
  intro: string;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const el = root.current!;
      const split = SplitText.create(el.querySelector("h1")!, { type: "lines", mask: "lines" });
      gsap
        .timeline({ delay: 0.25 })
        .from(split.lines, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.1 })
        .from(el.querySelector(".page-hero-line path"), { drawSVG: "0%", duration: 1.1, ease: "power2.inOut" }, 0.35)
        .from(el.querySelectorAll(".page-hero-body > *"), { y: 24, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.5);
    },
    { scope: root },
  );

  const dark = tone !== "orange" && tone !== "paper";
  return (
    <section ref={root} className={`page-hero is-${tone}`} data-theme={dark ? "dark" : "light"}>
      <h1>{title}</h1>
      <svg className="page-hero-line" viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 9 C 180 4, 340 12, 520 8 S 860 4, 998 9" />
      </svg>
      <div className="page-hero-body">
        <p>{intro}</p>
        {children}
      </div>
    </section>
  );
}
