"""Compress slice images for the "流畅" (smooth) quality mode.

Reads full-resolution images from data/ and writes resized JPEGs to data_low/,
preserving the directory structure.  Skips files that are already up-to-date.
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required.  Install with: pip install Pillow")
    sys.exit(1)

ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = ROOT / "data"
OUT_DIR = ROOT / "data_low"

MAX_WIDTH = 800
JPEG_QUALITY = 60


def needs_update(src: Path, dest: Path) -> bool:
    if not dest.exists():
        return True
    return src.stat().st_mtime > dest.stat().st_mtime


def compress_file(src: Path, dest: Path) -> None:
    img = Image.open(src)
    # Convert RGBA / P to RGB for JPEG output
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")

    w, h = img.size
    if w > MAX_WIDTH:
        ratio = MAX_WIDTH / w
        new_size = (MAX_WIDTH, int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)


def main() -> int:
    if not DATA_DIR.is_dir():
        print(f"Error: data/ directory not found at {DATA_DIR}")
        return 1

    image_exts = {".jpg", ".jpeg", ".png", ".webp"}
    total = 0
    skipped = 0

    for src in sorted(DATA_DIR.rglob("*")):
        if src.is_dir():
            continue
        if src.suffix.lower() not in image_exts:
            continue

        rel = src.relative_to(DATA_DIR)
        dest = OUT_DIR / rel.with_suffix(".jpg")  # always JPEG output

        if not needs_update(src, dest):
            skipped += 1
            continue

        try:
            compress_file(src, dest)
            total += 1
        except Exception as exc:
            print(f"  FAILED {rel}: {exc}")

    print(f"Compressed {total} image(s), skipped {skipped} up-to-date.")
    print(f"Output: {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
