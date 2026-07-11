import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MENU_HTML = ROOT / "menu.html"
SQUARE_JSON = ROOT / "tools" / "square_menu.json"


def _esc(s: str) -> str:
    return html.escape(s or "", quote=True)


def _norm(s: str) -> str:
    return (s or "").strip().lower()


def group_categories(categories: list[dict]) -> list[dict]:
    """Return grouped tabs.

    Each returned item is:
      {"name": <tab name>, "sections": [{"name": <category>, "items": [...]}, ...]}
    """

    by_name = {_norm(c.get("name", "")): c for c in categories}
    used: set[str] = set()

    def take(name: str) -> dict | None:
        key = _norm(name)
        if key in used:
            return None
        c = by_name.get(key)
        if not c:
            return None
        used.add(key)
        return {"name": c.get("name", name), "items": c.get("items", [])}

    # Keep top-level tabs small; show original categories as sections within each tab.
    groups = [
        {
            "name": "Most Popular",
            "sections": [s for s in [take("Most popular")] if s],
        },
        {
            "name": "Drinks",
            "sections": [
                s
                for s in [
                    take("Chai (Hot)"),
                    take("Chai (Iced)"),
                    take("Coffee (Hot)"),
                    take("Coffee (Iced)"),
                    take("Seasonal Drinks"),
                    take("Something Else"),
                    take("Shakes"),
                    take("Beverages"),
                ]
                if s
            ],
        },
        {
            "name": "Food",
            "sections": [
                s
                for s in [
                    take("Grilled Sandwiches"),
                    take("Croissant Sandwich"),
                    take("Toasts"),
                    take("Kathi Rolls"),
                    take("Bun Sliders"),
                    take("Eggs"),
                    take("Maggi"),
                    take("Pasta"),
                    take("Snacks"),
                ]
                if s
            ],
        },
        {
            "name": "Sweets",
            "sections": [s for s in [take("Desserts"), take("Baked Goods")] if s],
        },
        {
            "name": "Extras",
            "sections": [s for s in [take("Extras")] if s],
        },
    ]

    # Any remaining categories go into a final "More" tab.
    remaining = [
        {"name": c.get("name", ""), "items": c.get("items", [])}
        for c in categories
        if _norm(c.get("name", "")) not in used
    ]
    if remaining:
        groups.append({"name": "More", "sections": remaining})

    # Drop empty tabs (in case a store removes a whole group).
    groups = [g for g in groups if g.get("sections")]
    return groups


def build_tabs_menu(groups: list[dict]) -> str:
    lines: list[str] = []
    for idx, g in enumerate(groups, start=1):
        cls = " class=\"current\"" if idx == 1 else ""
        num = f"{idx:02d}."
        name = _esc(g["name"])
        lines.append(f"                                        <li{cls}><a href=\"#tab-{idx}\"><span>{num}</span>{name}</a></li>")
    return "\n".join(lines)


def build_item(item: dict) -> str:
    name = _esc(item.get("name", ""))
    desc = _esc(item.get("description", ""))
    price = _esc(item.get("price", ""))

    return "\n".join(
        [
            "                                                <!-- hero-menu-item-->",
            "                                                <div class=\"hero-menu-item\">",
            "                                                    <div class=\"menu-item-head\">",
            f"                                                        <h6 class=\"menu-item-name\">{name}</h6>",
            "                                                        <div class=\"menu-item-meta\">",
            f"                                                            <span class=\"menu-item-price\">{price}</span>",
            "                                                        </div>",
            "                                                    </div>",
            "                                                    <div class=\"hero-menu-item-details\">",
            f"                                                        <p>{desc}</p>",
            "                                                    </div>",
            "                                                </div>",
            "                                                <!-- hero-menu-item end-->  ",
        ]
    )


def build_section_header(title: str) -> str:
    title = _esc(title)
    return "\n".join(
        [
            "                                                <div class=\"menu-section-title\">",
            f"                                                    <h3>{title}</h3>",
            "                                                </div>",
        ]
    )


def build_tabs_content(groups: list[dict]) -> str:
    chunks: list[str] = []
    for idx, g in enumerate(groups, start=1):
        first_tab = " first-tab" if idx == 1 else ""
        chunks.append("                                        <div class=\"tab\">")
        chunks.append(f"                                            <div id=\"tab-{idx}\" class=\"tab-content{first_tab}\">")

        sections = g.get("sections", [])
        if not sections:
            chunks.append("                                                <div class=\"hero-menu-item\">")
            chunks.append("                                                    <div class=\"menu-item-head\">")
            chunks.append("                                                        <h6 class=\"menu-item-name\">Menu items coming soon</h6>")
            chunks.append("                                                        <div class=\"menu-item-meta\">")
            chunks.append("                                                            <span class=\"menu-item-price\"></span>")
            chunks.append("                                                        </div>")
            chunks.append("                                                    </div>")
            chunks.append("                                                </div>")
        else:
            for sec in sections:
                sec_name = sec.get("name", "")
                chunks.append(build_section_header(sec_name))
                for it in sec.get("items", []) or []:
                    chunks.append(build_item(it))

        chunks.append("                                            </div>")
        chunks.append("                                        </div>")
        chunks.append("                                        <!--tab end -->")

    return "\n".join(chunks)


def main() -> int:
    data = json.loads(SQUARE_JSON.read_text(encoding="utf-8"))
    categories = data.get("categories", [])

    if not categories:
        raise SystemExit("No categories found in tools/square_menu.json. Run square_menu_scrape.py first.")

    groups = group_categories(categories)
    if not groups:
        raise SystemExit("No grouped tabs could be formed from tools/square_menu.json")

    html_text = MENU_HTML.read_text(encoding="utf-8")

    # Replace tabs menu list items.
    html_text, tabs_menu_count = re.subn(
        r"(<ul class=\"tabs-menu\s+no-list-style\">)([\s\S]*?)(</ul>)",
        lambda m: m.group(1) + "\n" + build_tabs_menu(groups) + "\n                                    " + m.group(3),
        html_text,
        count=1,
    )
    if tabs_menu_count != 1:
        raise SystemExit("Failed to locate tabs-menu UL in menu.html")

    # Replace tabs content blocks.
    html_text, tabs_content_count = re.subn(
        r"(<div class=\"tabs-container\">)([\s\S]*?)(\s*<!--tabs end -->)",
        lambda m: m.group(1) + "\n" + build_tabs_content(groups) + "\n                                        " + m.group(3),
        html_text,
        count=1,
    )
    if tabs_content_count != 1:
        raise SystemExit("Failed to locate tabs-container content in menu.html")

    MENU_HTML.write_text(html_text, encoding="utf-8")
    print(f"Updated {MENU_HTML} with {len(categories)} categories")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
