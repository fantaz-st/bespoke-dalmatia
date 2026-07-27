"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import styles from "./Loader.module.css";

export default function Loader({ progress, hidden }) {
  const rootRef = useRef(null);

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
    </div>
  );
}
