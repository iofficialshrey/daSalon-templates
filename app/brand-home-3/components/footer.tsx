import { CREDITS, CREDITS_LEAD, type ArtCredit } from "../data/art";
import { FOOTER_LINKS } from "../data/nav";
import { PLACES } from "../data/places";
import layout from "../layout.module.css";
import { BookButton } from "./book-button";
import { CurrentPlaceStatus } from "./header-actions";
import { ArrowUpRight, Minus, Plus } from "./icons";
import header from "./header.module.css";
import styles from "./footer.module.css";
import ui from "./ui.module.css";

function Credit({ credit }: { credit: ArtCredit }) {
  return (
    <li className={styles.credit}>
      <span className={styles.creditUse}>
        <span className={ui.num}>{credit.key}</span> · {credit.uses}
      </span>
      <span>
        <a className={styles.creditLink} href={credit.url} target="_blank" rel="noopener noreferrer">
          {credit.title}
          <span className={ui.srOnly}> (opens in a new tab)</span>
        </a>
        , {credit.date}. {credit.maker}, <span className={ui.num}>{credit.callNumber}</span>. {credit.treatment}.{" "}
        {credit.licence}.
      </span>
    </li>
  );
}

/**
 * The ink footer (spec §4.11): the mark and a line about the places, Explore
 * links, the four places with directions, "Your hour" (the current place's live
 * status and Book), then the legal row with the demonstration statement, the
 * film disclosure and the picture credits.
 */
export function Footer() {
  return (
    <footer className={styles.footer} data-tone="ink">
      <div className={`${layout.frame} ${styles.top}`}>
        <div className={styles.brand}>
          <p className={`${header.mark} ${styles.mark}`}>
            <span className={header.symbol} aria-hidden="true">
              S
            </span>
            <span className={`${ui.serif} ${header.wordmark}`}>
              Serein <em>House</em>
            </span>
          </p>
          <p className={`${ui.bodyS} ${ui.muted} ${styles.blurb}`}>
            A spa in Clementi, with three sister places across Singapore.
          </p>
          <p className={`${ui.small} ${styles.sage}`}>Powered by da Salon</p>
        </div>

        <nav className={styles.explore} aria-labelledby="sr-footer-explore">
          <p id="sr-footer-explore" className={ui.label}>
            Explore
          </p>
          <ul>
            {FOOTER_LINKS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} data-jump="" className={`${ui.nav} ${styles.link}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.visit}>
          <p id="sr-footer-visit" className={ui.label}>
            Visit
          </p>
          <ul className={styles.placeList} aria-labelledby="sr-footer-visit">
            {PLACES.map((place) => (
              <li key={place.slug} className={styles.place}>
                <p className={`${ui.nav} ${styles.placeName}`}>{place.name}</p>
                <p className={`${ui.small} ${styles.sage}`}>{place.address}</p>
                <a className={ui.text} href={place.directionsUrl} target="_blank" rel="noopener noreferrer">
                  Directions
                  <span className={ui.srOnly}> to {place.name} (opens Google Maps in a new tab)</span>
                  <ArrowUpRight />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.hour}>
          <p className={ui.label}>Your hour</p>
          <CurrentPlaceStatus onDark />
          <BookButton autoPlaceSuffix className={`${ui.btn} ${ui.sm} ${ui.onDark}`}>
            Book a ritual
          </BookButton>
          <p className={`${ui.small} ${ui.muted}`}>You pay on the day, after your ritual.</p>
        </div>
      </div>

      <div className={`${layout.frame} ${styles.legal}`}>
        <div className={styles.legalRow}>
          <p className={`${ui.small} ${styles.sage} ${styles.statement}`}>
            © 2026 Serein House · A fictional brand on live da Salon venues. Bookings go to each place&apos;s live diary;
            memberships, packages and gift cards are demonstrations and nothing is charged.
          </p>
          <p className={`${ui.small} ${styles.sage}`}>Entrance film: illustrative, generated with AI.</p>
          <details className={styles.credits}>
            <summary className={styles.summary}>
              Picture credits
              <Plus className={styles.plus} />
              <Minus className={styles.minus} />
            </summary>
            <div className={styles.creditsBody}>
              <p className={`${ui.small} ${styles.sage}`}>{CREDITS_LEAD}</p>
              <ol className={styles.creditList}>
                {CREDITS.map((credit) => (
                  <Credit key={credit.key} credit={credit} />
                ))}
              </ol>
            </div>
          </details>
        </div>
      </div>
    </footer>
  );
}
