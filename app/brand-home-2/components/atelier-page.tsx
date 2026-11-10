import Image from "next/image";
import { atelierBySlug, atelierHref, neighbours, type Atelier, type AtelierSlug } from "../data/ateliers";
import { formatTime } from "@/lib/dasalon/locale";
import {
  CoverMeta,
  CoverStatus,
  LiveUnavailable,
  NextBookableDay,
  OnlineCollection,
  ShareButton,
} from "./atelier-page-live";
import { AtelierLink } from "./ateliers-link";
import { BookButton } from "./book-button";
import { Collection } from "./collection";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "./icons";
import { PiecesForAtelier } from "./pieces-for-atelier";
import styles from "./atelier-page.module.css";
import ui from "./ui.module.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function street(address: string) {
  return address.split(",")[0];
}

function homeHref() {
  return "/brand-home-2#ateliers";
}

/* ---------- 1. Cover ---------- */

function Cover({ atelier }: { atelier: Atelier }) {
  return (
    <section
      id="atelier-cover"
      data-tone="paper"
      aria-labelledby="atelier-title"
      className={`${ui.paper} ${styles.cover}`}
    >
      <div className={`${ui.container} ${styles.coverGrid}`}>
        <div className={styles.copy}>
          <AtelierLink href={homeHref()} className={`${ui.btn} ${ui.textBtn} ${styles.crumb}`}>
            <ArrowLeft />
            <span className={ui.underline}>All ateliers</span>
          </AtelierLink>
          <h1 id="atelier-title" className={styles.title} tabIndex={-1} data-jump-focus="">
            {atelier.name}
          </h1>
          <p className={styles.subLine}>{atelier.subLine}</p>
          <p className={`${ui.lead} ${styles.blurb}`}>{atelier.blurb}</p>
          <ul className={styles.facts}>
            <li className={styles.fact}>{atelier.address}</li>
            <li className={styles.fact}>{atelier.hoursLabel}</li>
            <CoverStatus slug={atelier.slug} />
          </ul>
          <CoverMeta slug={atelier.slug} />
          <LiveUnavailable slug={atelier.slug} />
          <div className={styles.ctas} data-tag-hide="">
            <BookButton slug={atelier.slug} className={`${ui.btn} ${ui.primary} ${ui.lg} ${styles.book}`}>
              Book at {atelier.name}
            </BookButton>
            <a
              className={`${ui.btn} ${ui.secondary} ${ui.lg} ${styles.directions}`}
              href={atelier.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Directions
              <ArrowUpRight />
              <span className={ui.srOnly}> (opens Google Maps)</span>
            </a>
            <ShareButton name={atelier.name} />
          </div>
        </div>

        <div className={styles.art}>
          <figure className={styles.photo}>
            <span className={styles.photoFrame} aria-hidden="true" />
            <Image
              src={atelier.photo}
              alt={atelier.photoAlt}
              quality={75}
              sizes="(max-width: 759px) 100vw, 46vw"
              loading="eager"
              className={styles.photoImg}
              style={{ objectPosition: atelier.focus }}
            />
            <figcaption className={styles.photoCredit}>Illustrative photograph</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Details ---------- */

function goodToKnow(atelier: Atelier) {
  if (atelier.slug === "lumiere-aesthetics") {
    return <p>Adults only. Treatments take place in private rooms.</p>;
  }
  const sister = atelier.sister ? atelierBySlug(atelier.sister) : undefined;
  if (!sister) return null;
  return (
    <>
      <p>
        Shares {street(atelier.address)} with {sister.name}. A cut and a massage can sit back to back.
      </p>
      <AtelierLink href={atelierHref(sister.slug)} className={`${ui.btn} ${ui.textBtn} ${styles.sisterLink}`}>
        <span className={ui.underline}>Visit {sister.name}</span>
        <ArrowRight />
      </AtelierLink>
    </>
  );
}

function Details({ atelier }: { atelier: Atelier }) {
  const note = goodToKnow(atelier);
  const hours = atelier.hours ? `${formatTime(atelier.hours.open)} – ${formatTime(atelier.hours.close)}` : null;
  return (
    <section id="details" data-tone="paper" aria-labelledby="details-title" className={`${ui.section} ${ui.paper} ${styles.details}`}>
      <div className={ui.container}>
        <div className={styles.sectionHead}>
          <h2 id="details-title" className={ui.h2s}>Details</h2>
        </div>

        <dl className={styles.dl}>
          <div className={styles.dlRow}>
            <dt className={ui.label}>Address</dt>
            <dd className={styles.dd}>
              <p>{atelier.address}</p>
              <a
                className={`${ui.btn} ${ui.textBtn}`}
                href={atelier.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={ui.underline}>Directions</span>
                <ArrowUpRight />
                <span className={ui.srOnly}> (opens Google Maps)</span>
              </a>
            </dd>
          </div>

          <div className={styles.dlRow}>
            <dt className={ui.label}>Hours</dt>
            <dd className={styles.dd}>
              {hours ? (
                <table className={styles.hours}>
                  <caption className={styles.hoursCaption}>Opening hours (Singapore time)</caption>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <th scope="row">{day}</th>
                        <td>{hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Shown when you book</p>
              )}
            </dd>
          </div>

          <div className={styles.dlRow}>
            <dt className={ui.label}>Next bookable day</dt>
            <dd className={styles.dd}>
              <NextBookableDay slug={atelier.slug} />
            </dd>
          </div>

          <div className={styles.dlRow}>
            <dt className={ui.label}>Online collection</dt>
            <dd className={styles.dd}>
              <OnlineCollection slug={atelier.slug} />
            </dd>
          </div>

          {atelier.amenities.length ? (
            <div className={styles.dlRow}>
              <dt className={ui.label}>Amenities</dt>
              <dd className={styles.dd}>
                <ul className={styles.amenities}>
                  {atelier.amenities.map((amenity) => (
                    <li key={amenity} className={styles.amenity}>{amenity}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}

          {note ? (
            <div className={styles.dlRow}>
              <dt className={ui.label}>Good to know</dt>
              <dd className={styles.dd}>{note}</dd>
            </div>
          ) : null}
        </dl>

        <p className={styles.detailsNote}>
          All times are Singapore time (SGT). Address and hours from the atelier&apos;s public da Salon listing.
        </p>
      </div>
    </section>
  );
}

/* ---------- 5. More ateliers ---------- */

function NextSpread({ atelier }: { atelier: Atelier }) {
  const [previous, next] = neighbours(atelier.slug);
  const items = [
    { atelier: previous, direction: "previous" as const },
    { atelier: next, direction: "next" as const },
  ];
  return (
    <section id="next" data-tone="paper" aria-labelledby="next-title" className={`${ui.section} ${ui.paper} ${styles.next}`}>
      <div className={ui.container}>
        <h2 id="next-title" className={ui.srOnly}>More ateliers</h2>
        <div className={styles.nextLinks}>
          {items.map(({ atelier: item, direction }) => (
            <AtelierLink
              key={direction}
              href={atelierHref(item.slug)}
              className={`${styles.nextLink} ${direction === "next" ? styles.nextLinkForward : ""}`}
            >
              <span className={styles.nextThumb} aria-hidden="true">
                <Image src={item.photo} alt="" sizes="64px" quality={60} className={styles.nextThumbImg} />
              </span>
              <span className={styles.nextText}>
                <span className={`${ui.label} ${styles.nextLabel}`}>
                  {direction === "previous" ? <ArrowLeft size={14} /> : null}
                  <span className={ui.srOnly}>{direction === "previous" ? "Previous atelier: " : "Next atelier: "}</span>
                  {item.trade}
                  {direction === "next" ? <ArrowRight size={14} /> : null}
                </span>
                <span className={styles.nextName}>{item.name}</span>
              </span>
            </AtelierLink>
          ))}
        </div>
        <AtelierLink href={homeHref()} className={`${ui.btn} ${ui.textBtn} ${styles.back}`}>
          <ArrowLeft />
          <span className={ui.underline}>All ateliers</span>
        </AtelierLink>
      </div>
    </section>
  );
}

/* ---------- The route body ---------- */

/**
 * /brand-home-2/ateliers/[slug]: every static fact in the HTML, live status,
 * counts and the collection hydrated on top. Without a live venue match the
 * static facts stand and Book opens at the default venue.
 */
export function AtelierPage({ slug }: { slug: AtelierSlug }) {
  const atelier = atelierBySlug(slug);
  if (!atelier) return null;
  return (
    <>
      <Cover atelier={atelier} />
      <Collection slug={slug} />
      <Details atelier={atelier} />
      <PiecesForAtelier slug={slug} />
      <NextSpread atelier={atelier} />
    </>
  );
}
