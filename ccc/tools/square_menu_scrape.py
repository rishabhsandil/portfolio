import json
import re
import sys
from dataclasses import dataclass
from typing import List, Optional

from playwright.sync_api import sync_playwright


URL = "https://chaicoffeecompany.square.site/s/order?item=all&location=LECM71VC99CEN"


@dataclass
class MenuItem:
    name: str
    description: str
    price: str


@dataclass
class MenuCategory:
    name: str
    items: List[MenuItem]


def _clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def scrape_square_menu(url: str) -> List[MenuCategory]:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Square's order page often keeps long-lived requests open, so `networkidle`
        # can hang. Use DOMContentLoaded + a content selector instead.
        page.goto(url, wait_until="domcontentloaded", timeout=120_000)
        page.wait_for_selector("text=Most popular", timeout=120_000)
        page.wait_for_timeout(1500)

        # Square's Order page renders menu groups as headings, with items under each.
        # We'll gather all headings and then crawl following siblings to collect item cards.
        # This is resilient-ish because we rely on text content rather than exact classnames.

        # Categories are rendered as H2 headings.
        cat_headings = page.locator("h2")
        heading_count = cat_headings.count()

        categories: List[MenuCategory] = []
        for i in range(heading_count):
            h = cat_headings.nth(i)
            title = _clean_text(h.inner_text())
            if not title:
                continue

            # Find an ancestor container that includes the item list (prices appear as CAD$...).
            h_handle = h.element_handle()
            if h_handle is None:
                continue
            container_handle = h_handle.evaluate_handle(
                """(node) => {
                  let el = node;
                  while (el && el !== document.body) {
                    const t = el.innerText || '';
                                        if (t.includes('CAD$')) {
                                            const h2s = el.querySelectorAll('h2');
                                            if (h2s && h2s.length === 1) return el;
                                        }
                    el = el.parentElement;
                  }
                  return null;
                }"""
            )
            if container_handle is None:
                continue

            texts = container_handle.evaluate("(el) => el.innerText || ''")
            if not isinstance(texts, str) or "CAD$" not in texts:
                continue

            lines = [ln.strip() for ln in texts.splitlines() if ln.strip()]

            # Parse items: pattern is typically:
            #   Item Name
            #   Description (optional, may be multiple lines)
            #   CAD$X.XX
            # There may be "Sale" or availability lines in between.
            items: List[MenuItem] = []
            idx = 0
            while idx < len(lines):
                line = lines[idx]

                # Skip the section title if it appears in the text flow.
                if line == title:
                    idx += 1
                    continue

                # Stop if we hit next section-ish marker.
                if line.startswith("##"):
                    idx += 1
                    continue

                # Skip obvious non-item lines.
                if line.startswith("Available") or line in {"Sale"}:
                    idx += 1
                    continue

                # Look ahead for a price line.
                # We treat current line as item name if a price appears within next 5 lines.
                lookahead = lines[idx : min(len(lines), idx + 6)]
                price_pos = None
                for j, la in enumerate(lookahead):
                    if la.startswith("CAD$"):
                        price_pos = idx + j
                        break
                if price_pos is None:
                    idx += 1
                    continue

                name = line
                # Description is everything between name and price (excluding Sale)
                desc_parts: List[str] = []
                for k in range(idx + 1, price_pos):
                    if lines[k] in {"Sale"} or lines[k].startswith("Available"):
                        continue
                    # Skip image labels
                    if lines[k].startswith("[Image:"):
                        continue
                    desc_parts.append(lines[k])

                description = _clean_text(" ".join(desc_parts))
                price = lines[price_pos]

                # Basic sanity checks
                if len(name) < 2 or not price.startswith("CAD$"):
                    idx = price_pos + 1
                    continue

                items.append(MenuItem(name=name, description=description, price=price))
                idx = price_pos + 1

            # Deduplicate items by name+price while preserving order.
            seen = set()
            deduped: List[MenuItem] = []
            for it in items:
                key = (it.name, it.price)
                if key in seen:
                    continue
                seen.add(key)
                deduped.append(it)

            # Only keep sections with at least 1 item.
            if deduped:
                categories.append(MenuCategory(name=title, items=deduped))

        browser.close()

    # Deduplicate categories by name (Square repeats some content in footer).
    out: List[MenuCategory] = []
    seen_names = set()
    for c in categories:
        if c.name in seen_names:
            continue
        seen_names.add(c.name)
        out.append(c)

    return out


def main() -> int:
    url = URL
    out_path: Optional[str] = None
    dump_html: Optional[str] = None
    list_headings = False

    args = sys.argv[1:]
    while args:
        a = args.pop(0)
        if a in {"-o", "--out"}:
            if not args:
                raise SystemExit("Missing value for --out")
            out_path = args.pop(0)
            continue
        if a == "--dump-html":
            if not args:
                raise SystemExit("Missing value for --dump-html")
            dump_html = args.pop(0)
            continue
        if a == "--list-headings":
            list_headings = True
            continue
        url = a

    if dump_html:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=120_000)
            page.wait_for_selector("text=Most popular", timeout=120_000)
            page.wait_for_timeout(1500)
            html = page.content()
            browser.close()
        with open(dump_html, "w", encoding="utf-8") as f:
            f.write(html)
        return 0

    if list_headings:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=120_000)
            page.wait_for_selector("text=Most popular", timeout=120_000)
            page.wait_for_timeout(1500)
            h2 = [t.strip() for t in page.locator("h2").all_inner_texts() if t.strip()]
            h3 = [t.strip() for t in page.locator("h3").all_inner_texts() if t.strip()]
            browser.close()

        print("H2:")
        for t in h2:
            print("-", _clean_text(t))
        print("\nH3:")
        for t in h3[:80]:
            print("-", _clean_text(t))
        return 0

    cats = scrape_square_menu(url)
    payload = {
        "source": url,
        "categoryCount": len(cats),
        "categories": [
            {
                "name": c.name,
                "itemCount": len(c.items),
                "items": [
                    {"name": it.name, "description": it.description, "price": it.price}
                    for it in c.items
                ],
            }
            for c in cats
        ],
    }

    text = json.dumps(payload, ensure_ascii=False, indent=2)

    if out_path:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
