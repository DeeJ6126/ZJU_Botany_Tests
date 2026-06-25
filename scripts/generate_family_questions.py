"""Generate family-questions.json from 复习题.docx section 二."""

import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

DOCX_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "复习题.docx"
)
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "family-questions.json")


def extract_text(docx_path: str) -> str:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read("word/document.xml")
    tree = ET.fromstring(xml_content)
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    lines = []
    for p in tree.iter(f"{{{ns}}}p"):
        line = "".join(t.text or "" for t in p.iter(f"{{{ns}}}t"))
        lines.append(line)
    return "\n".join(lines)


def parse_section2(text: str) -> list[dict]:
    idx = text.find("二、以下不作名词解释解答")
    if idx < 0:
        print("Error: section 二 not found")
        return []

    idx2 = text.find("三、", idx + 1)
    section = text[idx:idx2] if idx2 > 0 else text[idx:]
    lines = [l.strip() for l in section.split("\n") if l.strip()]

    questions: list[dict] = []
    i = 1  # skip the section title

    def is_pair_title(s: str) -> bool:
        """A pair title is short (<15 chars) and contains '与'."""
        return "与" in s and len(s) < 15

    while i < len(lines):
        line = lines[i]

        # Skip pair titles like "单体雄蕊与聚药雄蕊"
        if is_pair_title(line) and i + 1 < len(lines):
            i += 1
            continue

        term = line
        i += 1
        if i >= len(lines):
            break

        # Collect description until we hit a 科 line
        desc_parts = []
        while i < len(lines):
            cur = lines[i]
            if cur.endswith("科"):
                break
            # Only break on short pair-title-like lines, not long descriptive text
            if is_pair_title(cur):
                break
            desc_parts.append(cur)
            i += 1
        desc = "".join(desc_parts)

        # Parse families
        entries = []
        while i < len(lines) and lines[i].endswith("科"):
            family = lines[i]
            i += 1
            species: list[str] = []
            if i < len(lines) and not lines[i].endswith("科"):
                maybe_species = lines[i]
                # Avoid treating next term name / pair title as species
                if not is_pair_title(maybe_species):
                    species = [
                        s.strip()
                        for s in re.split(r"[、，,]", maybe_species)
                        if s.strip()
                    ]
                    i += 1
            entries.append({"family": family, "species": species})

        # Skip any trailing pair-title line
        while i < len(lines) and is_pair_title(lines[i]):
            i += 1

        if term and desc and entries:
            questions.append(
                {"term": term, "description": desc, "entries": entries}
            )

    return questions


def main() -> int:
    if not os.path.isfile(DOCX_PATH):
        print(f"Error: docx not found at {DOCX_PATH}")
        return 1

    text = extract_text(DOCX_PATH)
    raw = parse_section2(text)

    # ── Post-process ────────────────────────────────
    # Clean parenthetical notes from species and fix descriptions
    for r in raw:
        for e in r["entries"]:
            e["species"] = [
                re.sub(r"[（(][^)）]*[)）]", "", s).strip()
                for s in e["species"]
            ]
        # Fix 聚合果 description
        if r["term"] == "聚合果":
            r["description"] = "花中的离生心皮发育形成的果实群"

    questions = []
    for i, r in enumerate(raw):
        qid = f"family_{i:02d}"
        questions.append(
            {
                "id": qid,
                "term": r["term"],
                "description": r["description"],
                "entries": r["entries"],
            }
        )

    bank = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalQuestions": len(questions),
        "questions": questions,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(bank, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(questions)} family questions.")
    print(f"Output: {OUTPUT_FILE}")

    for q in questions:
        print(f"  [{len(q['entries'])}科] {q['term']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
