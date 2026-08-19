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
  assert.match(html, /Serein House/);
  assert.match(html, /Coming soon/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("prerenders all standalone salon Brand Homes", async () => {
  const [brandHomeOne, brandHomeTwo, brandHomeThree, brandHomeFour] = await Promise.all([
    readRoute("brand-home-1.html"),
    readRoute("brand-home-2.html"),
    readRoute("brand-home-3.html"),
    readRoute("brand-home-4.html"),
  ]);

  assert.match(brandHomeOne, /<title>Maison Élan — Private Hair Atelier<\/title>/i);
  assert.match(brandHomeOne, /Book an appointment/i);
  assert.match(brandHomeTwo, /<title>Atelier — Beauty, Made Personal<\/title>/i);
  assert.match(brandHomeTwo, /Beauty, made/);
  assert.match(brandHomeThree, /<title>Serein House — The Luxury of Feeling Restored<\/title>/i);
  assert.match(brandHomeThree, /brand-home-3-site\/index\.html/);
  assert.match(brandHomeFour, /<title>Paloma — Hair, Form and Colour<\/title>/i);
  assert.match(brandHomeFour, /Form follows/);
});

test("ships the Serein House entrance film at its runtime URL", async () => {
  const video = await stat(new URL("../public/assets/spa-entrance.mp4", import.meta.url));

  assert.ok(video.size > 1_000_000, "Serein House entrance film is missing or unexpectedly empty");
});
