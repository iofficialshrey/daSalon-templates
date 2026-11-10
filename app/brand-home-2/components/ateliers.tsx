import Image from "next/image";
import { ATELIERS, atelierHref, type Atelier } from "../data/ateliers";
import { AtelierLink } from "./ateliers-link";
import { AtelierMeta, AtelierStatus, AteliersLive, ExtraAtelierRows } from "./ateliers-live";
import { BookButton } from "./book-button";
import { ArrowRight } from "./icons";
import styles from "./ateliers.module.css";
import ui from "./ui.module.css";

function street(address: string) {
  return address.split(",")[0];
}

function AtelierCard({ atelier, index }: { atelier: Atelier; index: number }) {
  const href = atelierHref(atelier.slug);
  return (
    <li id={`atelier-${atelier.slug}`} data-atelier={atelier.slug} className={styles.card}>
      <AtelierLink href={href} className={styles.media} tabIndex={-1} aria-hidden="true">
        <Image
          src={atelier.photo}
          alt=""
          sizes="(min-width: 1100px) 24vw, (min-width: 760px) 46vw, 82vw"
          quality={60}
          className={styles.img}
          style={{ objectPosition: atelier.focus }}
        />
        <span className={styles.no}>{String(index + 1).padStart(2, "0")}</span>
      </AtelierLink>
      <div className={styles.body}>
        <p className={styles.trade}>{atelier.tradeLine}</p>
        <h3 className={styles.name}>
          <AtelierLink href={href} className={styles.nameLink}>
            {atelier.name}
          </AtelierLink>
        </h3>
        <p className={styles.address}>
          {atelier.area} · {street(atelier.address)}
        </p>
        <AtelierStatus slug={atelier.slug} className={styles.status} />
        <AtelierMeta slug={atelier.slug} className={styles.meta} />
        <div className={styles.actions}>
          <BookButton slug={atelier.slug} className={`${ui.btn} ${ui.sm} ${ui.secondary}`} aria-label={`Book at ${atelier.name}`}>
            Book
          </BookButton>
          <AtelierLink href={href} className={`${ui.btn} ${ui.textBtn}`}>
            <span className={ui.underline}>
              View<span className={ui.srOnly}> {atelier.name}</span>
            </span>
            <ArrowRight />
          </AtelierLink>
        </div>
      </div>
    </li>
  );
}

/**
 * Section 4: the ateliers. Four houses in Singapore, each with its own
 * specialists and live diary. Every static fact is server-rendered; status,
 * counts and Book are small client islands.
 */
export function Ateliers() {
  return (
    <section
      id="ateliers"
      data-tone="paper"
      aria-labelledby="ateliers-title"
      className={`${ui.section} ${ui.paper} ${styles.section}`}
    >
      <div className={ui.wide}>
        <div className={ui.head}>
          <h2 id="ateliers-title" className={`${ui.h2} ${ui.rise}`} tabIndex={-1} data-jump-focus="">
            Choose your <em className={ui.italic}>atelier.</em>
          </h2>
          <p className={`${ui.headLead} ${ui.lead} ${ui.rise} ${ui.rise2}`}>
            Four houses in Singapore, each with its own specialists and its own live diary. One membership and one
            gift card are honoured at all four.
          </p>
        </div>

        <AteliersLive>
          <ol className={styles.list}>
            {ATELIERS.map((atelier, index) => (
              <AtelierCard key={atelier.slug} atelier={atelier} index={index} />
            ))}
            <ExtraAtelierRows />
          </ol>
        </AteliersLive>

        <p className={styles.footnote}>Photographs are illustrative. Menus, prices and times are live.</p>
      </div>
    </section>
  );
}
