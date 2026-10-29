"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@/lib/gsap";
import { sectionEntrances } from "@/lib/motion";
import { admissions } from "@/content/site";

// Admissions: five steps as a strip of panels, dark to light; one is open at a time.
export default function Admissions({ withHead = true }: { withHead?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);
  useGSAP(() => sectionEntrances(root.current!), { scope: root });

  return (
    <section ref={root} className="admissions" id="admissions" data-theme="light">
      {withHead ? (
        <div className="admissions-head">
          <h2 data-split>{admissions.headline}</h2>
          <p data-rise>
            <span>{admissions.intro}</span>
          </p>
        </div>
      ) : (
        <h2 className="admissions-steps-title" data-split>
          Proposed admissions steps
        </h2>
      )}

      <ol className="steps" data-rise>
        {admissions.steps.map((step, i) => (
          <li key={step} className={`step is-${i}${open === i ? " is-open" : ""}`}>
            <button
              type="button"
              aria-expanded={open === i}
              onClick={() => setOpen(i)}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
            >
              <span className="step-name">{step}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="admissions-foot">
        <dl className="faq" data-rise>
          {admissions.faq.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
        <Link href="/contact" className="button is-primary is-large">
          {admissions.cta}
        </Link>
      </div>
    </section>
  );
}
