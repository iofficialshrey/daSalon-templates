import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appOutput = new URL("../.next/server/app/", import.meta.url);

function readRoute(fileName) {
  return readFile(new URL(fileName, appOutput), "utf8");
}

test("renders the da Salon template collection", async () => {
  const html = await readRoute("index.html");

  assert.match(html, /<title>Da Salon — Custom Templates<\/title>/i);
  assert.match(html, /Designed Around Your Brand, Built for Your Customers/);
  assert.match(html, /href="\/template-1"/);
  assert.match(html, /href="\/template-2"/);
  assert.match(html, /Coming soon/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("prerenders both salon templates", async () => {
  const [templateOne, templateTwo] = await Promise.all([
    readRoute("template-1.html"),
    readRoute("template-2.html"),
  ]);

  assert.match(templateOne, /<title>Maison Élan — Private Hair Atelier<\/title>/i);
  assert.match(templateOne, /Book an appointment/i);
  assert.match(templateTwo, /<title>Atelier — Beauty, Made Personal<\/title>/i);
  assert.match(templateTwo, /Beauty, made/);
});
