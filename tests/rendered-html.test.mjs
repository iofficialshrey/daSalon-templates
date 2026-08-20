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
  assert.match(html, /Serein House/);
  assert.match(html, /Paloma/);
  assert.match(html, /Oru Spa/);
  assert.match(html, /Néroli House/);
  assert.match(html, /Coming soon/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("prerenders all standalone salon Brand Homes", async () => {
  const [brandHomeOne, brandHomeTwo, brandHomeThree, brandHomeFour, brandHomeFive, brandHomeSix] = await Promise.all([
    readRoute("brand-home-1.html"),
    readRoute("brand-home-2.html"),
    readRoute("brand-home-3.html"),
    readRoute("brand-home-4.html"),
    readRoute("brand-home-5.html"),
    readRoute("brand-home-6.html"),
  ]);

  assert.match(brandHomeOne, /<title>Maison Élan — Private Hair Atelier<\/title>/i);
  assert.match(brandHomeOne, /Book an appointment/i);
  assert.match(brandHomeTwo, /<title>Atelier — Beauty, Made Personal<\/title>/i);
  assert.match(brandHomeTwo, /Beauty, made/);
  assert.match(brandHomeThree, /<title>Serein House — The Luxury of Feeling Restored<\/title>/i);
  assert.match(brandHomeThree, /brand-home-3-site\/index\.html/);
  assert.match(brandHomeFour, /<title>Paloma — Hair, Form and Colour<\/title>/i);
  assert.match(brandHomeFour, /Form follows/);
  assert.match(brandHomeFive, /<title>Oru Spa \| Quiet Begins Here<\/title>/i);
  assert.match(brandHomeFive, /Quiet begins here/);
  assert.match(brandHomeSix, /<title>Néroli House \| Water, Warmth, Return<\/title>/i);
  assert.match(brandHomeSix, /Come back/);
  assert.match(brandHomeSix, /Rituals shaped around how you arrive/);
});

test("ships the Serein House entrance film at its runtime URL", async () => {
  const video = await stat(new URL("../public/assets/spa-entrance.mp4", import.meta.url));

  assert.ok(video.size > 1_000_000, "Serein House entrance film is missing or unexpectedly empty");
});

test("ships Maison Élan with both cinematic scrub clips", async () => {
  const html = await readRoute("brand-home-1.html");
  const [arrival, ritual] = await Promise.all([
    stat(new URL("../public/brand-home-1/scroll-film/leg-01.mp4", import.meta.url)),
    stat(new URL("../public/brand-home-1/scroll-film/leg-02.mp4", import.meta.url)),
  ]);

  assert.match(html, /<title>Maison Élan — Private Hair Atelier<\/title>/i);
  assert.match(html, /The ritual begins before the chair/);
  assert.match(html, /Arrive where care becomes ritual/);
  assert.ok(arrival.size > 1_000_000, "Maison Élan arrival clip is missing or unexpectedly empty");
  assert.ok(ritual.size > 1_000_000, "Maison Élan ritual clip is missing or unexpectedly empty");
});
