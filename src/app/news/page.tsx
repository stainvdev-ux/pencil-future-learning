import type { Metadata } from "next";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import Block from "@/components/pages/Block";
import { news } from "@/content/site";

export const metadata: Metadata = { title: "News & Insights", description: news.intro };

export default function NewsPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={news.headline} intro={news.intro} tone="paper" />
        <Block title="Latest" tone="sand" intro="No announcements have been published yet. Dated updates will appear here as they are confirmed." />
      </main>
    </PageTransition>
  );
}
