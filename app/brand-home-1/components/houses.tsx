import Image from "next/image";
import { HOUSES } from "../data/houses";
import { ArrowRight, Pin } from "./icons";
import {
  ExtraHouses,
  HouseBook,
  HouseMetaLine,
  HouseOpen,
  HousesPrefetch,
  HouseStageSync,
  HouseStatusLine,
} from "./houses-live";
import s from "./houses.module.css";
import ui from "./ui.module.css";

/**
 * The houses. Desktop: an arch-framed photograph holds still on the left while the four
 * houses pass on the right, and each one's room wipes into the arch as it reaches the middle
 * of the screen. Tablet: a two-column grid. Phones: a swipeable rail of arch cards.
 * Server-rendered with the static facts; live status, meta and the triggers hydrate as islands.
 */
export function Houses() {
  return (
    <section id="houses" className={`${ui.section} ${s.root}`} aria-labelledby="houses-title">
      <HousesPrefetch />
      <div className={ui.containerWide}>
        <div className={`${ui.head} ${s.head}`}>
          <h2 id="houses-title" className={ui.h2} tabIndex={-1} data-mx-split="">
            Four houses, one quiet standard.
          </h2>
          <div className={`${ui.headText} ${ui.reveal2}`}>
            <p className={ui.lead}>
              Each house keeps its own specialists and its own menu. All four share the same manners, and honour the
              same memberships and gift cards.
            </p>
          </div>
        </div>

        <div className={s.stage} data-house-stage="">
          {/* Desktop only: the arch that holds the current house's room. Decorative; each entry carries its own name and actions. */}
          <div className={s.aside} aria-hidden="true">
            <div className={s.arch}>
              {HOUSES.map((house, index) => (
                <div key={house.slug} className={s.archFrame} data-house-frame={index} data-current={index === 0 ? "" : undefined}>
                  <Image
                    src={house.image}
                    alt=""
                    quality={75}
                    sizes="(min-width: 1100px) 40vw, 1px"
                    className={s.archImg}
                  />
                </div>
              ))}
              <span className={s.archLine} />
            </div>
            <div className={s.caption}>
              <span className={`${s.count} ${ui.num}`}>
                <span className={s.countNow} data-house-count="">01</span>
                <span className={s.countSep}>/</span>
                {String(HOUSES.length).padStart(2, "0")}
              </span>
              <span className={s.captionLines}>
                {HOUSES.map((house, index) => (
                  <span key={house.slug} className={s.captionLine} data-house-caption={index} data-current={index === 0 ? "" : undefined}>
                    {house.namedFor}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <ul className={s.list}>
            {HOUSES.map((house, index) => (
              <li key={house.slug} className={s.entry} data-house-entry={index}>
                <div className={s.media}>
                  <Image
                    src={house.image}
                    alt={house.imageAlt}
                    quality={60}
                    sizes="(max-width: 759px) 82vw, (max-width: 1099px) 45vw, 1px"
                    className={s.mediaImg}
                  />
                </div>
                <div className={s.body}>
                  <p className={s.kind}>
                    <span className={`${s.no} ${ui.num}`}>{house.number}</span>
                    <span>{house.label}</span>
                  </p>
                  <h3 className={s.name}>
                    {/* Stretched over the card's photograph on phones and tablets. */}
                    <HouseOpen slug={house.slug} className={s.open}>
                      <span className={s.nameText}>{house.name}</span>
                    </HouseOpen>
                  </h3>
                  <p className={s.blurb}>{house.blurb}</p>
                  <div className={s.facts}>
                    <p className={s.where}>
                      <Pin size={16} />
                      <span>
                        <span className={s.area}>{house.area}</span>
                        <span className={s.address}>{house.address}</span>
                      </span>
                    </p>
                    {house.note ? <p className={s.note}>{house.note}</p> : null}
                    <HouseStatusLine slug={house.slug} className={s.status} />
                    <HouseMetaLine slug={house.slug} className={s.meta} />
                  </div>
                  <div className={s.actions}>
                    <HouseBook slug={house.slug} className={`${ui.btn} ${ui.primary} ${s.book}`}>
                      Book here<span className={ui.srOnly}>, {house.name}</span>
                    </HouseBook>
                    <HouseOpen slug={house.slug} className={`${ui.btn} ${ui.textBtn} ${s.view}`}>
                      <span className={ui.underline}>View the house</span>
                      <span className={ui.srOnly}>: {house.name}</span>
                      <ArrowRight />
                    </HouseOpen>
                  </div>
                </div>
              </li>
            ))}
            <ExtraHouses />
          </ul>
        </div>

        <p className={s.footnote}>Photographs are illustrative.</p>
      </div>
      <HouseStageSync />
    </section>
  );
}
