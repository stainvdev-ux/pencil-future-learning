import type { Metadata } from "next";
import { Suspense } from "react";
import PageTransition from "@/components/motion/PageTransition";
import PageHero from "@/components/pages/PageHero";
import ContactForm from "@/components/pages/ContactForm";
import { contact } from "@/content/site";

export const metadata: Metadata = { title: "Contact", description: contact.body };

export default function ContactPage() {
  return (
    <PageTransition>
      <main>
        <PageHero title={contact.headline} intro={contact.body} tone="black">
          <p>{contact.place}</p>
          <p>{contact.tbc}</p>
        </PageHero>
        <section className="contact" data-theme="light" aria-labelledby="enquire-title">
          <h2 id="enquire-title">Enquire Now</h2>
          <Suspense>
            <ContactForm />
          </Suspense>
        </section>
      </main>
    </PageTransition>
  );
}
