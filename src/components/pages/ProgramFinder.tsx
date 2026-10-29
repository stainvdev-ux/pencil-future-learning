"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flip, gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { programs, PROGRAM_NOTE, schools, type School } from "@/content/site";

type Filter = School["id"] | "all";

const ALL = schools.flatMap((s) => s.programs.map((p) => ({ name: p, school: s })));

// Find your direction: pick a school and its proposed programs come forward;
// the list rearranges with Flip so you can follow what moved.
export default function ProgramFinder() {
  const params = useSearchParams();
  const initial = (schools.some((s) => s.id === params.get("school")) ? params.get("school") : "all") as Filter;
  const [filter, setFilter] = useState<Filter>(initial);
  const list = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const choose = (f: Filter) => {
    if (list.current && !prefersReducedMotion()) flipState.current = Flip.getState(list.current.children);
    setFilter(f);
  };

  useLayoutEffect(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, {
      duration: 0.6,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.015,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.03 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.25 }),
    });
    flipState.current = null;
  }, [filter]);

  const shown = ALL.filter((p) => filter === "all" || p.school.id === filter);

  return (
    <section className="finder" data-theme="light" aria-label="Proposed programs">
      <div className="finder-filters" role="group" aria-label="Filter by school">
        <button type="button" aria-pressed={filter === "all"} onClick={() => choose("all")}>
          All schools
        </button>
        {schools.map((s) => (
          <button key={s.id} type="button" aria-pressed={filter === s.id} onClick={() => choose(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <p className="finder-count" aria-live="polite">
        {shown.length} proposed programs
      </p>
      <ul ref={list} className="finder-list">
        {shown.map((p) => (
          <li key={p.name} data-flip-id={p.name}>
            <span className="finder-name">{p.name}</span>
            <span className="finder-school">{p.school.name}</span>
            <Link href={`/contact?interest=${encodeURIComponent(p.name)}`} className="finder-link">
              {programs.cta}
            </Link>
          </li>
        ))}
      </ul>
      <p className="finder-note">
        {programs.disclaimer} {PROGRAM_NOTE}
      </p>
    </section>
  );
}
