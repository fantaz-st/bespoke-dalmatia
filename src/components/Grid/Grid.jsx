import styles from "./Grid.module.css";

/**
 *   grid-area: 1 / 4 / 2 / 10;
 */
export default function Grid({
  as: Tag = "div",
  columns,
  gap,
  className,
  style,
  children,
  ...rest
}) {
  return (
    <Tag
      className={[styles.grid, className].filter(Boolean).join(" ")}
      style={{
        "--columns": columns == null ? undefined : String(columns),
        "--gap": gap,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
