"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";

import styles from "./Slideshow.module.css";

/**
 * Splits into words, not characters. The caption gets the per-char mask because
 * it's 70px display type; the same treatment on 14px body copy reads as noise,
 * and an overflow-hidden mask at that size clips descenders.
 *
 * The space sits *between* spans as its own text node so the paragraph still
 * wraps normally — a trailing space inside an inline-block collapses.
 */
function splitWords(text) {
  const words = text.split(" ");

  return words.map((word, i) => (
    <Fragment key={`${word}-${i}`}>
      <span className={styles.descriptionWord}>{word}</span>
      {i < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

export default function SlideDescription({ slides, index, started }) {
  const itemRefs = useRef([]);
  const prevIndexRef = useRef(null);

  useEffect(() => {
    if (!started) return;

    const prev = prevIndexRef.current;
    if (prev === index) return;

    if (prev === null) {
      // The first description rides the intro fade instead of running its own
      // stagger. The intro timeline holds this block at opacity 0 for ~1.5s
      // while the column guides draw, so a stagger here would play out unseen.
      itemRefs.current[index]?.classList.add(styles.descriptionActive);
    } else {
      animateOut(prev);
      animateIn(index);
    }

    prevIndexRef.current = index;
  }, [index, started]);

  function animateOut(i) {
    const el = itemRefs.current[i];
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        el.classList.remove(styles.descriptionActive);
        // Hand opacity back to the stylesheet so the next reveal starts clean.
        gsap.set(el, { clearProps: "opacity" });
      },
    });
  }

  function animateIn(i) {
    const el = itemRefs.current[i];
    if (!el) return;

    el.classList.add(styles.descriptionActive);
    const words = el.querySelectorAll(`.${styles.descriptionWord}`);

    gsap.killTweensOf(words);
    gsap.fromTo(
      words,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.03,
        ease: "power2.out",
        // Lets the caption lead; its own transition runs 1.5s.
        delay: 0.25,
      }
    );
  }

  return (
    <div className={styles.descriptions} data-intro="fade">
      {slides.map((slide, i) => (
        <p
          key={slide.caption}
          className={styles.description}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
        >
          {splitWords(slide.description)}
        </p>
      ))}
    </div>
  );
}
