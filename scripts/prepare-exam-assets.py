#!/usr/bin/env python3
"""Build structured practical questions and the TOS-shaped material directory.

Requires Python 3, pypdfium2 and bsdtar. Source documents stay in local/course-docs/.
Question text is written to database/seed/; downloadable files go to exam-assets/,
which is gitignored and matches the object keys used on TOS.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile

import pypdfium2 as pdfium

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exam_content import (  # noqa: E402
    blocks_from_lines, clean_page_lines, comparable_text, insert_table_after, logical_lines, _compact,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "local/course-docs/人工智能训练师题库和素材"
PDF = SOURCE / "3.2-人工智能训练师_3级_操作技能复习题.pdf"
RAR = SOURCE / "人工智能训练师三级上网素材.rar"
DATA = ROOT / "database/seed/practical"
ASSETS = ROOT / "exam-assets"
OVERRIDES = DATA / "overrides"
ARCHIVE_ROOT = "人工智能训练师三级上网素材"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

# Reviewed against the original PDF: first task page and first rubric page,
# using one-based PDF page order, NOT the printed page numbers (which are -1).
PAGE_BOUNDARIES = {
    "1.1.1": (3, 5), "1.1.2": (8, 10), "1.1.3": (13, 15),
    "1.1.4": (18, 20), "1.1.5": (23, 26),
    "1.2.1": (32, 33), "1.2.2": (35, 36), "1.2.3": (39, 40),
    "1.2.4": (43, 44), "1.2.5": (47, 48),
    "2.1.1": (53, 55), "2.1.2": (59, 61), "2.1.3": (64, 66),
    "2.1.4": (70, 72), "2.1.5": (77, 79),
    "2.2.1": (86, 88), "2.2.2": (92, 94), "2.2.3": (98, 100),
    "2.2.4": (104, 106), "2.2.5": (110, 112),
    "3.1.1": (120, 122), "3.1.2": (125, 127), "3.1.3": (130, 132),
    "3.1.4": (135, 137), "3.1.5": (140, 142),
    "3.2.1": (145, 147), "3.2.2": (150, 152), "3.2.3": (154, 156),
    "3.2.4": (159, 161), "3.2.5": (164, 166),
    "4.1.1": (173, 174), "4.1.2": (177, 178), "4.1.3": (181, 182),
    "4.1.4": (185, 186), "4.1.5": (189, 190),
    "4.2.1": (193, 195), "4.2.2": (198, 200), "4.2.3": (202, 204),
    "4.2.4": (206, 208), "4.2.5": (210, 212),
}
GROUPS = [
    {"id": "1.1", "title": "业务数据流程设计", "points": 25},
    {"id": "1.2", "title": "业务模块效果优化", "points": 25},
    {"id": "2.1", "title": "数据清洗与标注", "points": 15},
    {"id": "2.2", "title": "模型开发与测试", "points": 20},
    {"id": "3.1", "title": "智能产品数据分析与优化", "points": 15},
    {"id": "3.2", "title": "人机交互流程设计", "points": 20},
    {"id": "4.1", "title": "培训大纲编写", "points": 5},
    {"id": "4.2", "title": "数据采集、处理与标注指导", "points": 5},
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def text_field(field_id: str, label: str, description: str | None = None) -> dict:
    field = {"id": field_id, "kind": "text", "label": label,
             "placeholder": "请填写答案", "required": True}
    if description:
        field["description"] = description
    return field


def file_field(field_id: str, label: str, names: list[str],
               accept: str | None = None, multiple: bool = False) -> dict:
    return {"id": field_id, "kind": "file", "label": label,
            "description": "按原题要求选择文件，文件保存在当前浏览器。",
            "accept": accept or ",".join(sorted({Path(n).suffix.lower() for n in names})),
            "expectedNames": names, "multiple": multiple, "required": True}


def section(section_id: str, title: str, fields: list[dict],
            description: str | None = None) -> dict:
    result = {"id": section_id, "title": title, "fields": fields}
    if description:
        result["description"] = description
    return result


def file_section(section_id: str, title: str, filename: str) -> dict:
    accept = ".jpg,.jpeg" if filename.lower().endswith(".jpg") else None
    return section(section_id, title, [file_field(section_id, filename, [filename], accept)])


def docx_paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    return ["".join(node.itertext()) for node in document.findall(".//w:p", NS)
            if "".join(node.itertext()).strip()]


def blank_template_fields(question_id: str, material_dir: Path) -> list[dict]:
    """Map the exact five empty locations of each original 4.x DOCX."""
    paragraphs = docx_paragraphs(material_dir / f"{question_id}.docx")
    fields = []
    if question_id.startswith("4.1"):
        goals = [i for i, text in enumerate(paragraphs) if text.startswith("学习目标")]
        for position, i in enumerate(goals):
            if re.fullmatch(r"学习目标\s*[：:]\s*", paragraphs[i]):
                next_goal = goals[position + 1] if position + 1 < len(goals) else len(paragraphs)
                context = "\n".join(paragraphs[i + 1:next_goal - 1])
                fields.append(text_field(f"blank-{len(fields) + 1}",
                                         f"{paragraphs[i - 1]} · 学习目标", context))
    else:
        for paragraph in paragraphs:
            if re.search(r" {8,}", paragraph):
                original = re.sub(r" {8,}", "________", paragraph).strip()
                fields.append(text_field(f"blank-{len(fields) + 1}",
                                         f"第 {len(fields) + 1} 处填空", original))
    assert len(fields) == 5, (question_id, fields)
    return fields


def report_fields(question_id: str) -> list[dict]:
    """One field per original performance table cell, plus the two prose cells."""
    metrics = {
        "2.2.1": [f"{category} · {metric}"
                  for category in ["0（没有严重逾期）", "1（有严重逾期）"]
                  for metric in ["precision", "recall", "f1-score", "support"]],
        "2.2.2": ["训练集得分", "测试集得分"],
        "2.2.3": ["训练集得分", "测试集得分", "均方误差（MSE）", "决定系数（R²）"],
        "2.2.4": ["均方误差（MSE）", "决定系数（R²）"],
        "2.2.5": ["均方误差（MSE）", "平均绝对误差（MAE）", "决定系数（R²）"],
    }
    fields = [text_field(f"performance-{i}", name)
              for i, name in enumerate(metrics[question_id], 1)]
    fields += [text_field("error-analysis", "错误分析"),
               text_field("improvements", "改进建议")]
    return fields


def answer_sections(question_id: str, material_dir: Path) -> list[dict]:
    group = question_id.rsplit(".", 1)[0]
    if group == "1.1":
        image_titles = {
            "1.1.1": ["患者数量及占比", "不同 BMI 区间统计", "不同年龄区间统计"],
            "1.1.2": ["传感器数据统计", "按位置统计温度和湿度数据"],
            "1.1.3": ["数据完整性审核", "数据合理性审核"],
            "1.1.4": ["每个购买类别的用户数", "不同性别的平均购买金额", "不同年龄段的用户数"],
            "1.1.5": ["前 5 行数据", "数据合理性审核", "交通事件发生次数", "不同性别数据统计", "不同年龄段的驾驶员数"],
        }
        sections = [file_section(f"image-{i}", title, f"{question_id}-{i}.jpg")
                    for i, title in enumerate(image_titles[question_id], 1)]
        cleaned_files = {"1.1.2": "cleaned_sensor_data.csv",
                         "1.1.3": "cleaned_credit_data.csv",
                         "1.1.4": "cleaned_user_behavior_data.csv",
                         "1.1.5": "cleaned_vehicle_traffic_data.csv"}
        if question_id in cleaned_files:
            sections.append(file_section("cleaned-data", "清洗后的数据", cleaned_files[question_id]))
        return sections
    if group == "1.2":
        return [section(f"task-{i}", f"问题（{i}）", [text_field(f"answer-{i}", f"{question_id}-{i}")],
                        f"对应原始答题卷 {question_id}.docx 的同名答题单元格。")
                for i in (1, 2)]
    if group == "2.1":
        cleaning_count = 3 if question_id == "2.1.3" else 2
        other_name = "特征工程规范" if question_id == "2.1.3" else "数据标注规范"
        fields = [text_field(f"cleaning-{i}", f"数据清洗规范-{i}") for i in range(1, cleaning_count + 1)]
        fields += [text_field(f"annotation-{i}", f"{other_name}-{i}") for i in range(1, 6 - cleaning_count)]
        return [file_section("cleaned-data", "保存处理后的数据", f"{question_id}_cleaned_data.csv"),
                section("specifications", "制定数据清洗和特征工程规范" if question_id == "2.1.3" else "制定数据清洗和标注规范",
                        fields, f"对应原始答题卷 {question_id}.docx 中的规范答题区。"),
                file_section("html", "保存代码以及运行结果", f"{question_id}.html")]
    if group == "2.2":
        sections = [section("model", "保存模型和训练结果", [
            file_field("model", f"{question_id}_model.pkl", [f"{question_id}_model.pkl"]),
            file_field("results", f"{question_id}_results.txt", [f"{question_id}_results.txt"])]),
            file_section("test-report", "记录模型测试结果", f"{question_id}_report.txt"),
            section("analysis", "模型性能评估、错误分析及改进建议", report_fields(question_id),
                    f"对应原始答题卷 {question_id}.docx 的模型性能表、错误分析及改进建议。")]
        corrections = {"2.2.1": "xg", "2.2.2": "rf", "2.2.3": "xgb", "2.2.4": "xg"}
        if question_id in corrections:
            sections.append(file_section("corrected-results", "保存纠正后的模型训练结果",
                                         f"{question_id}_results_{corrections[question_id]}.txt"))
        sections.append(file_section("html", "保存代码以及运行结果", f"{question_id}.html"))
        return sections
    if group == "3.1":
        return [file_section("analysis-report", "数据分析报告", f"{question_id}-1.docx"),
                file_section("optimization-report", "优化方向和对应解决方案", f"{question_id}-2.docx")]
    if group == "3.2":
        sections = [file_section("recognition", "运行结果截图", f"{question_id}-1.jpg")]
        if question_id == "3.2.5":
            sections.append(section("detected-images", "上传检测结果的图片", [file_field(
                "detected-images", "检测结果图片", [], ".jpg,.jpeg,.png,.bmp", multiple=True)],
                "选择 detect_imgs_results_onnx 文件夹中的检测结果图片，可一次选择多张。"))
        sections.append(section("interaction", "人机交互优化方案" if question_id == "3.2.5" else "人机交互最优方式或流程",
                                [text_field("interaction", "交互方案")],
                                f"对应原题第（2）项要求保存为 {question_id}.docx 的文字内容。"))
        return sections
    if group.startswith("4."):
        return [section("template", "补全培训大纲" if group == "4.1" else "补全指导方案",
                        blank_template_fields(question_id, material_dir),
                        f"按素材 {question_id}.docx 中下划线的先后顺序填写，原模板可从“下载素材”获取。")]
    raise ValueError(question_id)


def audit_material(path: Path) -> None:
    if path.suffix == ".ipynb":
        notebook = json.loads(path.read_text())
        code = [cell for cell in notebook["cells"] if cell["cell_type"] == "code"]
        assert any(re.search(r"_{3,}", "".join(cell["source"])) for cell in code), path
        assert not any(cell.get("outputs") or cell.get("execution_count") is not None for cell in code), path
    # The archive supplies blank DOCX sheets, datasets, test inputs and models.
    # Reject result artefacts if the input archive is accidentally replaced.
    assert path.suffix.lower() in {".ipynb", ".docx", ".csv", ".xlsx", ".onnx", ".jpg", ".png", ".txt", ".py"}, path
    assert not re.search(r"(?:cleaned_|_cleaned_data|_results|_report|_model\.pkl|checkpoint)", path.name), path


def question_content(pdf, pages: list[int], question_id: str) -> tuple[list[dict], str]:
    page_lines = []
    expected_parts = []
    for page_number in pages:
        raw = pdf[page_number - 1].get_textpage().get_text_range()
        compact = re.sub(r"\s+", "", raw)
        assert "试题评分表" not in compact and "测量分评分表" not in compact, page_number
        lines = clean_page_lines(raw)
        page_lines.append(lines)
        expected_parts.append("".join(lines))
    override = OVERRIDES / f"{question_id}.json"
    if override.exists():
        content = json.loads(override.read_text())["content"]
        print(f"  override: {override.relative_to(ROOT)}", flush=True)
    else:
        content = blocks_from_lines(logical_lines(page_lines))
    if question_id == "2.2.3":
        table = json.loads((OVERRIDES / "2.2.3-data-dictionary.json").read_text())
        content, inserted = insert_table_after(content, "详细说明如下：", table)
        if not inserted:
            raise SystemExit("2.2.3 数据字典没有找到插入位置“详细说明如下：”")
        print("  override: database/seed/practical/overrides/2.2.3-data-dictionary.json", flush=True)
    actual = comparable_text(content)
    expected = _compact("".join(expected_parts))
    if actual != expected:
        index = next((i for i in range(min(len(actual), len(expected))) if actual[i] != expected[i]), min(len(actual), len(expected)))
        raise SystemExit(
            f"{question_id} 题面与 PDF 不一致，位置 {index}\n"
            f"PDF: {expected[max(0, index - 40):index + 40]}\n"
            f"数据: {actual[max(0, index - 40):index + 40]}"
        )
    return content, expected


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def main() -> None:
    if not shutil.which("bsdtar"):
        raise SystemExit("bsdtar is required to read the original RAR archive")
    DATA.mkdir(parents=True, exist_ok=True)
    pdf_hash, rar_hash = sha256(PDF), sha256(RAR)
    version = f"2026-11-08-original-{pdf_hash[:8]}-{rar_hash[:8]}"
    version_dir = ASSETS / "practical" / version
    if version_dir.exists():
        shutil.rmtree(version_dir)
    version_dir.mkdir(parents=True)
    source_manifest = {
        "bankVersion": version,
        "sourcePdf": {"file": PDF.name, "sha256": pdf_hash},
        "sourceArchive": {"file": RAR.name, "sha256": rar_hash},
        "pageNumbering": "One-based PDF page order; printed page number is one less.",
        "questions": [],
    }
    asset_manifest = {"bankVersion": version, "files": []}
    questions = []
    used_overrides = ["database/seed/practical/overrides/2.2.3-data-dictionary.json"]
    pdf = pdfium.PdfDocument(PDF)
    with tempfile.TemporaryDirectory(prefix="aigraph-exam-source-") as temp:
        members = subprocess.check_output(["bsdtar", "-tf", str(RAR)], text=True).splitlines()
        for member in members:
            parts = Path(member).parts
            assert not Path(member).is_absolute() and ".." not in parts, member
        subprocess.run(["bsdtar", "-xf", str(RAR), "-C", temp], check=True)
        material_root = Path(temp) / ARCHIVE_ROOT
        for question_id, (first, rubric) in PAGE_BOUNDARIES.items():
            group_id = question_id.rsplit(".", 1)[0]
            first_text = pdf[first - 1].get_textpage().get_text_range()
            compact = re.sub(r"\s+", "", first_text)
            assert f"试题代码：{question_id}" in compact and "试题单" in compact
            rubric_text = re.sub(r"\s+", "", pdf[rubric - 1].get_textpage().get_text_range())
            assert "试题评分表" in rubric_text and f"试题代码：{question_id}" in rubric_text
            title = re.search(r"试题名称[：:]([^\r\n]+)", first_text).group(1).strip()
            minutes = int(re.search(r"考核时间[：:]\s*(\d+)", first_text).group(1))
            pages = list(range(first, rubric))
            content, _expected = question_content(pdf, pages, question_id)
            if (OVERRIDES / f"{question_id}.json").exists():
                used_overrides.append(f"database/seed/practical/overrides/{question_id}.json")
            material_dir = material_root / f"{question_id}plus"
            assert material_dir.is_dir(), question_id
            files = sorted(path for path in material_dir.rglob("*") if path.is_file()
                           and not any(part.startswith(".") or part == "__pycache__"
                                       for part in path.relative_to(material_dir).parts))
            assert files, question_id
            prefix = f"practical/{version}/{question_id}"
            material_records = []
            zip_path = version_dir / question_id / f"{question_id}.zip"
            zip_path.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
                for path in files:
                    audit_material(path)
                    name = path.relative_to(material_dir).as_posix()
                    payload = path.read_bytes()
                    entry = zipfile.ZipInfo(name, (2025, 8, 26, 0, 0, 0))
                    entry.compress_type = zipfile.ZIP_DEFLATED
                    entry.external_attr = 0o100644 << 16
                    bundle.writestr(entry, payload, compresslevel=9)
                    file_key = f"{prefix}/files/{name}"
                    write_bytes(version_dir / question_id / "files" / name, payload)
                    record = {"name": name, "key": file_key, "bytes": len(payload),
                              "sha256": hashlib.sha256(payload).hexdigest(),
                              "archivePath": path.relative_to(Path(temp)).as_posix()}
                    material_records.append(record)
                    asset_manifest["files"].append({"key": file_key, "bytes": record["bytes"], "sha256": record["sha256"]})
            zip_key = f"{prefix}/{question_id}.zip"
            zip_record = {"key": zip_key, "bytes": zip_path.stat().st_size, "sha256": sha256(zip_path)}
            asset_manifest["files"].append(zip_record)
            question = {
                "id": question_id, "groupId": group_id, "title": title,
                "durationMinutes": minutes,
                "points": next(group["points"] for group in GROUPS if group["id"] == group_id),
                "source": {"pdf": PDF.name, "pages": pages},
                "content": content,
                "answerSections": answer_sections(question_id, material_dir),
                "materials": {"zip": zip_record, "files": material_records},
            }
            questions.append(question)
            source_manifest["questions"].append({
                "id": question_id, "title": title, "sourcePages": pages,
                "firstExcludedRubricPage": rubric,
                "materials": question["materials"],
            })
            print(f"{question_id}: pages {pages}; {len(files)} files; ZIP {zip_path.stat().st_size / 1024**2:.2f} MiB", flush=True)
    pdf.close()
    document = {"bankVersion": version, "groups": GROUPS, "questions": questions}
    (DATA / "questions.json").write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n")
    (DATA / "source-manifest.json").write_text(json.dumps(source_manifest, ensure_ascii=False, indent=2) + "\n")
    (version_dir / "manifest.json").write_text(json.dumps(asset_manifest, ensure_ascii=False, indent=2) + "\n")
    legacy = ROOT / "public/exam"
    if legacy.exists():
        shutil.rmtree(legacy)
    total_bytes = sum(path.stat().st_size for path in version_dir.rglob("*") if path.is_file())
    print("修正文件：")
    for name in used_overrides:
        print(f"  - {name}")
    print(f"Created {len(questions)} questions; assets {total_bytes / 1024**2:.2f} MiB at exam-assets/practical/{version}/")


if __name__ == "__main__":
    main()
