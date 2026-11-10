import { ArrowDown, ArrowUp, ArrowUpRight, CalendarCheck, Gift, Smartphone, Sparkles, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { SereinCardFilm } from "./brand-home-3/components/collection-film";
import { DASALON_LOGO } from "./brand-logos";
import { BRAND_HOMES, INCLUDED, type IncludedIcon } from "./_home/data";
import { HomeHeader } from "./_home/header";
import styles from "./_home/home.module.css";
import { HomeMotion } from "./_home/motion";
import { StageControl } from "./_home/stage-control";

const ICONS: Record<IncludedIcon, LucideIcon> = {
  calendar: CalendarCheck,
  gift: Gift,
  phone: Smartphone,
  sparkle: Sparkles,
};

const DASALON_SITE = "https://www.dasalon.com";

/** Stagger for the hero's entrance and the stage's cycle, read by home.module.css. */
const delay = (ms: number) => ({ "--delay": ms }) as CSSProperties;
const slot = (index: number) => ({ "--i": index }) as CSSProperties;

export default function Home() {
  return (
    <div className={styles.page} id="top">
      <HomeHeader />

      <main>
        <section className={styles.hero} aria-labelledby="page-title">
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={`${styles.eyebrow} ${styles.enter}`}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Custom da Salon experiences
            </p>
            <h1 id="page-title" className={`${styles.title} ${styles.enter}`} style={delay(90)}>
              Designed Around Your Brand, Built for Your Customers
            </h1>
            <p className={`${styles.lede} ${styles.enter}`} style={delay(180)}>
              Your Brand. Your Experience. Your Digital Storefront.
            </p>
            <div className={`${styles.actions} ${styles.enter}`} style={delay(270)}>
              <a className={`${styles.button} ${styles.buttonPrimary}`} href="#collection">
                Explore Brand Homes
                <span className={`${styles.buttonIcon} ${styles.iconDown}`} aria-hidden="true">
                  <ArrowDown />
                </span>
              </a>
              <a className={`${styles.button} ${styles.buttonGhost}`} href="#included">
                See what&apos;s included
              </a>
            </div>
          </div>

          {/* A browser window that walks through the seven storefronts; the collection below is the real content. */}
          <div className={styles.stage} data-stage="">
            <div className={`${styles.stageFrame} ${styles.enter}`} style={delay(380)}>
              <div className={styles.window} data-stage-window="">
                <div className={styles.chrome}>
                  <div className={styles.dots} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className={styles.url} aria-hidden="true">
                    {BRAND_HOMES.map((home, index) => (
                      <span key={home.href} className={styles.urlItem} style={slot(index)}>
                        {home.href.slice(1)}
                        <b>{home.name}</b>
                      </span>
                    ))}
                  </div>
                  <StageControl />
                </div>
                <div className={styles.screen} aria-hidden="true">
                  {BRAND_HOMES.map((home, index) => (
                    <div key={home.href} className={styles.slide} style={slot(index)}>
                      <Image
                        src={home.still}
                        alt=""
                        fill
                        quality={60}
                        sizes="(min-width: 1240px) 1120px, calc(100vw - 40px)"
                        style={home.stillPosition ? { objectPosition: home.stillPosition } : undefined}
                        {...(index === 0 ? { loading: "eager" as const, fetchPriority: "high" as const } : { fetchPriority: "low" as const })}
                      />
                      <p className={styles.slideCaption}>
                        <span>{home.number}</span>
                        <strong>{home.name}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.phone} data-stage-phone="" aria-hidden="true">
                <div className={styles.phoneScreen}>
                  <Image src="/brand-home-4/film/paloma-film-576x768-last.v2.jpg" alt="" fill quality={60} sizes="200px" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="collection" className={styles.section} aria-labelledby="collection-title">
          <div className={styles.sectionHead} data-reveal="">
            <div>
              <p className={styles.kicker}>Brand Home collection</p>
              <h2 id="collection-title" className={styles.h2} tabIndex={-1}>
                Find the Perfect Look for Your Brand
              </h2>
            </div>
            <p className={styles.sectionNote}>
              Seven live storefronts on one booking engine, each built to feel like its own brand. New Brand Homes will
              appear here as they are completed.
            </p>
          </div>

          <ul className={styles.grid}>
            {BRAND_HOMES.map((home) => (
              <li key={home.href} data-reveal="">
                <a className={styles.card} href={home.href} aria-label={home.label}>
                  <div className={styles.media}>
                    <div className={styles.mediaInner} data-parallax="">
                      {home.image ? (
                        <Image
                          src={home.image.src}
                          alt={home.image.alt}
                          fill
                          sizes="(min-width: 1320px) 616px, (min-width: 760px) 46vw, calc(100vw - 40px)"
                          style={home.image.position ? { objectPosition: home.image.position } : undefined}
                        />
                      ) : (
                        <SereinCardFilm />
                      )}
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.cardNumber}>{home.number}</span>
                    <h3 className={styles.cardName}>{home.name}</h3>
                    <p className={styles.cardTagline}>{home.tagline}</p>
                    <p className={styles.cardKind}>{home.kind}</p>
                    <span className={styles.cardArrow} aria-hidden="true">
                      <ArrowUpRight />
                    </span>
                  </div>
                </a>
              </li>
            ))}
            <li data-reveal="">
              <div className={styles.next}>
                <div>
                  <p className={styles.kicker}>Next in the collection</p>
                  <h3 className={styles.nextTitle}>Your brand could be next.</h3>
                  <p className={styles.nextBody}>
                    Every Brand Home starts from your story, your guests and the way they like to book.
                  </p>
                </div>
                <a
                  className={`${styles.button} ${styles.buttonDark}`}
                  href={DASALON_SITE}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Talk to da Salon
                  <span className={`${styles.buttonIcon} ${styles.iconOut}`} aria-hidden="true">
                    <ArrowUpRight />
                  </span>
                  <span className={styles.srOnly}> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          </ul>
        </section>

        <section id="included" className={styles.section} aria-labelledby="included-title">
          <div className={styles.sectionHead} data-reveal="">
            <div>
              <p className={styles.kicker}>In every Brand Home</p>
              <h2 id="included-title" className={styles.h2} tabIndex={-1}>
                Built to book, not just to look good.
              </h2>
            </div>
            <p className={styles.sectionNote}>
              Each storefront has its own look and voice, on the same dependable daSalon foundation.
            </p>
          </div>
          <ul className={styles.included}>
            {INCLUDED.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.title} className={styles.includedItem} data-reveal="">
                  <span className={styles.includedIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <h3 className={styles.includedTitle}>{item.title}</h3>
                  <p className={styles.includedBody}>{item.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerStatement} data-reveal="">
            Your brand. Your experience. <em>Your digital storefront.</em>
          </p>
          <div className={styles.footerActions} data-reveal="">
            <a className={`${styles.button} ${styles.buttonLight}`} href="#collection">
              Browse the collection
              <span className={`${styles.buttonIcon} ${styles.iconUp}`} aria-hidden="true">
                <ArrowUp />
              </span>
            </a>
            <a className={`${styles.button} ${styles.footerGhost}`} href={DASALON_SITE} target="_blank" rel="noopener noreferrer">
              Visit dasalon.com
              <span className={styles.srOnly}> (opens in a new tab)</span>
            </a>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerLockup}>
              <DASALON_LOGO aria-hidden="true" focusable="false" />
              <span className={styles.srOnly}>da Salon</span>
              <span className={styles.lockupDivider} aria-hidden="true" />
              <span className={styles.lockupProduct}>Brand Home</span>
            </p>
            <p className={styles.footerNote}>Custom frontends for salons and spas.</p>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#top">
                  Back to top <ArrowUp aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      <HomeMotion />
    </div>
  );
}
