import { DASALON_LOGO } from "./brand-logos";

const templateSlots = Array.from({ length: 4 }, (_, index) => index + 3);

function Brand() {
  return (
    <a className="brand-lockup" href="#top" aria-label="da Salon Templates home">
      <DASALON_LOGO aria-hidden="true" />
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-product">Templates</span>
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
              Explore templates <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="collection" id="collection" aria-labelledby="collection-title">
          <div className="collection-inner">
            <div className="collection-heading">
              <div>
                <p className="section-eyebrow">Template collection</p>
                <h2 id="collection-title">Find the Perfect Look for Your Brand</h2>
              </div>
              <p>New templates will appear here as they are completed.</p>
            </div>

            <div className="template-grid">
              <article className="template-card template-card-live">
                <a
                  className="template-link"
                  href="/template-1"
                  aria-label="Open the Maison Élan salon template"
                >
                  <div className="template-preview template-preview-live">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/template-1/location-bandra.jpg"
                      alt="Fictional Maison Élan salon atelier"
                      width={1536}
                      height={1024}
                    />
                    <div className="template-preview-identity">
                      <span>Private hair atelier</span>
                      <strong>Maison Élan</strong>
                    </div>
                    <span className="template-open">Explore template <span aria-hidden="true">↗</span></span>
                    <span className="template-number">01</span>
                  </div>
                  <div className="template-meta template-meta-live">
                    <span>Maison Élan</span>
                    <span>Luxury salon · Live</span>
                  </div>
                </a>
              </article>

              <article className="template-card template-card-live">
                <a
                  className="template-link"
                  href="/template-2"
                  aria-label="Open the Atelier salon template"
                >
                  <div className="template-preview template-preview-live">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/template-2/atelier-hero-higgsfield-clean.png"
                      alt="Atelier private beauty house with an elegant female model"
                      width={2048}
                      height={1152}
                    />
                    <div className="template-preview-identity">
                      <span>The private beauty house</span>
                      <strong>Atelier</strong>
                    </div>
                    <span className="template-open">Explore template <span aria-hidden="true">↗</span></span>
                    <span className="template-number">02</span>
                  </div>
                  <div className="template-meta template-meta-live">
                    <span>Atelier</span>
                    <span>Immersive salon · Live</span>
                  </div>
                </a>
              </article>

              {templateSlots.map((slot) => (
                <article className="template-card" key={slot}>
                  <div
                    className="template-preview"
                    aria-label={`Reserved template space ${slot}`}
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
                    <span className="template-number">
                      {String(slot).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="template-meta">
                    <span>Template space</span>
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
          <span>Custom template collection</span>
        </div>
      </footer>
    </div>
  );
}
