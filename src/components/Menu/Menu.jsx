"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { FocusTrap } from "focus-trap-react";

import BurgerButton from "./BurgerButton";
import styles from "./Menu.module.css";

const STAGGER = 0.1;
const INITIAL_DELAY = 0.1;

function MenuEntry({ label, src, open, focusable, delay, onClick }) {
  const entryRef = useRef(null);
  const labelRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ paused: true, delay });

    tl.to(entryRef.current, {
      clipPath: "inset(0 0% 0 0)",
      ease: "power4.out",
      duration: 1,
    });

    // fromTo, not to. The starting offset must be set by GSAP itself:
    // declaring `transform: translateY(100%)` in CSS and then tweening
    // yPercent silently no-ops, because getComputedStyle hands GSAP a pixel
    // matrix. It reads the label as y: 21px / yPercent: 0 and animates 0 -> 0
    // while the pixel offset stays put, leaving the label below the mask.
    // fromTo defaults to immediateRender: true, so the label is parked
    // off-screen on creation even though the timeline is paused.
    tl.fromTo(
      labelRef.current,
      { yPercent: 100 },
      { yPercent: 0, ease: "power2.out", duration: 1 },
      "-=.75"
    );

    tlRef.current = tl;
    return () => tl.kill();
  }, [delay]);

  // Closing plays the same timeline backwards at double speed, so open and
  // close read as one gesture instead of two separate animations.
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (open) tl.timeScale(1).restart(true);
    else tl.timeScale(2).reverse();
  }, [open]);

  return (
    <li className={styles.entry} ref={entryRef}>
      <button
        type="button"
        className={styles.entryLink}
        tabIndex={focusable ? 0 : -1}
        onClick={onClick}
      >
        {/* Plain <img>: these are decorative posters inside an animated,
            transform-heavy element, where next/image's wrapper adds nothing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.entryPicture} src={src} alt="" />
        <span className={styles.entryLabelContainer}>
          <span className={styles.entryLabel} ref={labelRef}>
            {label}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function Menu({ slides, open, onToggle, onSelect }) {
  return (
    <>
      <FocusTrap
        active={open}
        focusTrapOptions={{
          escapeDeactivates: false,
          clickOutsideDeactivates: false, // handled by the overlay below
          allowOutsideClick: true,
          returnFocusOnDeactivate: true,
        }}
      >
        <nav className={`${styles.menu} ${open ? styles.active : ""}`}>
          <BurgerButton
            active={open}
            focusable={open}
            onToggle={onToggle}
            className={styles.menuBurger}
          />

          <ul className={styles.entriesList}>
            {slides.map((slide, i) => (
              <MenuEntry
                key={slide.caption}
                label={slide.caption}
                src={slide.poster}
                open={open}
                focusable={open}
                delay={i * STAGGER + INITIAL_DELAY}
                onClick={() => onSelect(i)}
              />
            ))}
          </ul>
        </nav>
      </FocusTrap>

      <div
        className={styles.overlay}
        onClick={() => onToggle()}
        aria-hidden="true"
      />
    </>
  );
}
