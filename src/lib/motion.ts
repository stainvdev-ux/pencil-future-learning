"use client";

import { gsap, SplitText } from "@/lib/gsap";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The entrance layer for a section. Call inside useGSAP so it is reverted on unmount.
 * - [data-split]   headings rise line by line from behind a mask
 * - [data-rise]    the element's children rise and fade in, staggered
 * - [data-pencil]  SVG strokes draw themselves in, like a pencil underline
 * Content is never hidden by CSS, so it stays readable if scripts fail.
 */
export function sectionEntrances(root: HTMLElement) {
  if (prefersReducedMotion()) return;

  root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.15,
          ease: "expo.out",
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        }),
    });
  });

  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((group) => {
    gsap.from(group.children, {
      y: 28,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.075,
      scrollTrigger: { trigger: group, start: "top 86%", once: true },
    });
  });

  root.querySelectorAll<SVGElement>("[data-pencil]").forEach((stroke) => {
    gsap.from(stroke, {
      drawSVG: "0%",
      duration: 1.1,
      ease: "power2.inOut",
      scrollTrigger: { trigger: stroke.closest("li, p, div") ?? stroke, start: "top 88%", once: true },
    });
  });
}
