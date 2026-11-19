import Image from "next/image";
import housePhoto from "../assets/house.jpg";
import ritualPhoto from "../assets/ritual.jpg";
import { JumpLink } from "./jump-link";
import styles from "./house.module.css";
import ui from "./ui.module.css";

/**
 * The house and its point of view. The wide photograph walks slowly from the
 * pool to the resting beds as the section passes (scroll-driven), with the
 * oil being poured in an arch beside it.
 */
export function House() {
  return (
    <section id="house" data-tone="dark" aria-labelledby="house-title" className={`${ui.section} ${ui.dark} ${styles.house}`}>
      <div className={`${ui.container} ${styles.grid}`}>
        <div className={styles.copy}>
          <h2 id="house-title" className={`${ui.h2} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
            Your body is not another thing <em className={ui.accent}>to optimise.</em>
          </h2>
          <p className={`${ui.lead} ${ui.rise} ${ui.rise2}`}>
            Oru is a house for touch, water, warmth and the minutes between them. We listen first, then shape the
            hour around what you need today.
          </p>
          <JumpLink to="rooms" className={`${ui.link} ${styles.link} ${ui.rise} ${ui.rise3}`}>
            Find your room
          </JumpLink>
        </div>

        <div className={styles.frames}>
          <div className={styles.wide}>
            <Image
              src={housePhoto}
              alt="Illustrative photograph: a lavender-tiled pool, an arched doorway onto a walled garden and two linen daybeds."
              fill
              sizes="(min-width: 1000px) 80vw, 150vw"
              quality={75}
              className={styles.walk}
            />
          </div>
          <div className={styles.arch}>
            <Image
              src={ritualPhoto}
              alt="Illustrative photograph: hands pouring oil from a small violet glass flask into a bowl of lavender."
              fill
              sizes="(min-width: 1000px) 20vw, 44vw"
              quality={75}
              className={`${styles.pour} ${ui.exhale}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
