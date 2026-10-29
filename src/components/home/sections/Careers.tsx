"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import { sectionEntrances } from "@/lib/motion";
import { careers, industry } from "@/content/site";
import PencilLine from "@/components/motion/PencilLine";

// Industry Connect and Career Development: the heading holds while the two lists pass beside it.
export default function Careers() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => sectionEntrances(root.current!), { scope: root });

  const blocks = [
    { title: "Industry Connect", lead: industry.headline, intro: industry.intro, label: "Proposed activities", items: industry.activities, note: industry.note },
    { title: "Career Development", lead: null, intro: careers.intro, label: "Proposed services", items: careers.services, note: careers.note },
  ];

  return (
    <section ref={root} className="careers" id="careers" data-theme="dark">
      <div className="careers-pin">
        <h2 data-split>{careers.headline}</h2>
      </div>
      <div className="careers-rows">
        {blocks.map((b) => (
          <article key={b.title} className="careers-block">
            <h3 data-split>{b.title}</h3>
            <p className="careers-intro" data-rise>
              {b.lead && <strong>{b.lead} </strong>}
              <span>{b.intro}</span>
            </p>
            <h4>{b.label}</h4>
            <ul data-rise>
              {b.items.map((item) => (
                <li key={item}>
                  {item}
                  <PencilLine />
                </li>
              ))}
            </ul>
            <small>{b.note}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
