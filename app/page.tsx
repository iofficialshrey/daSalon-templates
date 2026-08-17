import { DASALON_LOGO } from "./brand-logos";

const templateSlots = Array.from({ length: 6 }, (_, index) => index + 1);

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
