import type { Metadata } from "next";
import { Suspense } from "react";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import ProgramFinder from "@/components/pages/ProgramFinder";
import { programs } from "@/content/site";

export const metadata: Metadata = { title: "Programs", description: programs.intro };

export default function ProgramsPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={programs.headline} intro={programs.intro} tone="orange" />
        <Suspense>
          <ProgramFinder />
        </Suspense>
      </main>
    </PageTransition>
  );
}
