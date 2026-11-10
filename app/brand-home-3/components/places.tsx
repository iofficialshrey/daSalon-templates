import layout from "../layout.module.css";
import { PLACES, subLine, type Place } from "../data/places";
import { ArtPicture } from "./art-picture";
import { BookButton } from "./book-button";
import { CarouselControls } from "./carousel-controls";
import { ArrowUpRight } from "./icons";
import { PlaceLive, PlacesSection, SeeMenuButton } from "./places-live";
import styles from "./places.module.css";
import ui from "./ui.module.css";

/*
 * 05 · Places, "Find your quiet place." (spec §4.5). All four real Singapore
 * places, each bookable, each with live status. The static facts are server
 * HTML; the section shell (proximity warm-up), the status and facts lines and
 * "See the menu" are client islands from places-live.tsx.
 *
 * 1200+: four staggered 3/12 columns. 760–1199: 2×2, the right column lower.
 * Below 760: a scroll-snap track with arrows and a counter; every card stays
 * reachable by Tab.
 */
export function Places() {
  return (
    <PlacesSection className={`${layout.section} ${layout.frame}`}>
      <div className={`${layout.head} ${layout.reveal}`}>
        <div className={layout.headMain}>
          <p className={ui.label}>Four places in Singapore</p>
          <h2 id="places-title" className={ui.displayL}>
            <span className={ui.line}>Find your</span> <span className={ui.line}><em>quiet place.</em></span>
          </h2>
        </div>
        <p className={layout.headNote}>
          Each keeps its own rhythm: a spa and a grooming room side by side in Clementi, skin care in Changi, and bridal
          care on Sentosa.
        </p>
      </div>

      <div id="places-track" role="group" aria-label="Places" className={styles.track}>
        {PLACES.map((place, index) => (
          <PlaceCard key={place.slug} place={place} step={index} />
        ))}
      </div>

      <CarouselControls
        trackId="places-track"
        count={PLACES.length}
        prevLabel="Previous place"
        nextLabel="Next place"
        itemNoun="Place"
        className={styles.controls}
      />
    </PlacesSection>
  );
}

function PlaceCard({ place, step }: { place: Place; step: number }) {
  const titleId = `place-${place.slug}-title`;
  return (
    <article
      className={`${styles.card} ${layout.reveal}`}
      // The stagger runs through animation ranges, never delays (§2.6).
      data-step={step ? String(step) : undefined}
      data-place={place.slug}
      aria-labelledby={titleId}
    >
      <div className={styles.media}>
        <ArtPicture art={place.art} className={styles.art} imgClassName={styles.img} />
        <span className={`${ui.label} ${ui.num} ${styles.badge}`} aria-hidden="true">
          {place.number}
        </span>
      </div>

      <div className={styles.body}>
        <p className={ui.label}>{subLine(place)}</p>
        <h3 id={titleId} className={`${ui.h3} ${styles.name}`}>
          {place.name}
        </h3>
        <p className={ui.body}>{place.line}</p>
        <p className={`${ui.small} ${ui.muted}`}>{place.address}</p>
        <PlaceLive slug={place.slug} />
        {place.neighbour ? <p className={`${ui.small} ${ui.muted}`}>{place.neighbour}</p> : null}
      </div>

      <div className={styles.actions}>
        <BookButton slug={place.slug} srSuffix={` at ${place.name}`} className={`${ui.btn} ${ui.sm} ${ui.primary}`}>
          Book here
        </BookButton>
        <SeeMenuButton slug={place.slug} name={place.name} />
        <a className={ui.text} href={place.directionsUrl} target="_blank" rel="noopener noreferrer">
          <span>
            Directions
            <span className={ui.srOnly}>{` to ${place.name} (opens Google Maps in a new tab)`}</span>
          </span>
          <ArrowUpRight />
        </a>
      </div>
    </article>
  );
}
