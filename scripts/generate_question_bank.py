"""Generate question bank JSON from the data/ directory of slice images."""

import json
import os
import re
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "question-bank.json")

# Category display names
CATEGORY_TITLES = {
    "叶": "叶 (Leaf)",
    "根": "根 (Root)",
    "茎": "茎 (Stem)",
    "花": "花 (Flower)",
    "植物组织": "植物组织 (Plant Tissue)",
}

# Regex to extract specimen name from filename
# Pattern: 植物名[修饰]放大倍数-序号.jpg or 植物名[修饰].jpg
NAME_PATTERN = re.compile(
    r"^(.+?)(?:\d+[Xx](?:-\d+)?)?(?:\.\w+)$"
)


def extract_answer(filename: str) -> str:
    """Extract the specimen/answer name from the image filename."""

    # Remove extension
    name, _ = os.path.splitext(filename)

    # Try to strip magnification suffix like "10X-1", "40X-2", "4X"
    # Pattern: digits followed by X/x, optionally followed by -digits
    cleaned = re.sub(r"\d+[Xx](?:-\d+)?$", "", name)

    # Also handle cases like "夹竹桃2-10X-1" where there's a digit before the magnification
    cleaned = re.sub(r"(\D)\d+(?=[Xx])", r"\1", cleaned)

    # Clean up trailing dashes, spaces, etc.
    cleaned = cleaned.rstrip(" -—")

    return cleaned if cleaned else name


def generate_question_bank():
    """Scan the data directory and generate question bank JSON."""
    questions = []
    categories = []

    if not os.path.isdir(DATA_DIR):
        print(f"Error: Data directory not found at {DATA_DIR}")
        return False

    category_dirs = sorted(os.listdir(DATA_DIR))

    for cat_id in category_dirs:
        cat_path = os.path.join(DATA_DIR, cat_id)
        if not os.path.isdir(cat_path):
            continue

        image_files = sorted(
            f
            for f in os.listdir(cat_path)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        )

        if not image_files:
            continue

        categories.append({
            "id": cat_id,
            "title": CATEGORY_TITLES.get(cat_id, cat_id),
            "imageCount": len(image_files),
        })

        for img_file in image_files:
            question_id = f"{cat_id}_{img_file}"
            # Use POSIX path for web
            image_path = f"/data/{cat_id}/{img_file}"
            answer = extract_answer(img_file)

            questions.append({
                "id": question_id,
                "categoryId": cat_id,
                "imagePath": image_path,
                "answer": answer,
                "sourceName": img_file,
            })

    bank = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalQuestions": len(questions),
        "categories": categories,
        "questions": questions,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(bank, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(questions)} questions across {len(categories)} categories.")
    print(f"Output: {OUTPUT_FILE}")
    return True


if __name__ == "__main__":
    generate_question_bank()
