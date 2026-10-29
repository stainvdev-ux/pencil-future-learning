"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { refineryState as S } from "@/components/three/refinery/state";
import { useInView } from "@/lib/useInView";
import { refineryComplex as spec } from "@/components/three/refinery/specs";

const RefineryCanvas = dynamic(() => import("@/components/three/refinery/RefineryCanvas"), { ssr: false });

// The homepage opening: a tanker drives across a pencil-drawn world, the camera
// cranes up to the site plan, and the refinery is built and lit around it.
export default function Journey() {
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root);

  useGSAP(
    () => {
      const last = spec.cameraKeys.length - 1;
      gsap.to(S, { intro: 0.06, duration: 2.4, ease: "power2.out", delay: 0.3 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=900%", scrub: 1, pin: true },
      });
      tl.fromTo(S, { side: 1 }, { side: 0, duration: 0.18, ease: "power1.inOut" }, 0.17)
        .to(S, { truck: 0.84, duration: 0.4, ease: "power1.in" }, 0)
        .to(S, { truck: 1, duration: 0.16, ease: "power2.out" }, 0.4)
        .to(S, { draw: 1, duration: 0.24 }, 0.1)
        .to(S, { cam: 1, duration: 0.18, ease: "power1.inOut" }, 0.4)
        .to(S, { real: 1, duration: 0.14 }, 0.42)
        .to(S, { reveal: 1, duration: 0.26, ease: "power1.inOut" }, 0.44)
        .to(S, { cam: 2, duration: 0.18, ease: "power1.inOut" }, 0.6)
        .to(S, { dusk: 1, duration: 0.18 }, 0.76)
        .to(S, { cam: last, duration: 0.2, ease: "power1.inOut" }, 0.8)
        .to(S, { labels: 1, duration: 0.1 }, 0.9);

      // captions take turns with the scene's chapters
      gsap.utils.toArray<HTMLElement>(".journey-caption").forEach((el) => {
        const inAt = Number(el.dataset.in);
        const outAt = el.dataset.out ? Number(el.dataset.out) : null;
        if (inAt > 0) tl.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" }, inAt);
        if (outAt !== null) tl.to(el, { autoAlpha: 0, y: -32, duration: 0.04, ease: "power2.in" }, outAt);
      });

      // the header switches to light ink once the sky darkens
      tl.eventCallback("onUpdate", () => {
        document.documentElement.dataset.scene = S.dusk > 0.45 ? "dark" : "light";
      });

      return () => {
        Object.assign(S, { intro: 0, draw: 0, reveal: 0, real: 0, dusk: 0, cam: 0, labels: 0, truck: 0, side: 0 });
        delete document.documentElement.dataset.scene;
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="journey" aria-label="The Future Begins Here">
      <div className="journey-canvas" aria-hidden="true">
        <RefineryCanvas spec={spec} active={visible} />
      </div>

      <div className="journey-caption is-hero" data-in="0" data-out="0.13">
        <h1>
          The Future
          <br />
          Begins Here.
        </h1>
        <p>
          A new destination for industry-connected education, emerging technologies and practical learning in Calicut,
          Kerala.
        </p>
        <div className="journey-actions">
          <Link href="/programs" className="button is-primary">
            Explore Programs
          </Link>
          <Link href="/contact" className="button">
            Enquire Now
          </Link>
        </div>
      </div>

      <div className="journey-caption is-panel" data-in="0.2" data-out="0.36">
        <p className="statement">Education should be experienced, not simply studied.</p>
        <p>
          At Pencil, we envision a multidisciplinary learning environment where technical knowledge, technology and
          professional capability meet.
        </p>
      </div>

      <div className="journey-caption is-panel" data-in="0.47" data-out="0.72">
        <h2>Knowledge Meets Industry.</h2>
        <p>
          Our ambition is to build a meaningful exchange between learners, educators and industry professionals through
          practical insight and collaborative experiences.
        </p>
      </div>

      <div className="journey-caption is-panel is-dark" data-in="0.82">
        <h2>Find Your Direction.</h2>
        <p>Programs shown are proposed unless explicitly marked as open for admissions.</p>
        <small>Illustrative industrial scene. It does not depict Pencil facilities.</small>
      </div>
    </section>
  );
}
