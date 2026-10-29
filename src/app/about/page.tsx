import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import Block from "@/components/pages/Block";
import Statements from "@/components/pages/Statements";
import { about } from "@/content/site";

export const metadata: Metadata = { title: "About", description: about.intro };

export default function AboutPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={about.headline} intro={about.intro} tone="plum">
          <p>{about.ecosystem}</p>
        </PageHero>
        <Statements
          items={[
            { label: "Vision", text: about.vision },
            { label: "Mission", text: about.mission },
          ]}
        />
        <Block title="Values" tone="indigo" items={about.values} />
        <Block title="Our approach" tone="sand">
          <p className="block-stairs">
            {about.approach.map((line, i) => (
              <span key={line} style={{ paddingLeft: `${i * 5}vw` }}>
                {line}
              </span>
            ))}
          </p>
        </Block>
      </main>
    </PageTransition>
  );
}
