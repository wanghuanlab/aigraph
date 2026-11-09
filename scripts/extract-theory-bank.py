#!/usr/bin/env python3
"""Extract the level-3 theory review bank into database/seed/theory/questions.json."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "local/course-docs/人工智能训练师题库和素材/2-人工智能训练师_3级_理论复习题（带答案）.pdf"
OUT = ROOT / "database/seed/theory/questions.json"

HEADER = "人工智能训练师（三级）理论知识复习题"


def pages() -> str:
    pdf = pdfplumber.open(PDF)
    chunks = []
    for page in pdf.pages:
        chunks.append(page.extract_text() or "")
    pdf.close()
    text = "\n".join(chunks)
    text = text.replace(HEADER, "")
    text = text.replace("\u3000", " ")
    return text


def judge_questions(section: str) -> list[dict]:
    pattern = re.compile(r"[（(]\s*([√×])\s*[）)]\s*(\d+)\s*[\.．、]\s*")
    matches = list(pattern.finditer(section))
    questions = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(section)
        stem = section[match.end():end]
        stem = re.sub(r"\s+", " ", stem).strip(" \n")
        number = int(match.group(2))
        questions.append({
            "id": f"judge-{number}",
            "kind": "judge",
            "number": number,
            "stem": stem,
            "options": ["正确", "错误"],
            "answer": ["正确" if match.group(1) == "√" else "错误"],
        })
    return questions


def choice_questions(section: str, kind: str) -> list[dict]:
    pattern = re.compile(r"(?m)^(\d+)\s*[\.．]\s*")
    matches = list(pattern.finditer(section))
    questions = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(section)
        block = section[match.end():end].strip()
        answer_match = re.search(r"参考答案\s*[:：]\s*([A-E](?:\s*[，,、]\s*[A-E])*)", block)
        if not answer_match:
            continue
        body = block[:answer_match.start()]
        option_matches = list(re.finditer(r"[（(]\s*([A-E])\s*[）)]", body))
        if not option_matches:
            continue
        stem = re.sub(r"\s+", " ", body[:option_matches[0].start()]).strip()
        options = []
        for option_index, option in enumerate(option_matches):
            option_end = option_matches[option_index + 1].start() if option_index + 1 < len(option_matches) else len(body)
            label = re.sub(r"\s+", " ", body[option.end():option_end]).strip()
            options.append({"key": option.group(1), "text": label})
        answer = re.findall(r"[A-E]", answer_match.group(1))
        number = int(match.group(1))
        questions.append({
            "id": f"{kind}-{number}",
            "kind": kind,
            "number": number,
            "stem": stem,
            "options": options,
            "answer": answer,
        })
    return questions


def main() -> None:
    text = pages()
    single_at = text.find("二、单选题")
    multi_at = text.find("三、多选题")
    if single_at < 0 or multi_at < 0:
        raise SystemExit("没有找到单选题或多选题分界。")
    judges = judge_questions(text[:single_at])
    singles = choice_questions(text[single_at:multi_at], "single")
    multis = choice_questions(text[multi_at:], "multi")
    problems = []
    for name, rows, expected in (("judge", judges, 300), ("single", singles, 300), ("multi", multis, 300)):
        numbers = [row["number"] for row in rows]
        if numbers != list(range(1, expected + 1)):
            missing = [n for n in range(1, expected + 1) if n not in set(numbers)]
            problems.append(f"{name} count={len(rows)} missing={missing[:12]}")
        for row in rows:
            if not row["stem"] or not row["answer"]:
                problems.append(f"empty {row['id']}")
            if row["kind"] != "judge" and len(row["options"]) < 2:
                problems.append(f"options {row['id']} {len(row['options'])}")
            if row["kind"] == "single" and len(row["answer"]) != 1:
                problems.append(f"single answer {row['id']} {row['answer']}")
            if row["kind"] == "multi" and len(row["answer"]) < 2:
                problems.append(f"multi answer {row['id']} {row['answer']}")
    if problems:
        raise SystemExit("\n".join(problems))
    document = {
        "bankVersion": "2026-11-09-theory-review",
        "rules": {
            "durationMinutes": 90,
            "judge": {"count": 40, "points": 0.5},
            "single": {"count": 140, "points": 0.5},
            "multi": {"count": 10, "points": 1},
        },
        "questions": judges + singles + multis,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {len(document['questions'])} questions to {OUT}")


if __name__ == "__main__":
    main()
