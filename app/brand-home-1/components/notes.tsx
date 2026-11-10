import Image from "next/image";
import { HOUSE_BY_SLUG, type HouseSlug } from "../data/houses";
import styles from "./notes.module.css";
import ui from "./ui.module.css";

type Note = { id: string; quote: string; house: HouseSlug };

const LEAD_NOTE: Note = {
  id: "bronze-quiet",
  quote: "I came for a haircut and stayed for the quiet. Nobody hurried me, not even at the counter.",
  house: "the-grooming-room",
};

const NOTES: readonly Note[] = [
  {
    id: "travertine-consultation",
    quote: "The consultation took ten minutes and saved me from the wrong facial.",
    house: "lumiere-aesthetics",
  },
  {
    id: "walnut-next-door",
    quote: "A cut at Bronze House, then hot stone next door at Walnut House. Same address, no gap.",
    house: "serenity-spa-house",
  },
];

function Credit({ house }: { house: HouseSlug }) {
  const facts = HOUSE_BY_SLUG.get(house);
  if (!facts) return null;
  return (
    <figcaption className={styles.credit}>
      <span className={styles.thumb} aria-hidden="true">
        <Image src={facts.image} alt="" quality={60} sizes="48px" className={styles.thumbImg} />
      </span>
      <span>
        A guest of {facts.name}
        <span className={styles.illustrative}>Illustrative</span>
      </span>
    </figcaption>
  );
}

/** Guest notes: three clearly illustrative quotes, each credited to its house, and their disclosure. No JS. */
export function Notes() {
  return (
    <section id="notes" className={`${ui.section} ${styles.notes}`} aria-labelledby="notes-title">
      <div className={ui.container}>
        <h2 id="notes-title" className={ui.srOnly} tabIndex={-1}>
          Guest notes
        </h2>

        <figure className={`${styles.lead} ${ui.reveal}`}>
          <span className={styles.mark} aria-hidden="true">“</span>
          <blockquote className={styles.quoteLarge}>
            <p>{LEAD_NOTE.quote}</p>
          </blockquote>
          <Credit house={LEAD_NOTE.house} />
        </figure>

        <div className={styles.pair}>
          {NOTES.map((note, index) => (
            <figure key={note.id} className={`${styles.note} ${index === 0 ? ui.reveal2 : ui.reveal3}`}>
              <blockquote className={styles.quoteSmall}>
                <p>“{note.quote}”</p>
              </blockquote>
              <Credit house={note.house} />
            </figure>
          ))}
        </div>

        <p className={styles.disclosure}>
          Illustrative notes written for this demonstration, not reviews from real guests.
        </p>
      </div>
    </section>
  );
}
