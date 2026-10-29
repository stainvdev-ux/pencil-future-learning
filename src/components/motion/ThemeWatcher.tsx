"use client";

import { useGSAP } from "@/lib/gsap";
import { ScrollTrigger } from "@/lib/gsap";

// The header takes the light or dark theme of whichever section sits under it.
export default function ThemeWatcher() {
  useGSAP(() => {
    document.querySelectorAll<HTMLElement>("[data-theme]").forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 64px",
        end: "bottom 64px",
        onToggle: (self) => {
          if (self.isActive) document.documentElement.dataset.scene = section.dataset.theme;
        },
      });
    });
  });
  return null;
}
