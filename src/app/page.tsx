import Journey from "@/components/home/Journey";
import Approach from "@/components/home/sections/Approach";
import Schools from "@/components/home/sections/Schools";
import Experience from "@/components/home/sections/Experience";
import Careers from "@/components/home/sections/Careers";
import Campus from "@/components/home/sections/Campus";
import Admissions from "@/components/home/sections/Admissions";
import Closing from "@/components/home/sections/Closing";
import Preloader from "@/components/motion/Preloader";
import PageTransition from "@/components/motion/PageTransition";

export default function Home() {
  return (
    <>
      <Preloader />
      <PageTransition>
        <main>
          <Journey />
          <Approach />
          <Schools />
          <Experience />
          <Careers />
          <Campus />
          <Admissions />
          <Closing />
        </main>
      </PageTransition>
    </>
  );
}
