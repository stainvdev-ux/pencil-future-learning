import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import Block from "@/components/pages/Block";
import { careers } from "@/content/site";

export const metadata: Metadata = { title: "Career Development", description: careers.intro };

export default function CareersPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={careers.headline} intro={careers.intro} tone="plum" />
        <Block title="Proposed services" tone="paper" items={careers.services} note={careers.note} />
      </main>
    </PageTransition>
  );
}
