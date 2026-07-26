import Copy from "@/components/Copy/Copy";
import styles from "./AboutUs.module.css";
import Button from "@/components/Button/Button";

export default function AboutUs() {
  return (
    <section className={styles.aboutUs}>
      <Copy>
        <p className={styles.title}>
          Your day. Our sea. Private boat days shaped around you, guided by
          people who have called these waters home for decades.
        </p>
      </Copy>
      <Button
        href="/about"
        variant="outline"
        className={styles.button}
        data-intro="fade"
      >
        Learn More
      </Button>
    </section>
  );
}
