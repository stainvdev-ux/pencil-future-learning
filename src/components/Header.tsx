"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { lenisRef } from "@/lib/store";
import { nav as LINKS, sitemap } from "@/content/site";

export default function Header() {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const sheet = useRef<HTMLDivElement>(null);

  // close on Escape; hold the page still while the sheet is open
  useEffect(() => {
    if (!open) return;
    lenisRef.current?.stop();
    document.documentElement.classList.add("menu-open");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      lenisRef.current?.start();
      document.documentElement.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useGSAP(
    () => {
      if (!open || !sheet.current) return;
      gsap.from(sheet.current.querySelectorAll("li"), { yPercent: 60, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.04, delay: 0.15 });
    },
    { dependencies: [open], scope: sheet },
  );

  return (
    <header className="site-header" style={{ viewTransitionName: "site-header" }}>
      <Link href="/" className="site-logo" aria-label="Pencil Future Learning City, home">
        <span aria-hidden="true" />
      </Link>
      <nav aria-label="Main">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link href="/contact" className="site-action">
        Enquire Now
      </Link>
      <button type="button" className="menu-button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
        {open ? "Close" : "Menu"}
      </button>
      <div id="site-menu" ref={sheet} className={`menu-sheet${open ? " is-open" : ""}`} hidden={!open}>
        <ul>
          {sitemap.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
