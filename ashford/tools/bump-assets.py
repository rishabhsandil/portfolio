# -*- coding: utf-8 -*-
"""
Stamp cache-busting versions onto the site's CSS, JS and HTML components.

Run this after editing assets/css/styles.css, assets/js/main.js, or anything in
components/, then deploy. Browsers and CDNs key their cache on the full URL, so
changing the ?v= token forces a fresh fetch instead of serving a stale file.

    python tools/bump-assets.py

The tokens are content hashes, not dates, so re-running with nothing changed
produces no diff, and a changed file always gets a new token.

Order matters: the component hash is injected into main.js first, because doing
so changes main.js and therefore its own hash.
"""
import hashlib
import io
import os
import re
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join("assets", "css", "styles.css")
JS = os.path.join("assets", "js", "main.js")


def read(path):
    return io.open(os.path.join(ROOT, path), encoding="utf-8").read()


def write(path, text):
    io.open(os.path.join(ROOT, path), "w", encoding="utf-8", newline="").write(text)


def short_hash(text):
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:8]


def main():
    changed = []

    # 1. Component hash, injected into main.js so runtime fetches bust too.
    comp_files = sorted(glob.glob(os.path.join(ROOT, "components", "*.html")))
    comp_blob = "".join(io.open(f, encoding="utf-8").read() for f in comp_files)
    comp_v = short_hash(comp_blob)

    js = read(JS)
    js_new = re.sub(r"var COMPONENT_V = '[^']*';",
                    "var COMPONENT_V = '%s';" % comp_v, js, count=1)
    if js_new == js and "COMPONENT_V" not in js:
        sys.exit("main.js has no COMPONENT_V placeholder; add it to loadComponents first.")
    if js_new != js:
        write(JS, js_new)
        changed.append("%s (COMPONENT_V -> %s)" % (JS, comp_v))
    js = js_new

    # 2. Asset hashes. main.js is hashed after the injection above.
    css_v = short_hash(read(CSS))
    js_v = short_hash(js)

    # 3. Stamp every reference. Strips any existing ?v= so re-runs are idempotent.
    pages = (glob.glob(os.path.join(ROOT, "*.html"))
             + glob.glob(os.path.join(ROOT, "lp", "*.html"))
             + glob.glob(os.path.join(ROOT, "components", "*.html")))
    stamped = 0
    for page in sorted(pages):
        s = io.open(page, encoding="utf-8").read()
        orig = s
        s = re.sub(r'(href="[^"]*?assets/css/styles\.css)(\?v=[^"]*)?"',
                   lambda m: '%s?v=%s"' % (m.group(1), css_v), s)
        s = re.sub(r'(src="[^"]*?assets/js/main\.js)(\?v=[^"]*)?"',
                   lambda m: '%s?v=%s"' % (m.group(1), js_v), s)
        if s != orig:
            io.open(page, "w", encoding="utf-8", newline="").write(s)
            stamped += 1

    print("css   v=%s" % css_v)
    print("js    v=%s" % js_v)
    print("comp  v=%s" % comp_v)
    print("pages stamped: %d" % stamped)
    for c in changed:
        print("updated: %s" % c)


if __name__ == "__main__":
    main()
