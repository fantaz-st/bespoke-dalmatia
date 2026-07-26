"use client";

import styles from "./Slideshow.module.css";

function ControlButton({ icon, label, onClick }) {
  return (
    <button className={styles.controlsButton} onClick={onClick} aria-label={label}>
      <svg className={styles.controlsIcon} aria-hidden="true">
        <use href={`#${icon}`} />
      </svg>
    </button>
  );
}

export default function SlideshowControls({ ref, onPrevious, onNext }) {
  return (
    <div className={styles.controls} ref={ref} data-intro="fade">
      <ControlButton icon="arrow-left" label="Previous slide" onClick={onPrevious} />
      <ControlButton icon="arrow-right" label="Next slide" onClick={onNext} />
    </div>
  );
}
