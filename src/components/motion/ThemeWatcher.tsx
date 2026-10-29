"use client";

import { usePathname } from "next/navigation";
import { useGSAP, ScrollTrigger } from "@/lib/gsap";

// The header takes the light or dark theme of whichever section sits under it.
export default function ThemeWatcher() {
  const pathname = usePathname();
  useGSAP(
    () => {
      document.documentElement.dataset.scene = "light";
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
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );
  return null;
}
