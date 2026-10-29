import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import Block from "@/components/pages/Block";
import { industry } from "@/content/site";

export const metadata: Metadata = { title: "Industry Connect", description: industry.intro };

export default function IndustryConnectPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={industry.headline} intro={industry.intro} tone="indigo" />
        <Block title="Proposed activities" tone="paper" items={industry.activities} />
        <Block title="Proposed ecosystem collaborators" tone="plum" intro={industry.collaborators} note={industry.note} />
      </main>
    </PageTransition>
  );
}
