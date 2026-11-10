import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const appOutput = new URL("../.next/server/app/", import.meta.url);

function readRoute(fileName) {
  return readFile(new URL(fileName, appOutput), "utf8");
}

test("renders da Salon Brand Home", async () => {
  const html = await readRoute("index.html");

  assert.match(html, /<title>da Salon Brand Home<\/title>/i);
  assert.match(html, /Designed Around Your Brand, Built for Your Customers/);
  assert.match(html, /href="\/brand-home-1"/);
  assert.match(html, /href="\/brand-home-2"/);
  assert.match(html, /href="\/brand-home-3"/);
  assert.match(html, /href="\/brand-home-4"/);
  assert.match(html, /href="\/brand-home-5"/);
  assert.match(html, /href="\/brand-home-6"/);
  assert.match(html, /href="\/brand-home-7"/);
  assert.match(html, /Serein House/);
  assert.match(html, /Paloma/);
  assert.match(html, /Oru Spa/);
  assert.match(html, /Néroli House/);
  assert.match(html, /STUDIO \/ 07/);
  assert.doesNotMatch(html, /Coming soon|Reserved Brand Home space 7/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("prerenders all standalone salon Brand Homes", async () => {
  const [brandHomeOne, brandHomeTwo, brandHomeThree, brandHomeFour, brandHomeFive, brandHomeSix, brandHomeSeven] = await Promise.all([
    readRoute("brand-home-1.html"),
    readRoute("brand-home-2.html"),
    readRoute("brand-home-3.html"),
    readRoute("brand-home-4.html"),
    readRoute("brand-home-5.html"),
    readRoute("brand-home-6.html"),
    readRoute("brand-home-7.html"),
  ]);

  assert.match(brandHomeOne, /<title>Maison Élan — Four Houses of Care in Singapore<\/title>/i);
  assert.match(brandHomeOne, /Book an appointment/i);
  assert.match(brandHomeOne, /Book a visit/);
  assert.match(brandHomeTwo, /<title>Atelier — Beauty, Made Personal in Singapore<\/title>/);
  assert.match(brandHomeTwo, /Beauty, made/);
  assert.match(brandHomeThree, /<title>Serein House — The Luxury of Feeling Restored<\/title>/i);
  assert.match(brandHomeThree, /Come back/);
  assert.match(brandHomeFour, /<title>Paloma — Hair, Form and Colour<\/title>/i);
  assert.match(brandHomeFour, /Form<\/span>(?:\s|<!-- -->)*<span[^>]*>follows<\/span>(?:\s|<!-- -->)*<span[^>]*>feeling\./);
  assert.match(brandHomeFive, /<title>Oru Spa \| The Art of Exhale<\/title>/i);
  assert.match(brandHomeFive, /Choose what you need, not what you should/);
  assert.match(brandHomeFive, /The art of/);
  assert.match(brandHomeSix, /<title>Néroli House \| Water, Warmth, Return<\/title>/i);
  assert.match(brandHomeSix, /Come back/);
  assert.match(brandHomeSix, /Rituals shaped around how you arrive/);
  assert.match(brandHomeSeven, /<title>STUDIO \/ 07 — Look Like You Mean It<\/title>/i);
  assert.match(brandHomeSeven, /MAKE AN/);
  assert.match(brandHomeSeven, /ENTRANCE/);
  assert.match(brandHomeSeven, /THE SIGNATURE EDIT/);
  assert.match(brandHomeSeven, /Book appointment/);
});

test("features the final Oru Template 5 on the collection page", async () => {
  const collection = await readRoute("index.html");

  assert.match(collection, /href="\/brand-home-5"/);
  assert.match(collection, /url=%2Fbrand-home-5%2Foru-hero\.png/);
  assert.match(collection, /url=%2Fbrand-home-4%2Ffilm%2Fpaloma-film-1280x720-last\.v2\.jpg/);
  assert.match(collection, /Editorial urban spa · Live/);
  assert.doesNotMatch(collection, /brand-home-5-rework/);
  assert.doesNotMatch(collection, /url=%2Fbrand-home-4%2Fhero\.png/);
});

test("ships the Serein House entrance film at its runtime URL", async () => {
  const video = await stat(new URL("../public/assets/spa-entrance.mp4", import.meta.url));

  assert.ok(video.size > 1_000_000, "Serein House entrance film is missing or unexpectedly empty");
});

test("ships Serein House's entrance film and its four Singapore places", async () => {
  const [html, collection] = await Promise.all([readRoute("brand-home-3.html"), readRoute("index.html")]);
  const film = (name) => stat(new URL(`../public/brand-home-3/film/${name}`, import.meta.url));
  const [landscape, portrait, portraitSafe, card] = await Promise.all([
    film("serein-film-1280x720.v1.mp4"),
    film("serein-film-576x768.v1.mp4"),
    film("serein-film-576x768-safe.v1.mp4"),
    film("serein-card-960x540.v1.mp4"),
  ]);

  assert.match(html, /<title>Serein House — The Luxury of Feeling Restored<\/title>/i);
  assert.match(html, /Come back/);
  assert.match(html, /feeling restored\./);
  assert.match(html, /Leave the pace/);
  assert.match(html, /What do you/);
  assert.match(html, /serein-film-1280x720-first\.v1/);
  assert.match(html, /data-film-landscape="\/brand-home-3\/film\/serein-film-1280x720\.v1\.mp4"/);
  assert.match(html, /data-film-portrait="\/brand-home-3\/film\/serein-film-576x768\.v1\.mp4"/);
  assert.match(html, /data-film-safe="\/brand-home-3\/film\/serein-film-576x768-safe\.v1\.mp4"/);
  assert.match(html, /Serenity Spa House/);
  assert.match(html, /463 Clementi Road/);
  assert.match(html, /60 Airport Boulevard/);
  assert.match(html, /24 Sentosa Gateway/);
  assert.match(html, /Skip the entrance/);
  assert.match(html, /Powered by da Salon/);
  assert.doesNotMatch(html, /Mumbai|Delhi|Bengaluru|₹|Ananya|sereinhouse\.example|brand-home-3-site|<iframe|spa-entrance\.mp4|Reserve|Hold this space|not purchasable|Restore Circle/);
  assert.match(collection, /\/brand-home-3\/film\/serein-card-960x540\.v1\.mp4/);
  assert.doesNotMatch(collection, /\/assets\/spa-entrance\.mp4/);
  assert.ok(landscape.size > 1_000_000, "Serein landscape film encode is missing or unexpectedly empty");
  for (const [label, file] of [["portrait", portrait], ["portrait-safe", portraitSafe], ["card", card]]) {
    assert.ok(file.size > 300_000, `Serein ${label} film encode is missing or unexpectedly empty`);
  }
});

test("features Atelier's private beauty house card on the collection page", async () => {
  const collection = await readRoute("index.html");

  assert.match(collection, /href="\/brand-home-2"/);
  assert.match(collection, /url=%2Fbrand-home-2%2Fart%2Fcover-1200x675\.v1\.jpg/);
  assert.match(collection, /Beauty, made personal/);
  assert.match(collection, /Private beauty house · Live/);
  assert.doesNotMatch(collection, /atelier-hero-higgsfield-clean|made to measure|Couture lookbook|Immersive salon · Live/);
});

test("ships Atelier's walk-through film and its four atelier pages", async () => {
  const [html, groomingRoom] = await Promise.all([
    readRoute("brand-home-2.html"),
    readRoute("brand-home-2/ateliers/the-grooming-room.html"),
  ]);
  const film = (name) => stat(new URL(`../public/brand-home-2/film/${name}`, import.meta.url));
  const [master, landscape, portrait, portraitSafe] = await Promise.all([
    // The original master stays on disk, unreferenced by the page.
    stat(new URL("../public/brand-home-2/atelier-entry.mp4", import.meta.url)),
    film("atelier-film-1280x720.v1.mp4"),
    film("atelier-film-576x768.v1.mp4"),
    film("atelier-film-576x768-safe.v1.mp4"),
  ]);

  assert.match(html, /<title>Atelier — Beauty, Made Personal in Singapore<\/title>/);
  assert.match(html, /Beauty, made/);
  // Fictional atelier names; the live venues stay bound by slug.
  for (const name of ["The Clementi Atelier", "The Garden Spa", "The Changi Studio", "The Sentosa Suite"]) {
    assert.match(html, new RegExp(name));
  }
  assert.doesNotMatch(html, /The Grooming Room|Serenity Spa House|Lumiere Aesthetics|Bride &amp; Groom/);
  // The lookbook direction is retired: no stencils, garment tags or fashion names.
  assert.doesNotMatch(html, /katagami|The Toile|Carte Blanche|Trousseau|Look 0[1-4]/i);
  assert.match(html, /Your hour, at any atelier/);
  assert.match(html, /Book an appointment/);
  assert.match(html, /atelier-film-1280x720-first\.v1/);
  assert.match(html, /data-film-landscape="\/brand-home-2\/film\/atelier-film-1280x720\.v1\.mp4"/);
  assert.doesNotMatch(html, /Mumbai|Bengaluru|Bandra Atelier|Lodhi|Indiranagar|atelier-entry-higgsfield/);
  assert.ok(master.size > 1_000_000, "Atelier master film is missing or unexpectedly empty");
  for (const [label, file] of [["landscape", landscape], ["portrait", portrait], ["portrait-safe", portraitSafe]]) {
    assert.ok(file.size > 1_000_000, `Atelier ${label} film encode is missing or unexpectedly empty`);
  }

  assert.match(groomingRoom, /The Clementi Atelier/);
  assert.match(groomingRoom, /463 Clementi Road/);
  assert.doesNotMatch(groomingRoom, /The Grooming Room|katagami/);
  assert.doesNotMatch(groomingRoom, /Mumbai|Bengaluru|Bandra Atelier|Lodhi|Indiranagar/);
});

test("ships Paloma's Issue 04 cover film and four Singapore studios", async () => {
  const html = await readRoute("brand-home-4.html");
  const film = (name) => stat(new URL(`../public/brand-home-4/film/${name}`, import.meta.url));
  const [landscape, portrait] = await Promise.all([
    film("paloma-film-1280x720.v2.mp4"),
    film("paloma-film-576x768.v2.mp4"),
  ]);

  assert.match(html, /Form<\/span>(?:\s|<!-- -->)*<span[^>]*>follows<\/span>(?:\s|<!-- -->)*<span[^>]*>feeling\./);
  assert.match(html, /data-film-landscape="\/brand-home-4\/film\/paloma-film-1280x720\.v2\.mp4"/);
  assert.match(html, /data-film-portrait="\/brand-home-4\/film\/paloma-film-576x768\.v2\.mp4"/);
  assert.match(html, /paloma-film-1280x720-first\.v2/);
  assert.match(html, /463 Clementi Road/);
  assert.match(html, /60 Airport Boulevard/);
  assert.match(html, /24 Sentosa Gateway/);
  assert.match(html, /Book the look/);
  assert.match(html, /Powered by da Salon/);
  assert.doesNotMatch(html, /Mumbai|Delhi|Bengaluru|Goa|22 artists|every city|BOM \/ 01/);
  for (const [label, file] of [["landscape", landscape], ["portrait", portrait]]) {
    assert.ok(file.size > 300_000, `Paloma ${label} film encode is missing or unexpectedly empty`);
  }
});

test("ships Maison Élan's arrival film as one continuous scrub encode", async () => {
  const html = await readRoute("brand-home-1.html");
  const film = (name) => stat(new URL(`../public/brand-home-1/scroll-film/${name}`, import.meta.url));
  const [arrival, ritual, desktop, portrait, portraitSafe] = await Promise.all([
    film("leg-01.mp4"),
    film("leg-02.mp4"),
    film("maison-film-1280x720.v3.mp4"),
    film("maison-film-576x768.v3.mp4"),
    film("maison-film-576x768-safe.v3.mp4"),
  ]);

  assert.match(html, /<title>Maison Élan — Four Houses of Care in Singapore<\/title>/i);
  assert.match(html, /The hour is yours/);
  assert.match(html, /One guest, one suite, our full attention/);
  assert.match(html, /maison-film-1280x720-first\.v3/);
  assert.doesNotMatch(html, /maison-elan-hero\.mp4|Mumbai|Bengaluru|maison-film[^"]*\.v2\./);
  // The four houses carry fictional names; the live venues they book stay bound by slug.
  for (const name of ["Bronze House", "Travertine House", "Walnut House", "Ivory House"]) {
    assert.match(html, new RegExp(name));
  }
  assert.doesNotMatch(html, /The Grooming Room|Lumiere Aesthetics|Serenity Spa House|Bride &amp; Groom/);
  // Memberships, packages and gift cards are tabs whose panels keep their jump targets.
  assert.match(html, /role="tablist"/);
  for (const id of ["memberships", "packages", "gift-cards"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.ok(arrival.size > 1_000_000, "Maison Élan arrival master clip is missing or unexpectedly empty");
  assert.ok(ritual.size > 1_000_000, "Maison Élan ritual master clip is missing or unexpectedly empty");
  for (const [label, file] of [["desktop", desktop], ["portrait", portrait], ["portrait-safe", portraitSafe]]) {
    assert.ok(file.size > 1_000_000, `Maison Élan ${label} film encode is missing or unexpectedly empty`);
  }
});

test("ships STUDIO / 07 with the approved hero still", async () => {
  const html = await readRoute("brand-home-7.html");
  const hero = await stat(new URL("../public/brand-home-7/hero-desktop.jpg", import.meta.url));

  assert.match(html, /YOU KNOW THAT FEELING/);
  assert.match(html, /MAKE AN/);
  assert.match(html, /Your next look starts with you/);
  assert.match(html, /THE INNER[\s\S]*CIRCLE/);
  assert.match(html, /THE PEOPLE BEHIND THE LOOK/);
  assert.match(html, /Find your look/);
  assert.match(html, /url=%2Fbrand-home-7%2Fhero-desktop\.jpg/);
  assert.ok(hero.size > 20_000, "STUDIO / 07 hero still is missing or unexpectedly empty");
});
