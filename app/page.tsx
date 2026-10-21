import Sky from "@/components/Sky";
import { SmoothScroll } from "@/components/motion";
import { Cursor, Nav, Preloader } from "@/components/chrome";
import Hero from "@/components/Hero";
import About, { Marquee } from "@/components/About";
import Journey from "@/components/Journey";
import Work from "@/components/Work";
import Ecosystem from "@/components/Ecosystem";
import Principles from "@/components/Principles";
import Play from "@/components/Play";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <SmoothScroll>
      <Preloader />
      <Sky />
      <div className="grain" aria-hidden />
      <Cursor />
      <Nav />
      <main className="relative">
        <Hero />
        <Marquee />
        <About />
        <Journey />
        <Work />
        <Principles />
        <Ecosystem />
        <Play />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
