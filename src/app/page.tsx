import Header from "@/components/Header";
import Journey from "@/components/home/Journey";
import HomeScroll from "@/components/home/HomeScroll";
import "@/components/home/home.css";

export default function Home() {
  return (
    <>
      <HomeScroll />
      <Header />
      <main>
        <Journey />
        <section className="after-journey">
          <p>The rest of the homepage follows here: schools, experiential learning, admissions and enquiry.</p>
        </section>
      </main>
    </>
  );
}
