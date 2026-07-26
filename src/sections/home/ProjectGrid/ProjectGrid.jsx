"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import Grid, { Col } from "@/components/Grid/Grid";
import styles from "./ProjectGrid.module.css";

/**
 * The composition is designed around exactly three cards: a wide one across
 * the top right, a portrait bottom left, and a third pulled up alongside it.
 *
 * `row` is not optional decoration. Grid auto-placement is sparse and never
 * backtracks, but it does fill gaps ahead of the cursor — card 2 asks for
 * columns 1-4, which are still free in row 1 next to the wide card, so
 * without an explicit row it lands there and the stagger collapses.
 */
const LAYOUT = [
  {
    span: { base: 12, sm: 8 },
    start: { sm: 5 },
    row: 1,
    ratio: { base: "4 / 3", sm: "5 / 3" },
    sizes: "(min-width: 768px) 66vw, 100vw",
  },
  {
    span: { base: 12, sm: 4 },
    start: { sm: 1 },
    row: 2,
    ratio: { base: "4 / 3", sm: "4 / 5" },
    sizes: "(min-width: 768px) 33vw, 100vw",
  },
  {
    span: { base: 12, sm: 4 },
    start: { sm: 9 },
    row: 3,
    ratio: { base: "4 / 3", sm: "4 / 5" },
    sizes: "(min-width: 768px) 33vw, 100vw",
    lift: true, // pulled up into the previous row's band
  },
];

// Anything past the third card just flows normally rather than trying to
// extend a composition that was only ever three pieces.
const FALLBACK = {
  span: { base: 12, sm: 4 },
  ratio: { base: "4 / 3", sm: "4 / 5" },
  sizes: "(min-width: 768px) 33vw, 100vw",
};

/** Fires once and disconnects — this is an entrance, not a toggle. */
function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      // Waits until the card is ~10% up the viewport, so it isn't already
      // finished animating by the time it's properly on screen.
      { rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

function ProjectCard({ project, index }) {
  const layout = LAYOUT[index] ?? FALLBACK;
  const [ref, inView] = useInView();

  return (
    <Col
      as="article"
      span={layout.span}
      start={layout.start}
      className={`${styles.item} ${layout.lift ? styles.lift : ""}`}
      style={{
        "--index": index,
        "--item-row": layout.row,
        "--ratio-base": project.ratio ?? layout.ratio.base,
        "--ratio-sm": project.ratio ?? layout.ratio.sm,
      }}
    >
      <a
        ref={ref}
        href={project.href}
        className={styles.link}
        data-inview={inView || undefined}
      >
        <div className={styles.media}>
          {/* Two nested boxes because two different scales run here at once:
              the inner one counter-scales on entrance, the outer one handles
              hover. Sharing an element would mean fighting over transform. */}
          <div className={styles.mediaInner}>
            <Image
              src={project.image}
              alt={project.alt ?? ""}
              fill
              sizes={layout.sizes}
              className={styles.image}
            />
          </div>
        </div>

        <div className={styles.meta}>
          <span>{project.location}</span>
          <span>{project.year}</span>
        </div>

        <h3 className={styles.title}>{project.title}</h3>
      </a>
    </Col>
  );
}

export default function ProjectGrid({ title, cta, projects = [] }) {
  return (
    <Grid as="section" container className={styles.section}>
      {(title || cta) && (
        <Col span={12} className={styles.header}>
          {title && <h2 className={styles.heading}>{title}</h2>}
          {cta && (
            <a href={cta.href} className={styles.cta}>
              {cta.label}
            </a>
          )}
        </Col>
      )}

      {projects.map((project, i) => (
        <ProjectCard key={project.href} project={project} index={i} />
      ))}
    </Grid>
  );
}
