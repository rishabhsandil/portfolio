from __future__ import annotations

import datetime
import os
import shutil
from pathlib import Path

from PIL import Image


BG_DIR = Path("images/bg")
BACKUP_ROOT = BG_DIR / "originals"

# Target max size for hero/section backgrounds.
# 2560px wide keeps images sharper on large displays while still being reasonable in file size.
MAX_LONG_SIDE = 2560

# JPEG quality (0-100). Higher = sharper but larger.
JPEG_QUALITY = 86


def main() -> None:
    if not BG_DIR.exists():
        raise SystemExit(f"Directory not found: {BG_DIR}")

    jpgs = sorted([p for p in BG_DIR.glob("*.jpg") if p.is_file()])
    if not jpgs:
        print(f"No .jpg files found in {BG_DIR}")
        return

    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_dir = BACKUP_ROOT / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    print(f"Found {len(jpgs)} background JPGs")
    print(f"Backup dir: {backup_dir}")
    print(f"Max long side: {MAX_LONG_SIDE}px, JPEG quality: {JPEG_QUALITY}\n")

    resized_count = 0
    skipped_count = 0

    for path in jpgs:
        try:
            original_size_bytes = path.stat().st_size

            with Image.open(path) as img:
                original_w, original_h = img.size

                long_side = max(original_w, original_h)
                if long_side <= MAX_LONG_SIDE:
                    print(f"{path.name}: skip ({original_w}x{original_h}, {original_size_bytes/1024:.1f} KB)")
                    skipped_count += 1
                    continue

                scale = MAX_LONG_SIDE / float(long_side)
                new_w = max(1, int(round(original_w * scale)))
                new_h = max(1, int(round(original_h * scale)))

                # Backup original before overwriting
                shutil.copy2(path, backup_dir / path.name)

                img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                if img_resized.mode != "RGB":
                    img_resized = img_resized.convert("RGB")

                img_resized.save(
                    path,
                    format="JPEG",
                    quality=JPEG_QUALITY,
                    optimize=True,
                    progressive=True,
                )

            new_size_bytes = path.stat().st_size
            resized_count += 1

            print(
                f"{path.name}: {original_w}x{original_h} -> {new_w}x{new_h} | "
                f"{original_size_bytes/1024:.1f} KB -> {new_size_bytes/1024:.1f} KB"
            )

        except Exception as exc:
            print(f"{path.name}: ERROR: {exc}")

    print("\nDone")
    print(f"Resized: {resized_count}, skipped: {skipped_count}")


if __name__ == "__main__":
    main()
