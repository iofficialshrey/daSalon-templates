import { GIFT_CARDS, MEMBERSHIPS, PACKAGES, type Offer } from "../data/offers";
import { Info } from "./icons";
import { PrivilegeCard, PrivilegeRail } from "./privilege-card";
import { PrivilegeTabs, type PrivilegeTab } from "./privilege-tabs";
import styles from "./privileges.module.css";
import ui from "./ui.module.css";

type Block = PrivilegeTab & {
  id: "memberships" | "packages" | "gift-cards";
  itemLabel: string;
  offers: readonly Offer[];
};

const BLOCKS: readonly Block[] = [
  {
    id: "memberships",
    label: "Membership",
    title: "Credit, and quiet savings.",
    text: "Two credit wallets and a discount plan. Buy at any house; use it at all four.",
    itemLabel: "membership",
    offers: MEMBERSHIPS,
    count: MEMBERSHIPS.length,
  },
  {
    id: "packages",
    label: "Packages",
    title: "For the regular visit.",
    text: "Sessions, time or value, bought once at a better rate and booked as you go, at the house named on the card.",
    itemLabel: "package",
    offers: PACKAGES,
    count: PACKAGES.length,
  },
  {
    id: "gift-cards",
    label: "Gift cards",
    title: "Give them an afternoon.",
    text: "For someone you love, or kept for yourself. Honoured at all four houses.",
    itemLabel: "gift card",
    offers: GIFT_CARDS,
    count: GIFT_CARDS.length,
  },
];

const TABS: readonly PrivilegeTab[] = BLOCKS.map(({ id, label, title, text, count }) => ({ id, label, title, text, count }));

/** Memberships, packages and gift cards: three tabs on walnut, one card style, one demo checkout. */
export function Privileges() {
  return (
    <section id="privileges" className={`${ui.section} ${ui.onDark} ${styles.root}`} aria-labelledby="privileges-title">
      <div className={styles.glow} aria-hidden="true" />
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <h2 id="privileges-title" className={ui.h2} tabIndex={-1} data-jump-focus="" data-mx-split="">
            Ways to return.
          </h2>
          <div className={`${ui.headText} ${ui.reveal2}`}>
            <p className={`${ui.lead} ${styles.lead}`}>
              Membership credit, packages for the regular visit and gift cards, honoured across the houses.
            </p>
          </div>
        </div>

        <PrivilegeTabs tabs={TABS}>
          {BLOCKS.map((block) => (
            <PrivilegeRail
              key={block.id}
              labelledBy={`${block.id}-title`}
              itemLabel={block.itemLabel}
              total={block.offers.length}
            >
              {block.offers.map((offer) => (
                <li key={offer.id} className={styles.item}>
                  <PrivilegeCard offer={offer} />
                </li>
              ))}
            </PrivilegeRail>
          ))}
        </PrivilegeTabs>

        <p className={styles.note}>
          <Info size={16} />
          <span>
            Memberships, packages and gift cards on this page are a demonstration. No payment is taken, and details you
            enter stay in this browser tab.
          </span>
        </p>
      </div>
    </section>
  );
}
