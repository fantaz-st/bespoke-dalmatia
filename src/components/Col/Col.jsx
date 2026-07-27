import styles from "./Col.module.css";

// Must match the media queries in Col.module.css.
// MUI's names, this project's numbers: md is 950 to line up with the Hero and
// ThreeLines rather than MUI's own 900.
const TIERS = ["xs", "sm", "md", "lg"];

/**
 * Expands one prop into a value per breakpoint, carrying each forward.
 *
 *   { xs: 12, md: 6 }  ->  [12, 12, 6, 6]
 */
function expand(byTier) {
  const out = [];
  let carried;

  for (const tier of TIERS) {
    if (byTier[tier] != null) carried = byTier[tier];
    out.push(carried);
  }

  return out;
}

/** offset accepts a number (all breakpoints) or an object, like MUI's Grid2. */
function asTiers(value) {
  if (value == null) return {};
  if (typeof value === "object") return value;
  return { xs: value };
}

/**
 * A grid item.
 *
 *   <Col xs={12} md={6} />               full width, then half from 950px up
 *   <Col xs={12} md={4} lg={3} />
 *   <Col xs={12} md={6} offset={{ md: 3 }} />   centred: columns 4-9
 *
 * Values are columns of THAT grid — inside <Grid columns={4}>, md={2} is half.
 * offset is how many columns to skip from the grid's left edge, so it places
 * absolutely rather than relative to the previous item.
 */
export default function Col({
  as: Tag = "div",
  xs,
  sm,
  md,
  lg,
  offset,
  className,
  style,
  children,
  ...rest
}) {
  const widths = expand({ xs, sm, md, lg });
  const offsets = expand(asTiers(offset));

  // Seeded with the stylesheet's own defaults, so a breakpoint that changes
  // nothing emits nothing and the style attribute stays short.
  const vars = {};
  let prevWidth;
  let prevStart = "auto";

  TIERS.forEach((tier, i) => {
    const width = widths[i];
    if (width != null && width !== prevWidth) {
      vars[`--w-${tier}`] = String(width);
      prevWidth = width;
    }

    // offset counts columns to skip; grid lines are 1-based, hence the +1.
    const start = offsets[i] == null ? "auto" : String(offsets[i] + 1);
    if (start !== prevStart) {
      vars[`--o-${tier}`] = start;
      prevStart = start;
    }
  });

  return (
    <Tag
      className={[styles.col, className].filter(Boolean).join(" ")}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
