"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, sectionEntrances } from "@/lib/motion";
import { home } from "@/content/site";

// Learn. Experience. Evolve. Each word lights up in turn as you scroll, then the
// whole band below is the one action: enquire.
export default function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      sectionEntrances(el);
      if (prefersReducedMotion()) return;
      const words = gsap.utils.toArray<HTMLElement>(".closing-word", el);
      gsap
        .timeline({ scrollTrigger: { trigger: el.querySelector(".closing-words"), start: "top 80%", end: "bottom 45%", scrub: 0.8 } })
        .from(words, { yPercent: 40, opacity: 0.08, stagger: 0.5, ease: "power2.out" });
      gsap.from(".enquire-word", {
        yPercent: 100,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: ".enquire", start: "top 85%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="closing" data-theme="dark">
      <p className="closing-words">
        {home.closing.map((w) => (
          <span key={w} className="closing-word">
            {w}
          </span>
        ))}
      </p>
      <p className="closing-line" data-rise>
        <span>{home.closingLine}</span>
      </p>
      <Link href="/contact" className="enquire">
        <span className="enquire-note">Start a Conversation.</span>
        <svg className="enquire-arrow" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M12 36 L36 12 M18 12 H36 V30" />
        </svg>
        <span className="enquire-mask">
          <span className="enquire-word">Enquire</span>
        </span>
      </Link>
    </section>
  );
}
