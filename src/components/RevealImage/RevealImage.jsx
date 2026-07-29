"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./RevealImage.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * `from` is how far in each edge starts, as a percentage of the frame.
 * A single number closes all four evenly, so the opening rectangle keeps the
 * frame's own proportions. Pass { x, y } to start from a different shape — a
 * low y and high x gives a horizontal sliver, the reverse gives a column.
 */
function closedInset(from) {
  const x = typeof from === "object" ? from.x : from;
  const y = typeof from === "object" ? from.y : from;
  return `inset(${y}% ${x}% ${y}% ${x}%)`;
}

/**
 * Opens a mask outward from the centre in all four directions as the image
 * scrolls into view, with the picture settling out of a zoom at the same time.
 *
 *   <RevealImage src="/img/hero.jpg" alt="" ratio="16 / 9" />
 *   <RevealImage src="/img/wide.jpg" alt="" from={{ x: 46, y: 30 }} />
 */
export default function RevealImage({
  src,
  alt = "",
  ratio = "3 / 2",
  from = 45,
  zoom = 1.15,
  duration = 1.4,
  ease = "power3.inOut",
  start = "top 90%",
  sizes = "100vw",
  priority = false,
  className,
  ...rest
}) {
  const rootRef = useRef(null);
  const clipRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    // The resting stylesheet already shows the finished image, so there is
    // nothing to undo here — just never close the mask in the first place.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Scoped so every tween and ScrollTrigger created inside reverts together
    // on unmount, including the inline styles GSAP leaves behind.
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start, once: true },
      });

      // fromTo, not to: the mask rests fully open in CSS so the image is
      // visible without JavaScript. immediateRender closes it as soon as the
      // trigger is built, well before it scrolls into view.
      timeline.fromTo(
        clipRef.current,
        { clipPath: closedInset(from) },
        { clipPath: "inset(0% 0% 0% 0%)", duration, ease },
      );

      // From position 0, so the picture is still pulling back as the mask
      // opens. Without it the small centre rectangle shows the same crop as
      // the finished frame and the reveal reads as a shutter rather than as
      // the image arriving.
      timeline.fromTo(
        imageRef.current,
        { scale: zoom },
        { scale: 1, duration, ease },
        0,
      );
    }, rootRef);

    return () => ctx.revert();
  }, [from, zoom, duration, ease, start]);

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={{ "--ratio": ratio }}
      {...rest}
    >
      {/* Two nested elements because two transforms run at once: the mask
          opens, the picture scales. Sharing one would mean fighting over a
          single property. */}
      <div ref={clipRef} className={styles.clip}>
        <div ref={imageRef} className={styles.scaler}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className={styles.image}
          />
        </div>
      </div>
    </div>
  );
}
