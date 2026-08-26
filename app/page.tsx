import Image from "next/image";
import { DASALON_LOGO } from "./brand-logos";

function Brand() {
  return (
    <a className="brand-lockup" href="#top" aria-label="da Salon Brand Home">
      <DASALON_LOGO aria-hidden="true" />
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-product">Brand Home</span>
    </a>
  );
}

export default function Home() {
  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <a className="header-link" href="#collection">
            Browse collection
          </a>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-inner">
            <p className="eyebrow">Custom da Salon experiences</p>
            <h1 id="page-title">Designed Around Your Brand, Built for Your Customers</h1>
            <p className="hero-copy">
            Your Brand. Your Experience. Your Digital Storefront.
            </p>
            <a className="hero-button" href="#collection">
              Explore Brand Homes <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="collection" id="collection" aria-labelledby="collection-title">
          <div className="collection-inner">
            <div className="collection-heading">
              <div>
                <p className="section-eyebrow">Brand Home collection</p>
                <h2 id="collection-title">Find the Perfect Look for Your Brand</h2>
              </div>
              <p>New Brand Homes will appear here as they are completed.</p>
            </div>

            <div className="brand-home-grid">
              <article className="brand-home-card brand-home-card-live">
                <a
                  className="brand-home-link"
                  href="/brand-home-1"
                  aria-label="Open the Maison Élan salon Brand Home"
                >
                  <div className="brand-home-preview brand-home-preview-live">
                    <Image
                      src="/brand-home-1/location-bandra.jpg"
                      alt="Fictional Maison Élan salon atelier"
                      fill
                      sizes="(max-width: 760px) 100vw, 50vw"
                    />
                    <div className="brand-home-preview-identity">
                      <span>Private hair atelier</span>
                      <strong>Maison Élan</strong>
                    </div>
                    <span className="brand-home-open">Explore Brand Home <span aria-hidden="true">↗</span></span>
                    <span className="brand-home-number">01</span>
                  </div>
                  <div className="brand-home-meta brand-home-meta-live">
                    <span>Maison Élan</span>
                    <span>Luxury salon · Live</span>
                  </div>
                </a>
              </article>

              <article className="brand-home-card brand-home-card-live">
                <a
                  className="brand-home-link"
                  href="/brand-home-2"
                  aria-label="Open the Atelier salon Brand Home"
                >
                  <div className="brand-home-preview brand-home-preview-live">
                    <Image
                      src="/brand-home-2/atelier-hero-higgsfield-clean.png"
                      alt="Atelier private beauty house with an elegant female model"
                      fill
                      sizes="(max-width: 760px) 100vw, 50vw"
                    />
                    <div className="brand-home-preview-identity">
                      <span>The private beauty house</span>
                      <strong>Atelier</strong>
                    </div>
                    <span className="brand-home-open">Explore Brand Home <span aria-hidden="true">↗</span></span>
                    <span className="brand-home-number">02</span>
                  </div>
                  <div className="brand-home-meta brand-home-meta-live">
                    <span>Atelier</span>
                    <span>Immersive salon · Live</span>
                  </div>
                </a>
              </article>

              <article className="brand-home-card brand-home-card-live">
                <a
                  className="brand-home-link"
                  href="/brand-home-3"
                  aria-label="Open the Serein House spa Brand Home"
                >
                  <div className="brand-home-preview brand-home-preview-live brand-home-preview-serein">
                    <video
                      src="/assets/spa-entrance.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                    />
                    <div className="brand-home-preview-identity">
                      <span>A luminous urban spa</span>
                      <strong>Serein House</strong>
                    </div>
                    <span className="brand-home-open">Explore Brand Home <span aria-hidden="true">↗</span></span>
                    <span className="brand-home-number">03</span>
                  </div>
                  <div className="brand-home-meta brand-home-meta-live">
                    <span>Serein House</span>
                    <span>Immersive spa · Live</span>
                  </div>
                </a>
              </article>

              <article className="brand-home-card brand-home-card-live">
                <a
                  className="brand-home-link"
                  href="/brand-home-4"
                  aria-label="Open the Paloma hair studio Brand Home"
                >
                  <div className="brand-home-preview brand-home-preview-live brand-home-preview-paloma">
                    <Image
                      src="/brand-home-4/hero-video-poster.jpg"
                      alt="Paloma model presenting the new hairstyle transformation film"
                      fill
                      sizes="(max-width: 760px) 100vw, 50vw"
                    />
                    <div className="brand-home-preview-identity">
                      <span>Hair, form and colour</span>
                      <strong>Paloma</strong>
                    </div>
                    <span className="brand-home-open">Explore Brand Home <span aria-hidden="true">↗</span></span>
                    <span className="brand-home-number">04</span>
                  </div>
                  <div className="brand-home-meta brand-home-meta-live">
                    <span>Paloma</span>
                    <span>Editorial salon · Live</span>
                  </div>
                </a>
              </article>

              <article className="brand-home-card brand-home-card-live">
                <a
                  className="brand-home-link"
                  href="/brand-home-5"
                  aria-label="Open the Oru spa Brand Home"
                >
                  <div className="brand-home-preview brand-home-preview-live brand-home-preview-oru">
                    <Image
                      src="/brand-home-5/oru-hero.png"
                      alt="The lavender-tiled thermal bath at Oru Spa"
                      fill
                      sizes="(max-width: 760px) 100vw, 50vw"
                    />
                    <div className="brand-home-preview-identity">
                      <span>A slower rhythm</span>
                      <strong>oru</strong>
                    </div>
                    <span className="brand-home-open">Explore Brand Home <span aria-hidden="true">↗</span></span>
                    <span className="brand-home-number">05</span>
                  </div>
                  <div className="brand-home-meta brand-home-meta-live">
                    <span>Oru Spa</span>
                    <span>Editorial urban spa · Live</span>
                  </div>
                </a>
              </article>

              <article className="brand-home-card brand-home-card-live">
                <a
                  className="brand-home-link"
                  href="/brand-home-6"
                  aria-label="Open the Néroli House spa Brand Home"
                >
                  <div className="brand-home-preview brand-home-preview-live brand-home-preview-neroli">
                    <Image
                      src="/brand-home-6/neroli-arrival.png"
                      alt="The luminous mineral-water interior of Néroli House"
                      fill
                      sizes="(max-width: 760px) 100vw, 50vw"
                    />
                    <div className="brand-home-preview-identity">
                      <span>Water, warmth, return</span>
                      <strong>Néroli House</strong>
                    </div>
                    <span className="brand-home-open">Explore Brand Home <span aria-hidden="true">↗</span></span>
                    <span className="brand-home-number">06</span>
                  </div>
                  <div className="brand-home-meta brand-home-meta-live">
                    <span>Néroli House</span>
                    <span>Scroll-led spa · Live</span>
                  </div>
                </a>
              </article>

            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-inner">
          <div>
            <Brand />
            <p>Custom frontends for salons and spas.</p>
          </div>
          <a href="#top">Back to top ↑</a>
        </div>
        <div className="footer-bottom">
          <span>da Salon</span>
          <span>Custom Brand Home collection</span>
        </div>
      </footer>
    </div>
  );
}
