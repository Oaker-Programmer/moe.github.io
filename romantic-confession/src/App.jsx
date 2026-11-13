import { useEffect, useRef, useState } from "react";
import AmbientBackdrop from "./components/AmbientBackdrop.jsx";
import DreamScene from "./components/DreamScene.jsx";
import Footer from "./components/Footer.jsx";
import Gallery from "./components/Gallery.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Letter from "./components/Letter.jsx";
import Preloader from "./components/Preloader.jsx";
import StoryViewer from "./components/StoryViewer.jsx";
import { stories } from "./data/stories.js";
import {
  useMediaQuery,
  useReducedMotion,
  useReveal,
  useScrollProgress,
} from "./hooks/useExperience.js";

export default function App() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const reducedMotion = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const isMobile = useMediaQuery("(max-width: 760px)");
  const scrollRef = useScrollProgress();
  const progressBarRef = useRef(null);
  const lastFocusRef = useRef(null);

  useReveal();

  useEffect(() => {
    let cancelled = false;
    const minimumTime = new Promise((resolve) => window.setTimeout(resolve, 500));
    const fonts = Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((resolve) => window.setTimeout(resolve, 600)),
    ]);
    const posters = stories.map(
      (story) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = resolve;
          image.src = story.poster;
        }),
    );
    const fallback = window.setTimeout(() => {
      if (!cancelled) setAssetsReady(true);
    }, 1500);

    Promise.allSettled([minimumTime, fonts, ...posters]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const openStory = (index) => {
    lastFocusRef.current = document.activeElement;
    setActiveIndex(index);
  };

  const closeStory = () => {
    setActiveIndex(null);
    window.setTimeout(() => lastFocusRef.current?.focus?.(), 60);
  };

  return (
    <div className={`app ${assetsReady ? "is-ready" : ""}`} id="top">
      <AmbientBackdrop reducedMotion={reducedMotion} />
      <DreamScene
        scrollRef={scrollRef}
        paused={activeIndex !== null}
        reducedMotion={reducedMotion}
        maxDpr={isMobile ? 1.25 : 1.7}
        quality={isMobile ? "low" : "high"}
      />
      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true">
        <span ref={progressBarRef} />
      </div>

      <Header scrolled={scrolled} />

      <div className="side-note" aria-hidden="true">
        <span>a little world</span>
        <span className="side-note-line" />
        <span>chapter by chapter</span>
      </div>

      <main className="site-main">
        <Hero />
        <Gallery onOpen={openStory} finePointer={finePointer} suspended={activeIndex !== null} />
        <Letter />
      </main>

      <Footer />
      <Preloader ready={assetsReady} />

      <StoryViewer
        stories={stories}
        activeIndex={activeIndex}
        onClose={closeStory}
        onNavigate={setActiveIndex}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
