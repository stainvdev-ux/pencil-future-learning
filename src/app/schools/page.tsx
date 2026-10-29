import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import SchoolSections from "@/components/pages/SchoolSections";
import { schoolsIntro } from "@/content/site";

export const metadata: Metadata = { title: "Our Schools", description: schoolsIntro.body };

export default function SchoolsPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={schoolsIntro.headline} intro={schoolsIntro.body} tone="black" />
        <SchoolSections />
      </main>
    </PageTransition>
  );
}
