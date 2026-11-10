import Image, { type StaticImageData } from "next/image";
import listenPhoto from "../assets/ritual/listen.jpg";
import revealPhoto from "../assets/ritual/reveal.jpg";
import shapePhoto from "../assets/ritual/shape.jpg";
import { BookButton } from "./book-button";
import { ArrowRight } from "./icons";
import { RitualSequence } from "./ritual-sequence";
import styles from "./ritual.module.css";
import ui from "./ui.module.css";

type Step = {
  title: string;
  body: string;
  photo: StaticImageData;
  alt: string;
  /** The photograph's own class: where its subject sits when the frame crops it. */
  shot: string;
};

/** Three details of one photograph: the stylist listening, her hands at work, the guest at the mirror. */
const STEPS: readonly Step[] = [
  {
    title: "Listen",
    body: "We begin with texture, rhythm and the way you want to feel.",
    photo: listenPhoto,
    alt: "Illustrative photograph: a stylist in black looks down attentively, her hands resting in a guest's long dark hair.",
    shot: styles.shot1,
  },
  {
    title: "Shape",
    body: "Technique is chosen around your hair, never a one-size ritual.",
    photo: shapePhoto,
    alt: "Illustrative photograph: a stylist's hands lifting and shaping long, glossy dark hair.",
    shot: styles.shot2,
  },
  {
    title: "Reveal",
    body: "The finish is taught, refined and made effortless to repeat.",
    photo: revealPhoto,
    alt: "Illustrative photograph: the guest in profile before a set of bronze-ringed mirrors, her hair finished.",
    shot: styles.shot3,
  },
];

/**
 * Section 3: the ritual, as a sequence. On wide screens the photograph holds
 * still beside the text and turns to each step as it reaches the middle of
 * the screen; on phones each step carries its own detail of the photograph.
 */
export function Ritual() {
  return (
    <section id="ritual" data-tone="paper" aria-labelledby="ritual-title" className={`${ui.section} ${ui.paper} ${styles.ritual}`}>
      <div className={ui.container}>
        <RitualSequence className={styles.sequence}>
          <div className={styles.stage}>
            <div className={`${styles.window} ${ui.pull}`}>
              {STEPS.map((step) => (
                <Image
                  key={step.title}
                  src={step.photo}
                  alt={step.alt}
                  fill
                  sizes="(min-width: 900px) 50vw, 1px"
                  quality={75}
                  placeholder="blur"
                  className={`${styles.shot} ${step.shot}`}
                />
              ))}
              <span className={styles.frame} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.text}>
            <div className={styles.head}>
              <h2 id="ritual-title" className={`${ui.h2} ${styles.title} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
                More than a service.{" "}
                <em className={`${ui.italic} ${styles.second}`}>A sequence of attention.</em>
              </h2>
              <p className={`${ui.lead} ${styles.lead} ${ui.rise} ${ui.rise2}`}>
                Inspired by the intimacy of a private atelier, every visit unfolds slowly, from a considered
                consultation to a finish designed for real life.
              </p>
            </div>

            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <li key={step.title} className={styles.step} data-ritual-step={index + 1}>
                  <div className={styles.inline}>
                    <Image
                      src={step.photo}
                      alt={step.alt}
                      fill
                      sizes="(min-width: 900px) 1px, 100vw"
                      quality={75}
                      placeholder="blur"
                      className={`${styles.inlineImg} ${step.shot}`}
                    />
                  </div>
                  <div className={styles.stepHead}>
                    <span className={styles.no} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                  </div>
                  <p className={styles.stepBody}>{step.body}</p>
                </li>
              ))}
            </ol>

            <BookButton className={styles.circle} aria-label="Book the ritual">
              <span className={styles.circleText}>
                Book
                <br />
                the ritual
              </span>
              <ArrowRight />
            </BookButton>
          </div>
        </RitualSequence>
      </div>
    </section>
  );
}
