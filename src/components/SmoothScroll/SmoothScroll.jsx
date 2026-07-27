"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

// Module-level rather than context: the provider component cannot consume its
// own context, and this way GSAP callbacks and plain event handlers can reach
// the instance without being inside a tree.
let instance = null;

/** The live Lenis instance, or null before mount / under reduced motion. */
export function getLenis() {
  return instance;
}

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Smooth scroll takes the wheel away from the browser, which is a real
    // problem for anyone prone to motion sickness. Leave the page alone.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
    instance = lenis;

    // ScrollTrigger recalculates on native scroll events. Lenis interpolates
    // between those, so without this every trigger reads a stale position —
    // animations fire late and anything pinned jitters.
    lenis.on("scroll", ScrollTrigger.update);

    // autoRaf is off so there is one loop rather than two, which means Lenis
    // now moves only because this runs. GSAP's ticker counts in seconds, Lenis
    // in milliseconds.
    const update = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(update);

    // GSAP otherwise discards frames it judges to be lagging and jumps the
    // playhead to compensate, which fights Lenis's interpolation and reads as
    // a stutter.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's own defaults
      lenis.destroy();
      instance = null;
    };
  }, []);

  // Lenis keeps its own scroll position and does not notice the App Router
  // changing pages — without this you land partway down the new one.
  useEffect(() => {
    instance?.scrollTo(0, { immediate: true });
    // Section heights change with the route; triggers measured against the old
    // page stay wrong until they are remeasured.
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
