#!/usr/bin/env python3
"""Stamp ?v= on every CSS and JS link with a hash of that file's contents.

Run this after any edit to style.css or main.js and before uploading.

The version has to change whenever a file changes, or the one-year
Cache-Control in .htaccess keeps serving the old copy against new markup, which
renders as a subtly broken page rather than an obviously stale one. A hand
written date does not survive contact with a busy week: this page shipped four
days of CSS edits under a single ?v=20260821 and browsers held the first copy.
A content hash cannot drift, because it is derived from the bytes it labels.
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
PAGE = ROOT / "french-intermediate-advanced"
ASSETS = {"style.css": PAGE / "css" / "style.css",
          "main.js":   PAGE / "js"  / "main.js"}
HTML = [PAGE / "index.html", ROOT / "thankyou" / "index.html"]


def short_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def main():
    missing = [n for n, p in ASSETS.items() if not p.is_file()]
    if missing:
        sys.exit(f"missing asset(s): {', '.join(missing)}")

    versions = {name: short_hash(path) for name, path in ASSETS.items()}
    changed = False

    for page in HTML:
        if not page.is_file():
            sys.exit(f"missing page: {page}")
        text = original = page.read_text(encoding="utf-8")

        for name, version in versions.items():
            # rewrite ?v=... on this asset only, leaving the path in front of it alone
            pattern = re.compile(r"(" + re.escape(name) + r")\?v=[^\"']*")
            text, n = pattern.subn(rf"\1?v={version}", text)
            if not n:
                sys.exit(f"{page.name}: found no ?v= link to {name}")

        if text != original:
            page.write_text(text, encoding="utf-8", newline="")
            changed = True

    for name, version in versions.items():
        print(f"  {name:10} -> v={version}")
    print("stamped" if changed else "already up to date")


if __name__ == "__main__":
    main()
