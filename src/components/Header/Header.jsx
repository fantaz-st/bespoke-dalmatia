"use client";

import BurgerButton from "@/components/Menu/BurgerButton";
import styles from "./Header.module.css";
import Button from "../Button/Button";

export default function Header({ menuOpen, onToggleMenu }) {
  return (
    <header className={styles.header} style={{ viewTransitionName: "navbar" }}>
      <div className={styles.column}>
        <button type="button" className={styles.logo} data-intro="fade" aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.logoSvg}>
            <path d="M12 2a10 10 0 110 20 10 10 0 010-20zm0-2a12 12 0 100 24 12 12 0 000-24zm5.5 14a8.4 8.4 0 01-5.5 1.9c-2.3 0-4-.8-5.5-2l-.5.5c1.1 1.8 3.2 3.6 6 3.6s4.9-1.8 6-3.6l-.5-.5zm-9-6a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
          </svg>
        </button>

        <BurgerButton active={menuOpen} onToggle={onToggleMenu} className={styles.burger} data-intro="fade" />
      </div>

      <div className={styles.column}>
        <Button href="/contact" variant="primary" className={styles.button} data-intro="fade">
          Contact
        </Button>
        {/* <Link href="/contact" className={styles.link} data-intro="fade">
          Contact
        </Link> */}
      </div>
    </header>
  );
}
