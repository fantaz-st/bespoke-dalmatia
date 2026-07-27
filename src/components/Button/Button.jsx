import Link from "next/link";
import styles from "./Button.module.css";

const VARIANTS = {
  primary: null, // the base class is already the primary look
  secondary: styles.secondary,
  outline: styles.outline,
};

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
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  // type comes before the spread so a caller can still pass type="submit".
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
