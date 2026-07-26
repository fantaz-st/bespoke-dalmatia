import ThreeLines from "@/components/ThreeLines/ThreeLines";

import styles from "./Gallery.module.css";
import Grid from "@/components/Grid/Grid";
import Image from "next/image";

export default function Gallery() {
  return (
    <div className={styles.container}>
      <Grid>
        <div className={styles.image1}>
          <Image
            alt=""
            src="/img/galaxy-gates.jpg"
            fill
            sizes="(min-width: 950px) 66vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.image2}>
          <Image
            alt=""
            src="/img/kingdom-of-colors.jpg"
            fill
            sizes="(min-width: 950px) 33vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.image3}>
          <Image
            alt=""
            src="/img/mini-planets.jpg"
            fill
            sizes="(min-width: 950px) 33vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </Grid>
      <ThreeLines color="black" />
    </div>
  );
}
