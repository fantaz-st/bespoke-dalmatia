"use client";

import styles from "./Slideshow.module.css";

/**
 * Replaces Splitting.js. The original mutated the DOM after mount to inject
 * .word / .char wrappers, which fights React (and breaks on hydration).
 * Splitting in the render pass instead is both simpler and SSR-safe.
 *
 * Spaces are dropped because each word becomes its own block-level line —
 * exactly what the overflow-hidden mask needs.
 */
export default function SlideshowCaption({ ref, caption }) {
  return (
    <p className={styles.caption} ref={ref}>
      {caption.split(" ").map((word, wordIndex) => (
        <span className={styles.word} key={`${word}-${wordIndex}`}>
          {[...word].map((char, charIndex) => (
            <span className={styles.char} key={`${char}-${charIndex}`}>
              {char}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}
