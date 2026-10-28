"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import { refineryState } from "@/components/three/refinery/state";
import { miniPlant as spec } from "@/components/three/refinery/specs";
import SmoothScroll from "@/components/SmoothScroll";
import { playIntro } from "@/lib/store";

const RefineryCanvas = dynamic(() => import("@/components/three/refinery/RefineryCanvas"), { ssr: false });

export default function RefineryLab() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      playIntro(); // no preloader on the lab page: let Lenis scroll straight away
      const S = refineryState;
      const last = spec.cameraKeys.length - 1;

      gsap.to(S, { intro: 0.12, duration: 2.6, ease: "power2.out", delay: 0.4 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".lab-stage", start: "top top", end: "+=500%", scrub: 1, pin: true },
      });
      tl.to(S, { draw: 1, duration: 0.28 }, 0)
        .to(S, { cam: 1, duration: 0.26, ease: "power1.inOut" }, 0.22)
        .to(S, { real: 1, duration: 0.18 }, 0.34)
        .to(S, { reveal: 1, duration: 0.3, ease: "power1.inOut" }, 0.38)
        .to(S, { cam: 2, duration: 0.24, ease: "power1.inOut" }, 0.5)
        .to(S, { dusk: 1, duration: 0.22 }, 0.68)
        .to(S, { cam: last, duration: 0.24, ease: "power1.inOut" }, 0.76)
        .to(S, { labels: 1, duration: 0.14 }, 0.86);

      // captions take turns with the scene's phases
      const caps = gsap.utils.toArray<HTMLElement>(".lab-caption");
      const at = [0, 0.34, 0.7];
      caps.forEach((el, i) => {
        if (i > 0) tl.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05 }, at[i]);
        if (i < caps.length - 1) tl.to(el, { autoAlpha: 0, y: -24, duration: 0.05 }, at[i + 1] - 0.06);
      });

      return () => {
        Object.assign(S, { intro: 0, draw: 0, reveal: 0, real: 0, dusk: 0, cam: 0, labels: 0 });
      };
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <SmoothScroll />
      <section className="lab-stage">
        <div className="lab-canvas">
          <RefineryCanvas spec={spec} />
        </div>
        <div className="lab-caption is-panel">
          <h1>Beyond the Classroom.</h1>
          <p>
            Pencil proposes a miniature industrial learning facility where learners can examine equipment and explore
            engineering concepts in context.
          </p>
        </div>
        <div className="lab-caption is-panel">
          <h2>From the drawing to the plant.</h2>
          <p>
            One process column, one vessel, one storage tank, two heat exchangers, one reactor and a flare
            demonstration concept, with supporting piping and instrumentation.
          </p>
        </div>
        <div className="lab-caption is-panel is-dark">
          <h2>Learn it in context.</h2>
          <p>
            Equipment familiarization; process-flow interpretation; mechanical systems; inspection fundamentals;
            maintenance concepts; and safe industrial practices.
          </p>
          <small>Planned facility. Scope and activities will be finalized through engineering design, safety review and commissioning.</small>
        </div>
      </section>
      <section className="lab-after">
        <p>End of the refinery prototype.</p>
      </section>
    </div>
  );
}
