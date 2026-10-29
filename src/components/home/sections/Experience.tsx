"use client";

import { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { createSceneState } from "@/components/three/refinery/state";
import { miniPlant as spec } from "@/components/three/refinery/specs";
import { experience } from "@/content/site";

const RefineryCanvas = dynamic(() => import("@/components/three/refinery/RefineryCanvas"), { ssr: false });

// Beyond the Classroom: Pencil's planned training plant, drawn as a site plan,
// built up from the drawing, then lit at dusk with each piece of equipment named.
export default function Experience() {
  const root = useRef<HTMLElement>(null);
  const state = useMemo(() => createSceneState(), []);
  const near = useInView(root, "100% 0px");
  const visible = useInView(root);

  useGSAP(
    () => {
      const S = state;
      const last = spec.cameraKeys.length - 1;
      if (prefersReducedMotion()) {
        Object.assign(S, { draw: 1, reveal: 1, real: 1, dusk: 0.6, cam: last, labels: 1 });
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=500%", scrub: 1, pin: true },
      });
      tl.to(S, { draw: 1, duration: 0.26 }, 0)
        .to(S, { cam: 1, duration: 0.26, ease: "power1.inOut" }, 0.2)
        .to(S, { real: 1, duration: 0.18 }, 0.32)
        .to(S, { reveal: 1, duration: 0.3, ease: "power1.inOut" }, 0.36)
        .to(S, { cam: 2, duration: 0.24, ease: "power1.inOut" }, 0.5)
        .to(S, { dusk: 1, duration: 0.22 }, 0.68)
        .to(S, { cam: last, duration: 0.24, ease: "power1.inOut" }, 0.76)
        .to(S, { labels: 1, duration: 0.14 }, 0.84);

      gsap.utils.toArray<HTMLElement>(".experience-caption", root.current).forEach((el) => {
        const inAt = Number(el.dataset.in);
        const outAt = el.dataset.out ? Number(el.dataset.out) : null;
        if (inAt > 0) tl.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, inAt);
        if (outAt !== null) tl.to(el, { autoAlpha: 0, y: -32, duration: 0.05, ease: "power2.in" }, outAt);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="experience" id="experience" aria-label={experience.headline}>
      <div className="experience-canvas" aria-hidden="true">
        {near && <RefineryCanvas spec={spec} state={state} active={visible} />}
      </div>

      <div className="experience-caption is-panel" data-in="0" data-out="0.3">
        <h2>{experience.headline}</h2>
        <p>{experience.intro}</p>
      </div>
      <div className="experience-caption is-panel" data-in="0.34" data-out="0.66">
        <p className="statement">Proposed training elements</p>
        <p>{experience.elements}</p>
      </div>
      <div className="experience-caption is-panel is-dark" data-in="0.72">
        <p className="statement">Learning themes</p>
        <ul>
          {experience.themes.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <small>Planned facility. {experience.note}</small>
      </div>
    </section>
  );
}
