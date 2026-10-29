import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import Experience from "@/components/home/sections/Experience";
import Block from "@/components/pages/Block";
import { experience } from "@/content/site";

export const metadata: Metadata = { title: "Experiential Learning", description: experience.intro };

export default function ExperientialLearningPage() {
  return (
    <PageTransition>
      <main className="has-scene-top">
        <Experience />
        <Block title="Proposed training elements" tone="indigo" intro={experience.elements} />
        <Block title="Learning themes" tone="sand" items={experience.themes} note={`${experience.note} These facilities are planned and are not yet operational.`} />
      </main>
    </PageTransition>
  );
}
