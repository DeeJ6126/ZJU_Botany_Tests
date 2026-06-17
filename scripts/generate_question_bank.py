"""Generate question bank JSON from the data/ directory of slice images."""

import json
import os
import re
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "question-bank.json")

CATEGORY_TITLES = {
    "叶": "叶 (Leaf)",
    "根": "根 (Root)",
    "茎": "茎 (Stem)",
    "花": "花 (Flower)",
    "植物组织": "植物组织 (Plant Tissue)",
}

ORGAN_NAMES = {
    "叶": "叶",
    "根": "根",
    "茎": "茎",
    "花": "花",
    "植物组织": "组织",
}

PLANT_CLASSIFICATION: dict[str, str] = {
    "小麦": "单子叶",
    "水稻": "单子叶",
    "玉米": "单子叶",
    "眼子菜": "单子叶",
    "毛竹": "单子叶",
    "百合": "单子叶",
    "石斛": "单子叶",
    "洋葱": "单子叶",
    "鸢尾": "单子叶",
    "丁香": "双子叶",
    "南瓜": "双子叶",
    "大豆": "双子叶",
    "夹竹桃": "双子叶",
    "桃花": "双子叶",
    "桑": "双子叶",
    "桔": "双子叶",
    "梨": "双子叶",
    "棉": "双子叶",
    "椴树": "双子叶",
    "毛茛": "双子叶",
    "茶": "双子叶",
    "荠菜": "双子叶",
    "蓖麻": "双子叶",
    "蚕豆": "双子叶",
    "苜蓿": "双子叶",
    "黄杨": "双子叶",
    "黄麻": "双子叶",
}

_CLASSIFICATION_KEYS = sorted(PLANT_CLASSIFICATION.keys(), key=len, reverse=True)

MAG_RE = re.compile(r"(\d+)[Xx]")

# Terms where the organ character is embedded in the specimen name
# (i.e., stripping the organ would corrupt the meaning)
INTEGRAL_TERMS = {
    "初生根", "老根", "嫩根", "根瘤", "根尖", "侧根",
    "叶柄", "叶片",
    "初生茎", "次生茎", "茎尖", "茎横切", "茎纵切",
    "花药", "子房", "花柱", "花芽", "心形胚", "球形胚",
    "马蹄形胚", "鱼雷形胚", "纤维", "分泌腔", "腺毛", "蜜腺",
    "石细胞", "胚乳", "居间分生组织",
}


def classify_plant(answer: str) -> str:
    for key in _CLASSIFICATION_KEYS:
        if key in answer:
            return PLANT_CLASSIFICATION[key]
    return "未知"


def extract_magnification(filename: str) -> str:
    m = MAG_RE.search(filename)
    return m.group(0).upper() if m else ""


def clean_answer_text(text: str) -> str:
    """Clean up leftover artifacts like 'X' in the answer."""
    # Remove stray "X" that was part of a magnification like "40X中末期"
    text = re.sub(r"(?<=\S)[Xx](?=\S)", "", text)
    # Also handle cases like "X纵切" where X is a magnification residue
    text = re.sub(r"^[Xx](?=[一-鿿])", "", text)
    text = re.sub(r"(?<=[一-鿿])[Xx](?=[一-鿿])", "", text)
    text = text.rstrip(" -—")
    return text


def extract_answer(filename: str) -> str:
    """Extract the raw specimen/answer name from the image filename."""
    name, _ = os.path.splitext(filename)

    # Strip magnification suffix like "10X-1", "40X-2", "4X" at end
    cleaned = re.sub(r"\d+[Xx](?:-\d+)?$", "", name)

    # Handle cases like "夹竹桃2-10X-1" where a digit precedes magnification
    cleaned = re.sub(r"(\D)\d+(?=[Xx])", r"\1", cleaned)

    # Handle cases like "40X中末期" where magnification is in the middle
    cleaned = re.sub(r"\d+[Xx]", "", cleaned)

    # Clean up trailing punctuation first
    cleaned = cleaned.rstrip(" -—")

    # Strip trailing standalone digits / sequence numbers
    # (e.g. "夹竹桃2" -> "夹竹桃", "中末期2" -> "中末期")
    cleaned = re.sub(r"\d+$", "", cleaned)

    # Final cleanup
    cleaned = cleaned.rstrip(" -—")

    return cleaned if cleaned else name


def get_base_name(raw_answer: str, category_id: str) -> str:
    """Extract the base plant name by stripping the organ suffix if safe."""
    # If the raw answer contains an integral term, keep it whole
    for term in INTEGRAL_TERMS:
        if term in raw_answer:
            return raw_answer

    # Try to strip the category organ suffix
    if category_id in ("叶", "根", "茎", "花"):
        organ = category_id
        if raw_answer.endswith(organ) and len(raw_answer) > len(organ):
            stripped = raw_answer[:-len(organ)]
            # Only use stripped version if left with a meaningful base (≥1 Chinese char)
            has_chinese = any("一" <= c <= "鿿" for c in stripped)
            if stripped and has_chinese:
                return stripped

    return raw_answer


def build_formatted_answer(raw_answer: str, category_id: str, filename: str) -> str:
    """Build a structured answer string.

    Format: (单/双子叶)——(器官)——(名称)——放大倍数
    Falls back to raw answer for complex cases.
    """
    plant_type = classify_plant(raw_answer)
    mag = extract_magnification(filename)

    # For "植物组织" category, try to infer organ from name
    if category_id == "植物组织":
        detected_organ = None
        detected_base = None
        for organ_key in ["茎", "叶", "根", "花"]:
            if organ_key in raw_answer:
                base = get_base_name(raw_answer, organ_key)
                if base and len(base) >= 1:
                    detected_organ = ORGAN_NAMES[organ_key]
                    detected_base = base
                    break

        if detected_organ and detected_base:
            # Use the detected organ even when integral terms
            # prevented stripping (base == raw_answer)
            parts = [plant_type, detected_organ, detected_base]
        else:
            # No organ detected — use "组织" as the organ field
            parts = [plant_type, ORGAN_NAMES[category_id], raw_answer]

        if mag:
            parts.append(mag)
        return "——".join(parts)

    # For normal categories
    organ = ORGAN_NAMES.get(category_id, category_id)
    base = get_base_name(raw_answer, category_id)

    # If stripping left nothing useful, keep raw
    if not base or len(base) < 1:
        base = raw_answer

    parts = [plant_type, organ, base]
    if mag:
        parts.append(mag)
    return "——".join(parts)


def generate_question_bank():
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
            image_path = f"data/{cat_id}/{img_file}"
            raw_answer = extract_answer(img_file)
            raw_answer = clean_answer_text(raw_answer)
            plant_type = classify_plant(raw_answer)
            mag = extract_magnification(img_file)
            formatted = build_formatted_answer(raw_answer, cat_id, img_file)

            questions.append({
                "id": question_id,
                "categoryId": cat_id,
                "imagePath": image_path,
                "answer": formatted,
                "plantType": plant_type,
                "sourceName": img_file,
                "magnification": mag,
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
