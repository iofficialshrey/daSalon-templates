import { DASALON_LOGO } from "./brand-logos";

const brandHomeSlots = Array.from({ length: 3 }, (_, index) => index + 4);

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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand-home-1/location-bandra.jpg"
                      alt="Fictional Maison Élan salon atelier"
                      width={1536}
                      height={1024}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand-home-2/atelier-hero-higgsfield-clean.png"
                      alt="Atelier private beauty house with an elegant female model"
                      width={2048}
                      height={1152}
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

              {brandHomeSlots.map((slot) => (
                <article className="brand-home-card" key={slot}>
                  <div
                    className="brand-home-preview"
                    aria-label={`Reserved Brand Home space ${slot}`}
                  >
                    <div className="preview-toolbar" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <i />
                    </div>
                    <div className="preview-placeholder" aria-hidden="true">
                      <span className="placeholder-label" />
                      <span className="placeholder-title" />
                      <span className="placeholder-title placeholder-title-short" />
                      <span className="placeholder-button" />
                    </div>
                    <span className="brand-home-number">
                      {String(slot).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="brand-home-meta">
                    <span>Brand Home space</span>
                    <span>Coming soon</span>
                  </div>
                </article>
              ))}
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
