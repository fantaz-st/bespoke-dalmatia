"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

import slides from "@/data/slides";
import { preloadWithProgress, canAutoplay } from "@/lib/preload";
import SVGSpritesheet from "@/components/Icons/SVGSpritesheet";
import Header from "@/components/Header/Header";
import Menu from "@/components/Menu/Menu";
import Loader from "@/components/Loader/Loader";
import Slideshow from "@/components/Slideshow/Slideshow";
import SlideshowCounter from "@/components/Slideshow/SlideshowCounter";
import SlideshowControls from "@/components/Slideshow/SlideshowControls";
import styles from "./Hero.module.css";

// Menu entries reverse over ~0.8s; waiting lets the panel clear before the
// slide behind it starts transitioning.
const MENU_CLOSE_DURATION = 800;

export default function Hero() {
  const rootRef = useRef(null);
  const slideshowRef = useRef(null);
  const videosRef = useRef([]);
  const menuTimeoutRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false); // videos decoded, waiting to start
  const [started, setStarted] = useState(false); // playing
  const [needsGesture, setNeedsGesture] = useState(false);
  const [index, setIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Preload -------------------------------------------------------------
  useEffect(() => {
    const loader = preloadWithProgress(
      slides.map((slide) => slide.src),
      setProgress
    );

    let cancelled = false;

    loader.promise
      .then(async (blobUrls) => {
        if (cancelled) return;

        // Videos are created detached from the DOM — they exist only as a pixel
        // source for the GL textures, never as visible elements.
        const videos = blobUrls.map((blobUrl) => {
          const video = document.createElement("video");
          video.src = blobUrl;
          video.loop = true;
          video.muted = true;
          video.playsInline = true; // required for iOS to autoplay at all
          return video;
        });

        videosRef.current = videos;

        await Promise.all(
          videos.map(
            (video) =>
              new Promise((resolve) => {
                if (video.readyState >= 3) resolve();
                else video.addEventListener("canplay", resolve, { once: true });
              })
          )
        );

        if (cancelled) return;

        slideshowRef.current?.attachVideos(videos);
        setReady(true);
      })
      .catch((error) => {
        if (!cancelled) console.error(error);
      });

    return () => {
      cancelled = true;
      loader.cancel();
      videosRef.current.forEach((video) => {
        video.pause();
        URL.revokeObjectURL(video.src);
      });
    };
  }, []);

  // --- Start ---------------------------------------------------------------
  const start = useCallback(() => {
    videosRef.current.forEach((video) => video.play());
    setNeedsGesture(false);
    setStarted(true);
  }, []);

  // Autoplay policies vary by browser and battery state, so probe rather than
  // assume: if the promise rejects, fall back to the play button.
  useEffect(() => {
    if (!ready || started) return;

    let cancelled = false;

    canAutoplay(videosRef.current[0]).then((allowed) => {
      if (cancelled) return;
      if (allowed) start();
      else setNeedsGesture(true);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, started, start]);

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
  const goToSlide = useCallback((next) => {
    // Ignore input mid-transition; the shader crossfades two textures and a
    // third would pop.
    if (slideshowRef.current?.isTransitioning()) return;
    setIndex(next);
  }, []);

  const goToNext = useCallback(
    () => goToSlide(index === slides.length - 1 ? 0 : index + 1),
    [goToSlide, index]
  );

  const goToPrevious = useCallback(
    () => goToSlide(index === 0 ? slides.length - 1 : index - 1),
    [goToSlide, index]
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
        MENU_CLOSE_DURATION
      );
    },
    [goToSlide]
  );

  useEffect(() => () => clearTimeout(menuTimeoutRef.current), []);

  return (
    <div className={styles.app} ref={rootRef}>
      <SVGSpritesheet />

      <Header menuOpen={menuOpen} onToggleMenu={toggleMenu} />

      <Loader
        progress={progress}
        showPlayButton={needsGesture}
        hidden={started}
        onPlay={start}
      />

      <Slideshow
        ref={slideshowRef}
        slides={slides}
        index={index}
        started={started}
      />

      <div className={styles.line} data-intro="line" />
      <div className={`${styles.line} ${styles.lineLast}`} data-intro="line" />

      <Menu
        slides={slides}
        open={menuOpen}
        onToggle={toggleMenu}
        onSelect={selectFromMenu}
      />

      <footer className={styles.footer}>
        <div className={`${styles.column} ${styles.ruledColumn}`} data-intro="rule">
          <div className={styles.slideshowUi}>
            <SlideshowCounter
              value={started ? index + 1 : 0}
              total={slides.length}
            />
            <SlideshowControls onPrevious={goToPrevious} onNext={goToNext} />
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.infos} data-intro="fade">
            <p>
             some text here
            </p>
            <p>
             more text here
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
