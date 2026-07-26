import styles from "./ThreeLines.module.css";

// Two rules divide the viewport into three columns, at 1x and 2x the column
// width. A third at 3x would land on 100vw — the right edge — where it is
// invisible and can push a horizontal scrollbar.
const POSITIONS = [1, 2];

export default function ThreeLines({ color = "black" }) {
  const colorClass = color === "white" ? styles.white : styles.black;

  return (
    <>
      {POSITIONS.map((step) => (
        <div
          key={step}
          className={`${styles.line} ${colorClass}`}
          style={{ left: `calc(var(--column-width) * ${step})` }}
        />
      ))}
    </>
  );
}
