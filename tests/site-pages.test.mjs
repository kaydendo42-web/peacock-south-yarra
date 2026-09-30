import test from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL;
async function main(path) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200);
  const html = await response.text();
  return html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || "";
}

test(
  "review board renders Henry with his photo and keeps imagined-review disclosure",
  { skip: !base },
  async () => {
    const html = await main("/");
    assert.match(html, /<h3[^>]*>Henry<\/h3>/);
    assert.match(html, /dog-henry/);
    assert.match(html, /Imagined reviews/);
  },
);

test(
  "menu shows the printed food and drinks menus, without promo cards or doodles",
  { skip: !base },
  async () => {
    const html = await main("/menu");
    assert.doesNotMatch(html, /class="menu-featured/);
    assert.doesNotMatch(html, /Search the menu/);
    assert.doesNotMatch(html, /menu-doodles/);
    assert.match(html, /Blueberry Honeycomb Hotcakes/);
  },
);

test(
  "Our Place shows the supplied interior instead of the Find Us shopfront",
  { skip: !base },
  async () => {
    const html = await main("/about");
    assert.match(html, /peacock-interior/);
    assert.doesNotMatch(html, /shopfront.webp/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
  },
);
