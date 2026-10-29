import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import Admissions from "@/components/home/sections/Admissions";
import { admissions } from "@/content/site";

export const metadata: Metadata = { title: "Admissions", description: admissions.intro };

export default function AdmissionsPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={admissions.headline} intro={admissions.intro} tone="indigo" />
        <Admissions withHead={false} />
      </main>
    </PageTransition>
  );
}
