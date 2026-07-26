"use client";

import styles from "./BurgerButton.module.css";

export default function BurgerButton({
  ref,
  active,
  focusable = true,
  className = "",
  onToggle,
  ...rest
}) {
  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.burger} ${active ? styles.active : ""} ${className}`}
      tabIndex={focusable ? 0 : -1}
      aria-expanded={active}
      aria-label={active ? "Close menu" : "Open menu"}
      onClick={() => onToggle()}
      {...rest}
    >
      <span className={styles.slices}>
        <span className={`${styles.slice} ${styles.top}`} />
        <span className={`${styles.slice} ${styles.middle}`} />
        <span className={`${styles.slice} ${styles.bottom}`} />
      </span>
    </button>
  );
}
