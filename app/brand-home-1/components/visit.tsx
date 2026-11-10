import { HOUSE_BY_SLUG, HOUSES, type HouseSlug } from "../data/houses";
import { BookButton } from "./actions";
import { ArrowUpRight, Plus } from "./icons";
import ui from "./ui.module.css";
import styles from "./visit.module.css";

type Faq = { id: string; question: string; answer: string };

/** A house's display name, so the answers follow the house data. */
const named = (slug: HouseSlug) => HOUSE_BY_SLUG.get(slug)?.name ?? "";
const GROOMING = named("the-grooming-room");
const AESTHETICS = named("lumiere-aesthetics");
const SPA = named("serenity-spa-house");
const BRIDAL = named("bride-groom");

const FAQS: readonly Faq[] = [
  {
    id: "how-to-book",
    question: "How do I book an appointment?",
    answer:
      "Choose a house and a service, then a day and time from that house’s live availability. Add your name and a Singapore mobile number (+65), and your booking is confirmed on screen straight away.",
  },
  {
    id: "which-house",
    question: "Which house should I choose?",
    answer:
      `${GROOMING} for hair, make-up and nails; ${AESTHETICS} for facials, skin care and aesthetic treatments; ${SPA} for massage and body treatments; ${BRIDAL} for bridal hair and make-up. ${GROOMING} and ${SPA} share an address in Clementi, so a cut and a massage can sit back to back.`,
  },
  {
    id: "when-to-pay",
    question: "When do I pay?",
    answer: "At the house, after your visit. Booking online takes no payment and no card details.",
  },
  {
    id: "gst",
    question: "Are prices inclusive of GST?",
    answer:
      "Each price on the menu says how GST applies, for example ‘Incl. GST 9%’ or ‘+ GST 9%’. The amount due at the house is shown before you confirm.",
  },
  {
    id: "change-cancel",
    question: "Can I change or cancel a booking?",
    answer:
      "Contact the house using the details in your confirmation, and give as much notice as you can so the time can be offered to another guest.",
  },
  {
    id: "privileges",
    question: "Where can I use a membership or gift card?",
    answer:
      "Memberships and gift cards shown here are honoured at all four houses, within the validity on each card. Packages are bought and used at the house named on the card.",
  },
  {
    id: "aesthetics-adults",
    question: `Is ${AESTHETICS} open to everyone?`,
    answer: `${AESTHETICS} welcomes adults only. Treatments take place in private rooms.`,
  },
  {
    id: "real-brand",
    question: "Is Maison Élan a real brand?",
    answer:
      "Maison Élan and its four houses are a demonstration brand created by da Salon to show a fully branded booking site. Menus, prices and availability are live from da Salon; the house names and photographs are illustrative, and the memberships, packages and gift cards on this page are demonstrations.",
  },
];

/** Before you visit: an exclusive native accordion and the directory of addresses and hours. */
export function Visit() {
  return (
    <section id="visit" className={`${ui.section} ${ui.band}`} aria-labelledby="visit-title">
      <div className={ui.container}>
        <div className={ui.head}>
          <h2 id="visit-title" className={ui.h2} tabIndex={-1} data-mx-split="">
            Good to know.
          </h2>
        </div>

        <div className={styles.layout}>
          <div className={styles.faq}>
            {FAQS.map((faq, index) => (
              <details key={faq.id} name="faq" open={index === 0} className={styles.item}>
                <summary className={styles.summary}>
                  <span className={styles.question}>{faq.question}</span>
                  <Plus size={20} className={styles.icon} />
                </summary>
                <p className={styles.answer}>{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className={styles.directory}>
            <h3 className={styles.directoryTitle}>Addresses &amp; hours</h3>
            <p className={styles.directorySub}>All times are Singapore time (SGT).</p>
            <ul className={styles.houses}>
              {HOUSES.map((house) => (
                <li key={house.slug} className={styles.house}>
                  <h4 className={styles.houseName}>{house.name}</h4>
                  <p className={`${ui.label} ${styles.specialty}`}>{house.specialty}</p>
                  <p className={styles.line}>{house.address}</p>
                  <p className={`${styles.line} ${ui.num}`}>{house.hoursLabel}</p>
                  <div className={styles.links}>
                    <a
                      className={`${ui.btn} ${ui.textBtn}`}
                      href={house.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={ui.underline}>Directions</span>
                      <ArrowUpRight />
                      <span className={ui.srOnly}> to {house.name} (opens Google Maps)</span>
                    </a>
                    <BookButton house={house.slug} className={`${ui.btn} ${ui.textBtn}`} aria-label={`Book at ${house.name}`}>
                      <span className={ui.underline}>Book</span>
                    </BookButton>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
