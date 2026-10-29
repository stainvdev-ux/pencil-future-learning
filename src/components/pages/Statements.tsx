"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import { sectionEntrances } from "@/lib/motion";

// Vision and mission set side by side as large statements.
export default function Statements({ items }: { items: { label: string; text: string }[] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => sectionEntrances(root.current!), { scope: root });
  return (
    <section ref={root} className="statements" data-theme="light">
      {items.map((s) => (
        <article key={s.label}>
          <h2 data-split>{s.label}</h2>
          <p data-rise>
            <span>{s.text}</span>
          </p>
        </article>
      ))}
    </section>
  );
}
