import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeScroll from "@/components/home/HomeScroll";
import Journey from "@/components/home/Journey";
import Approach from "@/components/home/sections/Approach";
import Schools from "@/components/home/sections/Schools";
import Experience from "@/components/home/sections/Experience";
import Careers from "@/components/home/sections/Careers";
import Campus from "@/components/home/sections/Campus";
import Admissions from "@/components/home/sections/Admissions";
import Closing from "@/components/home/sections/Closing";
import Preloader from "@/components/motion/Preloader";
import Cursor from "@/components/motion/Cursor";
import ThemeWatcher from "@/components/motion/ThemeWatcher";
import "@/components/home/home.css";
import "@/components/home/sections.css";

export default function Home() {
  return (
    <>
      <Preloader />
      <HomeScroll />
      <Cursor />
      <Header />
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
      <Footer />
      <ThemeWatcher />
    </>
  );
}
