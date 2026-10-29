"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { playIntro } from "@/lib/store";

// The pencil tip draws one line across the sheet while the count runs, then
// the sheet lifts and the page begins.
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      document.documentElement.classList.add("is-loading");
      const done = () => {
        document.documentElement.classList.remove("is-loading");
        playIntro();
      };
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 0 });
        done();
        return;
      }
      const count = { v: 0 };
      const num = el.querySelector(".preloader-count")!;
      gsap
        .timeline({ delay: 0.2 })
        .to(count, {
          v: 100,
          duration: 1.8,
          ease: "power2.inOut",
          onUpdate: () => {
            num.textContent = String(Math.round(count.v));
          },
        })
        .fromTo(".preloader-line", { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "power2.inOut" }, "<")
        .fromTo(".preloader-tip", { left: "0%" }, { left: "100%", duration: 1.8, ease: "power2.inOut" }, "<")
        .to(".preloader-inner", { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.in" })
        .to(el, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.1")
        .add(done, "-=0.7")
        .set(el, { display: "none" });
      return () => document.documentElement.classList.remove("is-loading");
    },
    { scope: root },
  );

  return (
    <div ref={root} className="preloader" aria-hidden="true">
      <div className="preloader-inner">
        <div className="preloader-logo" />
        <div className="preloader-track">
          <span className="preloader-line" />
          <span className="preloader-tip" />
        </div>
        <span className="preloader-count">0</span>
      </div>
    </div>
  );
}
