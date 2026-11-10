import { memo, useId } from "react";
import { serviceDescription } from "@/lib/dasalon/client";
import { formatDuration, formatPrice } from "@/lib/dasalon/locale";
import type { PublicService } from "@/lib/dasalon/types";
import { ArrowRight } from "./icons";
import styles from "./collection.module.css";
import ui from "./ui.module.css";

type ServiceTagProps = {
  service: PublicService;
  /** Position across the atelier, in display order (kept for memo stability). */
  number: number;
  atelierName: string;
  /** Stable callbacks, so an unchanged tag never re-renders on a menu refresh. */
  onBook: (serviceId: string) => void;
  onIntent: () => void;
};

/**
 * One live service as a menu row. The visible face is decorative; the
 * button's name is one sentence ("Book HydraFacial, 1 hr, S$180 + GST 9%, at
 * The Changi Studio") and the description is its description.
 */
function ServiceTagView({ service, atelierName, onBook, onIntent }: ServiceTagProps) {
  const descriptionId = useId();
  const duration = formatDuration(service.duration);
  const price = formatPrice(service.price);
  const priced = service.taxLabel ? `${price} ${service.taxLabel}` : price;
  const due = service.total !== service.price ? `, ${formatPrice(service.total)} due at the atelier` : "";

  return (
    <div role="listitem" className={styles.tagItem}>
      <button
        type="button"
        className={styles.tag}
        aria-describedby={descriptionId}
        onClick={() => onBook(service.id)}
        onPointerEnter={onIntent}
        onFocus={onIntent}
        onTouchStart={onIntent}
      >
        <span className={ui.srOnly}>
          Book {service.name}, {duration}, {priced}, at {atelierName}
          {due}
        </span>
        <span className={styles.face} aria-hidden="true">
          <span className={styles.tagName}>{service.name}</span>
          <span id={descriptionId} className={styles.tagDescription}>{serviceDescription(service)}</span>
          <span className={styles.tagMeta}>
            <span className={styles.duration}>{duration}</span>
            <span className={styles.priceBlock}>
              <span className={styles.price}>{price}</span>
              {service.taxLabel ? <span className={styles.tax}>{service.taxLabel}</span> : null}
            </span>
          </span>
          <span className={styles.bookCue}>
            Book
            <ArrowRight size={14} />
          </span>
        </span>
      </button>
    </div>
  );
}

function sameService(a: PublicService, b: PublicService) {
  return a === b || (
    a.id === b.id
    && a.name === b.name
    && a.description === b.description
    && a.duration === b.duration
    && a.price === b.price
    && a.total === b.total
    && a.taxLabel === b.taxLabel
    && a.category === b.category
  );
}

/** Memoised by content: the catalog's 30-second refresh hands over new objects for the same menu. */
export const ServiceTag = memo(ServiceTagView, (previous, next) =>
  sameService(previous.service, next.service)
  && previous.number === next.number
  && previous.atelierName === next.atelierName
  && previous.onBook === next.onBook
  && previous.onIntent === next.onIntent,
);
