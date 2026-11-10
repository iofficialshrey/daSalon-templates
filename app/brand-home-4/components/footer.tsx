import { CREDITS, CREDITS_LEAD, type ArtCredit } from "../data/art";
import { ISSUE } from "../data/chapters";
import { STUDIOS } from "../data/studios";
import { AllContentsButton, BackToCoverButton } from "./footer-actions";
import { ArrowUpRight, Minus, Plus } from "./icons";
import { MotionToggle } from "./motion-toggle";
import styles from "./footer.module.css";
import ui from "./ui.module.css";

const NOTE = "Prices in S$ · GST shown wherever a studio adds it · Times in Singapore time (SGT)";

const STATEMENT =
  "© 2026 Paloma, a concept storefront by da Salon. Studio names, menus, prices and dates are live from da Salon; the cover film and photographs are illustrative. Memberships, seasonal sets and gift cards are demonstrations: nothing is charged, sent or stored.";

/** Joins credit fields into one sentence without doubled stops. */
function sentence(...parts: Array<string | null | undefined>) {
  const text = parts
    .map((part) => part?.trim().replace(/[.\s]+$/, ""))
    .filter(Boolean)
    .join(". ");
  return text ? `${text}.` : "";
}

function Credit({ credit }: { credit: ArtCredit }) {
  return (
    <li className={styles.credit}>
      {credit.use ? <span className={styles.creditUse}>{credit.use}</span> : null}
      <span>
        <a className={styles.creditLink} href={credit.objectURL} target="_blank" rel="noopener noreferrer">
          {credit.title}
          <span className={ui.srOnly}> (opens in a new tab)</span>
        </a>
        {credit.date ? `, ${credit.date.trim().replace(/[.\s]+$/, "")}` : ""}.{" "}
        {sentence(credit.accession ? `The Met ${credit.accession}` : null, credit.licence, credit.treatment)}
      </span>
    </li>
  );
}

/**
 * The page's contentinfo, on the ink ground that continues from the back
 * cover: the four studios with directions, the index and motion controls, the
 * pricing note, the demonstration statement, picture credits and Powered by.
 */
export function Footer() {
  return (
    <footer className={styles.footer} data-tone="ink">
      <div className={`${ui.frame} ${styles.top}`}>
        <div className={styles.mark}>
          <p className={styles.wordmark}>Paloma</p>
          <p className={styles.meta}>Hair · Grooming · Skin · Spa · Bridal</p>
          <p className={styles.meta}>
            {ISSUE.label} · {ISSUE.edition}
          </p>
        </div>

        <ul className={styles.studios} aria-label="Studios">
          {STUDIOS.map((studio) => (
            <li key={studio.slug} className={styles.studio}>
              <p className={styles.name}>{studio.name}</p>
              <p className={styles.line}>{studio.address}</p>
              <p className={styles.line}>{studio.hoursLabel}</p>
              <a
                className={`${ui.textBtn} ${styles.directions}`}
                href={studio.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Directions
                <span className={ui.srOnly}> to {studio.name} (opens Google Maps in a new tab)</span>
                <ArrowUpRight />
              </a>
            </li>
          ))}
        </ul>

        <ul className={styles.actions}>
          <li>
            <AllContentsButton className={`${ui.textBtn} ${styles.action}`} />
          </li>
          <li>
            <BackToCoverButton className={`${ui.textBtn} ${styles.action}`} iconClassName={styles.up} />
          </li>
          <li>
            <MotionToggle className={`${ui.textBtn} ${styles.action}`} showLabel />
          </li>
        </ul>
      </div>

      <div className={`${ui.frame} ${styles.bottom}`}>
        <div className={styles.notes}>
          <p className={styles.note}>{NOTE}</p>
          <p className={styles.statement}>{STATEMENT}</p>
          <details className={styles.credits}>
            <summary className={styles.summary}>
              Picture credits
              <Plus className={styles.plus} />
              <Minus className={styles.minus} />
            </summary>
            <div className={styles.creditsBody}>
              <p>{CREDITS_LEAD}</p>
              {CREDITS.length ? (
                <ol className={styles.creditList}>
                  {CREDITS.map((credit) => (
                    <Credit key={credit.id} credit={credit} />
                  ))}
                </ol>
              ) : null}
            </div>
          </details>
        </div>

        <a className={styles.powered} href="https://www.dasalon.com" target="_blank" rel="noopener noreferrer">
          Powered by da Salon
          <span className={ui.srOnly}> (opens in a new tab)</span>
          <ArrowUpRight />
        </a>
      </div>
    </footer>
  );
}
