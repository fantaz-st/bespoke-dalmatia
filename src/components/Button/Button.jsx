import styles from "./Button.module.css";

const VARIANTS = {
  primary: null, // the base class is already the primary look
  secondary: styles.secondary,
  outline: styles.outline,
};

/**
 * Renders an <a> when given href, a <button> otherwise — the wave effect is
 * purely CSS, so both elements behave identically.
 *
 * No "use client" directive on purpose: without hooks of its own this stays
 * usable from a Server Component, and it still lands in the client bundle
 * automatically when a Client Component imports it.
 */
export default function Button({
  href,
  variant = "primary",
  size = "default",
  className,
  children,
  ...rest
}) {
  const classes = [
    styles.button,
    VARIANTS[variant],
    size === "big" && styles.big,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  // type comes before the spread so a caller can still pass type="submit".
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}