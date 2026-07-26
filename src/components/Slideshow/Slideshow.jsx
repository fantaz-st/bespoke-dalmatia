"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

import GL from "@/gl/GL";
import SlideshowCaption from "./SlideshowCaption";
import styles from "./Slideshow.module.css";

export default function Slideshow({ ref, slides, index, started }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const captionRefs = useRef([]);
  const prevIndexRef = useRef(null);

  // --- WebGL lifecycle -----------------------------------------------------
  useEffect(() => {
    const gl = new GL({
      canvas: canvasRef.current,
      slidesCount: slides.length,
    });
    glRef.current = gl;

    const onResize = () => gl.updateSize();
    onResize(); // set the initial size right away
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      gl.dispose();
      glRef.current = null;
    };
  }, [slides.length]);

  useImperativeHandle(ref, () => ({
    attachVideos: (videos) => glRef.current?.attachVideosToEmptyTextures(videos),
    attachVideo: (i, video) => glRef.current?.attachVideo(i, video),
    isTransitioning: () => glRef.current?.isTransitionRunning() ?? false,
  }));

  // --- Transitions ---------------------------------------------------------
  // Runs once when playback starts (animating slide 0 in) and on every index
  // change after that. prevIndexRef stays outside React state because it must
  // not trigger a render of its own.
  useEffect(() => {
    if (!started || !glRef.current) return;

    const prev = prevIndexRef.current;
    if (prev === index) return;

    if (prev !== null) animateOutCaption(prev);
    animateInCaption(index);
    glRef.current.goToSlide(index);

    prevIndexRef.current = index;
  }, [index, started]);

  function chars(i) {
    return captionRefs.current[i]?.querySelectorAll(`.${styles.char}`) ?? [];
  }

  function animateOutCaption(i) {
    const el = captionRefs.current[i];
    if (!el) return;
    const targets = chars(i);

    // Kill in-flight tweens first, otherwise a fast double-click leaves
    // characters stranded mid-fade.
    gsap.killTweensOf(targets);
    gsap.fromTo(
      targets,
      { opacity: 1 },
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => el.classList.remove(styles.active),
      }
    );
  }

  function animateInCaption(i) {
    const el = captionRefs.current[i];
    if (!el) return;
    el.classList.add(styles.active);
    const targets = chars(i);

    gsap.killTweensOf(targets);
    gsap.fromTo(
      targets,
      { yPercent: 100, opacity: 1 },
      { yPercent: 0, stagger: 0.025, duration: 1, ease: "power2.out" }
    );
  }

  return (
    <div className={styles.slideshow}>
      <canvas ref={canvasRef} className={styles.gl} />
      <div className={styles.captionsContainer}>
        {slides.map((slide, i) => (
          <SlideshowCaption
            key={slide.caption}
            caption={slide.caption}
            ref={(el) => {
              captionRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}
