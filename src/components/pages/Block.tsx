"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import { sectionEntrances } from "@/lib/motion";
import PencilLine from "@/components/motion/PencilLine";

type Tone = "paper" | "indigo" | "plum" | "black" | "orange" | "sand";

// A content block for inner pages: a heading on the left, the words and an
// optional list on the right, every list item underlined by a pencil stroke.
export default function Block({
  title,
  tone = "paper",
  intro,
  label,
  items,
  note,
  children,
  id,
}: {
  title: string;
  tone?: Tone;
  intro?: string;
  label?: string;
  items?: string[];
  note?: string;
  children?: React.ReactNode;
  id?: string;
}) {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => sectionEntrances(root.current!), { scope: root });
  const dark = tone === "indigo" || tone === "plum" || tone === "black";

  return (
    <section ref={root} id={id} className={`block is-${tone}`} data-theme={dark ? "dark" : "light"}>
      <h2 data-split>{title}</h2>
      <div className="block-body">
        {intro && (
          <p className="block-intro" data-rise>
            <span>{intro}</span>
          </p>
        )}
        {label && <h3>{label}</h3>}
        {items && (
          <ul data-rise>
            {items.map((item) => (
              <li key={item}>
                {item}
                <PencilLine />
              </li>
            ))}
          </ul>
        )}
        {children}
        {note && <small>{note}</small>}
      </div>
    </section>
  );
}
