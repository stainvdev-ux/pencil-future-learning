import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import Block from "@/components/pages/Block";
import CampusGallery from "@/components/pages/CampusGallery";
import { campus, contact } from "@/content/site";

export const metadata: Metadata = { title: "Campus & Facilities", description: campus.intro };

export default function CampusPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={campus.headline} intro={campus.intro} tone="orange" />
        <CampusGallery />
        <Block title="Planned spaces" tone="paper" intro={campus.spaces} note={contact.place} />
      </main>
    </PageTransition>
  );
}
