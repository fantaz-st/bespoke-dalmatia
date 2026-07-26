"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import styles from "./Loader.module.css";

export default function Loader({ progress, showPlayButton, hidden, onPlay }) {
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const [buttonActive, setButtonActive] = useState(false);

  useEffect(() => {
    if (!hidden) return;
    gsap.to(rootRef.current, {
      yPercent: -100,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      onComplete: () => gsap.set(rootRef.current, { display: "none" }),
    });
  }, [hidden]);

  useEffect(() => {
    if (!showPlayButton) return;

    const tl = gsap.timeline();

    tl.to(rootRef.current, {
      "--beforeScaleY": 1,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => setButtonActive(true),
    });

    tl.to(buttonRef.current, { opacity: 1, duration: 1, ease: "power2.out" }, "-=.5");

    return () => tl.kill();
  }, [showPlayButton]);

  return (
    <div className={styles.loader} ref={rootRef}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 513.6 513.6"
        className={styles.svg}
        aria-hidden="true"
      >
        <g transform="translate(-162.95 -200.47)">
          <circle cx="419.75" cy="457.27" r="249.3" strokeWidth="1.4" />
          <path
            className={styles.svgPath}
            style={{ strokeDashoffset: 100 - progress }}
            pathLength="100"
            strokeWidth="15"
            d="M170.45 457.27a249.3 249.3 0 01249.3-249.3 249.3 249.3 0 01249.3 249.3 249.3 249.3 0 01-249.3 249.3 249.3 249.3 0 01-249.3-249.3z"
          />
        </g>
      </svg>

      <div className={styles.percent} role="status" aria-live="polite">
        {progress}%
      </div>
      <div className={styles.welcome}>  
      <h1>Welcome to the Sea</h1>
      </div>

      <button
        type="button"
        className={`${styles.playButton} ${buttonActive ? styles.active : ""}`}
        ref={buttonRef}
        onClick={onPlay}
        aria-label="Play"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" aria-hidden="true">
          <path d="M296 146L40 2a16 16 0 00-24 14v288a16 16 0 0024 14l256-144a16 16 0 000-28z" />
        </svg>
      </button>
    </div>
  );
}
