"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lenisRef, onIntro, scrollState } from "@/lib/store";

// Lenis smooth scrolling for every page, driving ScrollTrigger. Lives in the
// root layout, so it persists across navigations and resets on each route.
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.085, autoRaf: false });
    lenisRef.current = lenis;

    lenis.on("scroll", (l: Lenis) => {
      scrollState.velocity = l.velocity;
      ScrollTrigger.update();
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // The homepage preloader marks the document while it runs: hold scrolling until it lifts.
    let off = () => {};
    if (document.documentElement.classList.contains("is-loading")) {
      lenis.stop();
      off = onIntro(() => lenis.start());
    }

    return () => {
      off();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // A new page starts at the top, with triggers measured against its own layout.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
