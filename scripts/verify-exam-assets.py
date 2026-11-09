#!/usr/bin/env python3
"""Verify structured question text, schema, and original material bytes.

Re-reads the source PDF and RAR. Does not execute notebooks or use the network.
Requires jsonschema (python3 -m pip install jsonschema).
"""

from __future__ import annotations

from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile

import pypdfium2 as pdfium
from jsonschema import Draft202012Validator

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exam_content import clean_page_lines, comparable_text, _compact  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "database/seed/practical"
ASSETS = ROOT / "exam-assets"
SOURCES = ROOT / "local/course-docs/人工智能训练师题库和素材"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def walk_tables(blocks: list[dict]):
    for block in blocks:
        if block["type"] == "table":
            yield block
        elif block["type"] == "list":
            for item in block["items"]:
                yield from walk_tables(item["blocks"])


def main() -> None:
    document = json.loads((DATA / "questions.json").read_text())
    schema = json.loads((DATA / "questions.schema.json").read_text())
    Draft202012Validator.check_schema(schema)
    errors = sorted(Draft202012Validator(schema).iter_errors(document), key=lambda error: list(error.path))
    if errors:
        first = errors[0]
        raise SystemExit(f"questions.json 不符合 schema：{list(first.path)} {first.message}")
    questions = document["questions"]
    groups = document["groups"]
    version = document["bankVersion"]
    manifest = json.loads((DATA / "source-manifest.json").read_text())
    asset_manifest = json.loads((ASSETS / "practical" / version / "manifest.json").read_text())
    assert version == manifest["bankVersion"] == asset_manifest["bankVersion"]
    expected_ids = [f"{a}.{b}.{c}" for a in range(1, 5) for b in range(1, 3) for c in range(1, 6)]
    assert [question["id"] for question in questions] == expected_ids
    assert Counter(question["groupId"] for question in questions) == {group["id"]: 5 for group in groups}
    pdf_path = SOURCES / manifest["sourcePdf"]["file"]
    rar_path = SOURCES / manifest["sourceArchive"]["file"]
    assert digest(pdf_path.read_bytes()) == manifest["sourcePdf"]["sha256"]
    assert digest(rar_path.read_bytes()) == manifest["sourceArchive"]["sha256"]
    pdf = pdfium.PdfDocument(pdf_path)
    page_texts = [_compact(page.get_textpage().get_text_range()) for page in pdf]
    inferred = {}
    for index, text in enumerate(page_texts):
        if "试题单" in text and "试题代码：" in text:
            question_id = re.search(r"试题代码：(\d\.\d\.\d)", text).group(1)
            end = next(cursor for cursor in range(index + 1, len(page_texts)) if "试题评分表" in page_texts[cursor])
            inferred[question_id] = list(range(index + 1, end + 1))
    assert sorted(inferred) == expected_ids
    manifest_by_id = {record["id"]: record for record in manifest["questions"]}
    listed_keys = {item["key"]: item for item in asset_manifest["files"]}
    seen_keys = set()
    template_count = 0
    material_count = 0
    with tempfile.TemporaryDirectory(prefix="aigraph-exam-verify-") as temp:
        subprocess.run(["bsdtar", "-xf", str(rar_path), "-C", temp], check=True)
        for question in questions:
            question_id = question["id"]
            record = manifest_by_id[question_id]
            assert question["source"]["pages"] == record["sourcePages"] == inferred[question_id], question_id
            assert record["firstExcludedRubricPage"] == question["source"]["pages"][-1] + 1
            assert "试题评分表" not in "".join(page_texts[number - 1] for number in question["source"]["pages"])
            group = next(group for group in groups if group["id"] == question["groupId"])
            assert question["points"] == group["points"]
            expected_minutes = 30 if question_id.startswith("1.") else 10 if question_id.startswith("4.") else 20
            assert question["durationMinutes"] == expected_minutes
            pdf_text = _compact("".join("".join(clean_page_lines(pdf[number - 1].get_textpage().get_text_range()))
                                        for number in question["source"]["pages"]))
            data_text = comparable_text(question["content"])
            if data_text != pdf_text:
                index = next((i for i in range(min(len(data_text), len(pdf_text))) if data_text[i] != pdf_text[i]),
                             min(len(data_text), len(pdf_text)))
                raise SystemExit(f"{question_id} 文本不一致，位置 {index}\n"
                                 f"PDF: {pdf_text[max(0, index - 40):index + 40]}\n"
                                 f"数据: {data_text[max(0, index - 40):index + 40]}")
            tables = list(walk_tables(question["content"]))
            if question_id == "2.2.3":
                assert len(tables) == 1
                table = tables[0]
                assert table["columns"] == ["变量名", "描述", "类型"]
                # 14 data rows; together with the header this is the 15-row dictionary.
                assert len(table["rows"]) == 14
                assert all(len(row) == 3 and all(cell.strip() for cell in row) for row in table["rows"])
            else:
                assert tables == []
            for material in [question["materials"]["zip"], *question["materials"]["files"]]:
                path = ASSETS / material["key"]
                assert path.is_file(), material["key"]
                assert path.stat().st_size == material["bytes"]
                assert digest(path.read_bytes()) == material["sha256"]
                assert material["key"] in listed_keys
                assert listed_keys[material["key"]]["sha256"] == material["sha256"]
                seen_keys.add(material["key"])
            assert question["materials"] == record["materials"]
            zip_path = ASSETS / question["materials"]["zip"]["key"]
            with zipfile.ZipFile(zip_path) as bundle:
                assert bundle.testzip() is None
                names = [item["name"] for item in question["materials"]["files"]]
                assert bundle.namelist() == names
                source_dir = Path(temp) / "人工智能训练师三级上网素材" / f"{question_id}plus"
                expected_files = sorted(path.relative_to(source_dir).as_posix() for path in source_dir.rglob("*")
                                        if path.is_file() and not any(part.startswith(".") or part == "__pycache__"
                                                                      for part in path.relative_to(source_dir).parts))
                assert bundle.namelist() == expected_files
                for item in question["materials"]["files"]:
                    name = item["name"]
                    assert not Path(name).is_absolute() and ".." not in Path(name).parts
                    assert not re.search(r"(?:cleaned_|_cleaned_data|_results|_report|_model\.pkl|checkpoint)", name)
                    data = bundle.read(name)
                    assert data == (ASSETS / item["key"]).read_bytes()
                    assert data == (Path(temp) / item["archivePath"]).read_bytes(), (question_id, name)
                    material_count += 1
                    if name.endswith(".ipynb"):
                        notebook = json.loads(data)
                        code = [cell for cell in notebook["cells"] if cell["cell_type"] == "code"]
                        assert any(re.search(r"_{3,}", "".join(cell["source"])) for cell in code)
                        assert all(not cell.get("outputs") and cell.get("execution_count") is None for cell in code)
                        template_count += 1
            section_ids, field_ids = set(), set()
            for section in question["answerSections"]:
                assert section["id"] not in section_ids
                section_ids.add(section["id"])
                for field in section["fields"]:
                    assert field["id"] not in field_ids, (question_id, field["id"])
                    field_ids.add(field["id"])
                    if field["kind"] == "file":
                        assert field["accept"]
                        assert field["expectedNames"] or field.get("multiple")
            if question_id.startswith("4."):
                assert sum(len(section["fields"]) for section in question["answerSections"]) == 5
    pdf.close()
    assert seen_keys == set(listed_keys)
    assert template_count == 20
    assert not (ROOT / "public/exam").exists()
    question_map = {question["id"]: question for question in questions}

    def fields(question_id):
        return [field for section in question_map[question_id]["answerSections"] for field in section["fields"]]

    assert [field["label"] for field in fields("2.1.2") if field["kind"] == "text"] == [
        "数据清洗规范-1", "数据清洗规范-2", "数据标注规范-1", "数据标注规范-2", "数据标注规范-3"]
    assert [field["label"] for field in fields("2.1.3") if field["kind"] == "text"] == [
        "数据清洗规范-1", "数据清洗规范-2", "数据清洗规范-3", "特征工程规范-1", "特征工程规范-2"]
    assert any(field.get("multiple") for field in fields("3.2.5"))
    assert not any("_results_x" in name for field in fields("2.2.5") for name in field.get("expectedNames", []))
    total = sum(path.stat().st_size for path in (ASSETS / "practical" / version).rglob("*") if path.is_file())
    print(f"Verified {len(questions)} questions, {sum(len(q['source']['pages']) for q in questions)} task pages, "
          f"{material_count} original files and {template_count} blank notebooks; assets {total / 1024**2:.2f} MiB.")


if __name__ == "__main__":
    main()
