import Image from "next/image";

import Grid from "@/components/Grid/Grid";
import Col from "@/components/Col/Col";
import ThreeLines from "@/components/ThreeLines/ThreeLines";

import styles from "./Gallery.module.css";

export default function Gallery() {
  return (
    <div className={styles.container}>
      <Grid gap="0">
        {/* Wide, top right. The empty top-left quarter is what gives the block
            its asymmetry — leave it. */}
        <Col xs={12} md={8} offset={{ md: 4 }} className={styles.image1}>
          <div className={styles.imageContainer}>
            <Image
              alt=""
              src="/img/galaxy-gates.jpg"
              fill
              sizes="(min-width: 950px) 66vw, 100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </Col>

        {/* offset={{ md: 0 }} rather than no offset at all. It reads as a
            no-op, but it pins the column instead of leaving placement to the
            auto-placement algorithm, which fills gaps ahead of the cursor and
            would drop this one alongside image1 in row 1. */}
        <Col xs={12} md={4} offset={{ md: 0 }} className={styles.image2}>
          <div className={styles.imageContainer}>
            <Image
              alt=""
              src="/img/kingdom-of-colors.jpg"
              fill
              sizes="(min-width: 950px) 33vw, 100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </Col>

        {/* Shares row 2 with image2; the stagger is margin, not a third row. */}
        <Col xs={12} md={4} offset={{ md: 8 }} className={styles.image3}>
          <div className={styles.imageContainer}>
            <Image
              alt=""
              src="/img/mini-planets.jpg"
              fill
              sizes="(min-width: 950px) 33vw, 100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </Col>
      </Grid>

      <ThreeLines color="black" />
    </div>
  );
}
