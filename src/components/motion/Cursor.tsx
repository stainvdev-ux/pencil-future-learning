"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

// A soft orange cursor that follows with a little lag, grows over anything
// clickable and names the gesture over draggable prints.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = dot.current!;
    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
        shown = true;
      }
      x(e.clientX);
      y(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = e.target as Element;
      const named = target.closest<HTMLElement>("[data-cursor]");
      const hot = target.closest("a, button, summary, [role=button]");
      el.classList.toggle("is-named", !!named);
      el.classList.toggle("is-hot", !named && !!hot);
      if (label.current) label.current.textContent = named?.dataset.cursor ?? "";
    };
    const leave = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.2 });
      shown = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.classList.add("has-cursor");
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  });

  return (
    <div ref={dot} className="cursor" aria-hidden="true">
      <span ref={label} />
    </div>
  );
}
