"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";

import slides from "@/data/slides";
import { preloadWithProgress, fetchBlobUrl } from "@/lib/preload";
import SVGSpritesheet from "@/components/Icons/SVGSpritesheet";
import Header from "@/components/Header/Header";
import Loader from "@/components/Loader/Loader";
import Slideshow from "@/components/Slideshow/Slideshow";
import SlideshowCounter from "@/components/Slideshow/SlideshowCounter";
import SlideshowControls from "@/components/Slideshow/SlideshowControls";
import SlideDescription from "@/components/Slideshow/SlideDescription";
import styles from "./Hero.module.css";

// The menu is unreachable until the intro has run, so its chunk — and
// focus-trap-react with it — has no business in the initial bundle.
const Menu = dynamic(() => import("@/components/Menu/Menu"), { ssr: false });

// Menu entries reverse over ~0.8s; waiting lets the panel clear before the
// slide behind it starts transitioning.
const MENU_CLOSE_DURATION = 800;

// Matches the shader crossfade (1.5s) with a little headroom.
const TRANSITION_DURATION = 1600;

// How long the welcome layer owns the screen, measured from the moment the
// loader starts leaving. Its entrance costs ~1.05s of this, so the heading sits
// fully settled for a little over a second before the hero takes over.
const WELCOME_HOLD = 2500;

export default function Hero() {
  const rootRef = useRef(null);
  const slideshowRef = useRef(null);
  const videosRef = useRef([]);
  const menuTimeoutRef = useRef(null);
  const welcomeRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false); // first clip decoded
  // One value instead of three booleans, because the three states are strictly
  // sequential: loading -> welcome -> playing.
  const [phase, setPhase] = useState("loading");
  const started = phase === "playing";
  const [index, setIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Preload -------------------------------------------------------------
  // Only the first clip gates the loader. Waiting on all four meant ~19 MB
  // before anything moved; the hero now starts on roughly a quarter of that and
  // the rest streams in behind it.
  useEffect(() => {
    const controller = new AbortController();
    const firstLoader = preloadWithProgress([slides[0].src], setProgress);
    let cancelled = false;

    // Videos are created detached from the DOM — they exist only as a pixel
    // source for the GL textures, never as visible elements.
    const makeVideo = (blobUrl) => {
      const video = document.createElement("video");
      video.src = blobUrl;
      video.loop = true;
      video.muted = true;
      video.playsInline = true; // required for iOS to autoplay at all
      return video;
    };

    const canPlay = (video) =>
      new Promise((resolve) => {
        if (video.readyState >= 3) resolve();
        else video.addEventListener("canplay", resolve, { once: true });
      });

    const install = async (i, blobUrl) => {
      const video = makeVideo(blobUrl);
      await canPlay(video);
      if (cancelled) return false;

      videosRef.current[i] = video;
      slideshowRef.current?.attachVideo(i, video);
      setLoadedCount(i + 1);
      return true;
    };

    async function boot() {
      const [firstUrl] = await firstLoader.promise;
      if (cancelled) return;
      if (!(await install(0, firstUrl))) return;
      setReady(true);

      // Sequential, not parallel: four concurrent downloads on a phone starve
      // each other, and slide 2 is worthless until slide 1 is playing anyway.
      for (let i = 1; i < slides.length; i++) {
        try {
          const url = await fetchBlobUrl(slides[i].src, controller.signal);
          if (cancelled) return;
          if (!(await install(i, url))) return;
        } catch (error) {
          if (!cancelled && error.name !== "AbortError") console.error(error);
        }
      }
    }

    boot().catch((error) => {
      if (!cancelled) console.error(error);
    });

    return () => {
      cancelled = true;
      firstLoader.cancel();
      controller.abort();
      videosRef.current.forEach((video) => {
        if (!video) return;
        video.pause();
        URL.revokeObjectURL(video.src);
      });
    };
  }, []);

  // --- Phases ---------------------------------------------------------------
  useEffect(() => {
    if (!ready || phase !== "loading") return;

    // Started here rather than at "playing" so the clip is already warm and
    // decoding by the time the hero animates in.
    videosRef.current[0]?.play().catch(() => {});
    setPhase("welcome");
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== "welcome") return;
    const timeout = setTimeout(() => setPhase("playing"), WELCOME_HOLD);
    return () => clearTimeout(timeout);
  }, [phase]);

  // --- Welcome --------------------------------------------------------------
  useEffect(() => {
    const el = welcomeRef.current;
    if (!el || phase === "loading") return;

    if (phase === "welcome") {
      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.75, ease: "power2.out" },
      );
      return;
    }

    // Leaves upward as the hero's column guides start drawing underneath. Note
    // there is no display: none at the end — the heading stays at opacity 0 in
    // the accessibility tree, so it remains the page's h1 for anyone
    // navigating by heading.
    gsap.to(el, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power2.in",
    });
  }, [phase]);

  // --- Playback ------------------------------------------------------------
  // Only the visible clip decodes. Four videos playing at once was the bulk of
  // the 3.6s of main-thread work, and three of them were never on screen.
  useEffect(() => {
    if (!started) return;

    const current = videosRef.current[index];
    let removeResume;

    current?.play().catch(() => {
      // Autoplay refused — iOS low power mode is the usual culprit. With no
      // play button any more, retry silently on the first interaction of any
      // kind rather than leaving a frozen frame.
      const resume = () => current.play().catch(() => {});
      window.addEventListener("pointerdown", resume, { once: true });
      removeResume = () => window.removeEventListener("pointerdown", resume);
    });

    // The outgoing clip keeps running until the slice transition finishes,
    // otherwise it freezes while still half visible.
    const timeout = setTimeout(() => {
      videosRef.current.forEach((video, i) => {
        if (video && i !== index) video.pause();
      });
    }, TRANSITION_DURATION);

    return () => {
      clearTimeout(timeout);
      removeResume?.();
    };
  }, [index, started]);

  // --- Intro timeline ------------------------------------------------------
  useEffect(() => {
    if (!started) return;

    const root = rootRef.current;
    const lines = root.querySelectorAll('[data-intro="line"]');
    const fades = root.querySelectorAll('[data-intro="fade"]');
    const rule = root.querySelector('[data-intro="rule"]');

    const tl = gsap.timeline();

    tl.to(lines, {
      scaleY: 1,
      duration: 1.5,
      stagger: 0.225,
      ease: "power2.out",
    });

    tl.to(fades, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.05,
      ease: "power2.out",
    });

    tl.to(rule, { "--ruleScaleX": 1, duration: 1, ease: "power2.out" }, "<");

    return () => tl.kill();
  }, [started]);

  // --- Navigation ----------------------------------------------------------
  const goToSlide = useCallback(
    (next) => {
      // Ignore input mid-transition; the shader crossfades two textures and a
      // third would pop.
      if (slideshowRef.current?.isTransitioning()) return;
      // Its texture is still empty — the slide would render as a blank pane.
      if (next >= loadedCount) return;
      setIndex(next);
    },
    [loadedCount],
  );

  // Wrap against what's loaded rather than slides.length, so the arrows stay
  // usable while the tail of the set is still downloading.
  const goToNext = useCallback(
    () => goToSlide(index >= loadedCount - 1 ? 0 : index + 1),
    [goToSlide, index, loadedCount],
  );

  const goToPrevious = useCallback(
    () => goToSlide(index === 0 ? loadedCount - 1 : index - 1),
    [goToSlide, index, loadedCount],
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (menuOpen || !started) return;
      if (event.key === "ArrowRight") goToNext();
      if (event.key === "ArrowLeft") goToPrevious();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToNext, goToPrevious, menuOpen, started]);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  const selectFromMenu = useCallback(
    (i) => {
      setMenuOpen(false);
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = setTimeout(
        () => goToSlide(i),
        MENU_CLOSE_DURATION,
      );
    },
    [goToSlide],
  );

  useEffect(() => () => clearTimeout(menuTimeoutRef.current), []);

  return (
    <div className={styles.app} ref={rootRef}>
      <SVGSpritesheet />

      <Header menuOpen={menuOpen} onToggleMenu={toggleMenu} />

      <Loader progress={progress} hidden={phase !== "loading"} />

      <div className={styles.welcome} ref={welcomeRef}>
        <p className={styles.welcomeTitle}>Welcome to the Sea</p>
      </div>

      <Slideshow
        ref={slideshowRef}
        slides={slides}
        index={index}
        started={started}
      />

      <div className={styles.line} data-intro="line" />
      <div className={`${styles.line} ${styles.lineLast}`} data-intro="line" />

      {started && (
        <Menu
          slides={slides}
          open={menuOpen}
          onToggle={toggleMenu}
          onSelect={selectFromMenu}
        />
      )}

      <footer className={styles.footer}>
        <div
          className={`${styles.column} ${styles.ruledColumn}`}
          data-intro="rule"
        >
          <div className={styles.slideshowUi}>
            <SlideshowCounter
              value={started ? index + 1 : 0}
              total={slides.length}
            />
            <SlideshowControls onPrevious={goToPrevious} onNext={goToNext} />
          </div>
        </div>

        <div className={styles.column}>
          <SlideDescription slides={slides} index={index} started={started} />
        </div>
      </footer>
    </div>
  );
}
