"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import styles from "./Slideshow.module.css";

const pad = (n) => `0${n}`.slice(-2);

/**
 * `value` is the 1-based slide number, or 0 before playback starts — so the
 * first 0 → 1 change drives the intro roll for free.
 */
export default function SlideshowCounter({ ref, value, total }) {
  const containerRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(0);

  useEffect(() => {
    if (value === current) return;
    setNext(value);

    const el = containerRef.current;
    gsap.killTweensOf(el);
    gsap.to(el, {
      yPercent: -100,
      duration: 1,
      ease: "power2.out",
      onComplete: () => {
        setCurrent(value);
        gsap.set(el, { yPercent: 0 });
      },
    });
    // `current` is intentionally omitted: including it would re-fire the tween
    // from the onComplete setState and loop forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={styles.counter} ref={ref} data-intro="fade">
      <div className={styles.currentNumberContainer} ref={containerRef}>
        <div className={styles.counterNumber}>{pad(current)}</div>
        <div className={`${styles.counterNumber} ${styles.nextNumber}`}>
          {pad(next)}
        </div>
      </div>
      <div className={`${styles.counterNumber} ${styles.totalNumber}`}>
        {pad(total)}
      </div>
    </div>
  );
}
