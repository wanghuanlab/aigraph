"""Turn original practical-question PDF pages into structured text blocks.

The PDF text layer is the source of truth. Whitespace-only differences are
allowed; every other character must survive in the blocks.
"""

from __future__ import annotations

import re

HEADER = "人工智能训练师（三级）操作技能复习题"
WATERMARK = "上海企顺技能培训学校"
COVER_TITLE = "人工智能训练师（三级）操作技能考核"
SECTION_HEADING = re.compile(r"^[1-4]\.(场地设备要求|工作任务|技能要求|质量指标)$")
LIST_MARKER = re.compile(r"^(（\d+）|\(\d+\)|[\uf06c\uf0d8])\s*(.*)$", re.S)
NUMBER_MARKER = re.compile(r"^(\d+\.)(?!\d)\s*(.*)$")
OPTION_LINE = re.compile(r"^\d+\.(?!\d)")


def clean_page_lines(text: str) -> list[str]:
    """Drop the repeating header, the printed page number under it, and the watermark."""
    lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    cleaned: list[str] = []
    after_header = False
    for line in lines:
        if not line:
            continue
        if line == HEADER:
            after_header = True
            continue
        if after_header and re.fullmatch(r"\d{1,3}", line):
            after_header = False
            continue
        after_header = False
        if line == WATERMARK:
            continue
        cleaned.append(line)
    return cleaned


def _compact(text: str) -> str:
    return re.sub(r"\s+", "", text)


def _join(left: str, right: str) -> str:
    # A wrapped line has no space of its own. Keep one between Latin/digits and
    # the next token, including when a filename follows Chinese.
    if re.search(r"[A-Za-z0-9]$", left) and re.match(r"[A-Za-z0-9\u4e00-\u9fff]", right):
        return f"{left} {right}"
    if re.search(r"[\u4e00-\u9fff]$", left) and re.match(r"[A-Za-z0-9]", right):
        return f"{left} {right}"
    return left + right


def _is_structural(line: str) -> bool:
    compact = _compact(line)
    if compact in {COVER_TITLE, "试题单"}:
        return True
    if line.startswith("准考证号") or line.startswith(("试题代码：", "试题名称：", "考核时间：")):
        return True
    if SECTION_HEADING.fullmatch(line):
        return True
    if line in {"数据集说明：", "详细说明如下："} or line.startswith("注意"):
        return True
    if LIST_MARKER.match(line):
        return True
    if NUMBER_MARKER.match(line) and not SECTION_HEADING.fullmatch(line):
        return True
    return False


def _ends_sentence(text: str) -> bool:
    return bool(re.search(r"[。！？；]$", text))


def _closed_line(text: str) -> bool:
    """A line that must not absorb the following line."""
    if SECTION_HEADING.fullmatch(text):
        return True
    compact = _compact(text)
    if compact in {COVER_TITLE, "试题单"}:
        return True
    if text.startswith(("准考证号", "试题代码：", "试题名称：", "考核时间：")):
        return True
    if text in {"数据集说明：", "详细说明如下："} or text.startswith("注意"):
        return True
    return False


def logical_lines(page_lines: list[list[str]]) -> list[str]:
    """Join only lines that reach the page's right margin, so short labels stay intact."""
    units: list[str] = []
    previous_wrapped = False
    for lines in page_lines:
        for line in lines:
            if units and previous_wrapped and not _is_structural(line) and not _closed_line(units[-1]):
                units[-1] = _join(units[-1], line)
            else:
                units.append(line)
            previous_wrapped = len(line) >= 38 and not _closed_line(line) and not _ends_sentence(line)
    return units


def _paragraph(text: str, hidden: bool = False) -> dict:
    block = {"type": "paragraph", "text": text}
    if hidden:
        block["hidden"] = True
    return block


def _heading(text: str, level: int, hidden: bool = False) -> dict:
    block = {"type": "heading", "level": level, "text": text}
    if hidden:
        block["hidden"] = True
    return block


def _note(text: str) -> dict:
    return {"type": "note", "text": text}


def _option(line: str) -> dict:
    stem, *choices = line.split("○")
    return {"type": "options", "stem": stem.strip(), "choices": [choice.strip() for choice in choices if choice.strip()]}


def _list_style(line: str) -> str | None:
    if line.startswith("（"):
        return "paren-number"
    if line.startswith("("):
        return "step"
    if line.startswith(("\uf06c", "\uf0d8")):
        return "bullet"
    if NUMBER_MARKER.match(line) and not SECTION_HEADING.fullmatch(line) and "○" not in line:
        return "number"
    return None


def _split_marker(line: str) -> tuple[str, str]:
    matched = LIST_MARKER.match(line)
    if matched:
        return matched.group(1), matched.group(2).strip()
    numbered = NUMBER_MARKER.match(line)
    if numbered:
        return numbered.group(1), numbered.group(2).strip()
    raise ValueError(line)


def _classify(line: str) -> str:
    compact = _compact(line)
    if compact in {COVER_TITLE, "试题单"} or SECTION_HEADING.fullmatch(line):
        return "heading"
    if line in {"数据集说明：", "详细说明如下："} or line.startswith("注意"):
        return "note"
    if "○" in line and OPTION_LINE.match(line):
        return "options"
    if _list_style(line):
        return "list"
    return "paragraph"


def _parse_list(lines: list[str], index: int) -> tuple[dict, int]:
    style = _list_style(lines[index])
    items = []
    while index < len(lines) and _classify(lines[index]) == "list" and _list_style(lines[index]) == style:
        marker, rest = _split_marker(lines[index])
        index += 1
        children = [_paragraph(rest)] if rest else []
        while index < len(lines):
            kind = _classify(lines[index])
            if kind == "heading" and SECTION_HEADING.fullmatch(lines[index]):
                break
            if kind == "list" and _list_style(lines[index]) == style:
                break
            if kind == "list" and style in {"number", "bullet"} and _list_style(lines[index]) in {"paren-number", "step"}:
                break
            if kind == "note":
                break
            if kind == "list":
                nested, index = _parse_list(lines, index)
                children.append(nested)
                continue
            if kind == "options":
                children.append(_option(lines[index]))
                index += 1
                continue
            if kind == "paragraph":
                lead = children[-1].get("text", "") if children else ""
                if style in {"paren-number", "step"} and lead.endswith(("：", ":")):
                    children.append(_paragraph(lines[index]))
                    index += 1
                    continue
            break
        items.append({"marker": marker, "blocks": children})
    return {"type": "list", "style": style, "items": items}, index


def blocks_from_lines(lines: list[str]) -> list[dict]:
    blocks: list[dict] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        kind = _classify(line)
        compact = _compact(line)
        if compact == COVER_TITLE:
            blocks.append(_heading(COVER_TITLE, 1, hidden=True))
            index += 1
        elif compact == "试题单":
            blocks.append(_heading("试题单", 2, hidden=True))
            index += 1
        elif line.startswith("准考证号"):
            blocks.append(_paragraph(line, hidden=True))
            index += 1
        elif kind == "heading":
            blocks.append(_heading(line, 2))
            index += 1
        elif kind == "note":
            blocks.append(_note(line))
            index += 1
        elif kind == "options":
            blocks.append(_option(line))
            index += 1
        elif kind == "list":
            block, index = _parse_list(lines, index)
            blocks.append(block)
        else:
            blocks.append(_paragraph(line))
            index += 1
    return blocks


def insert_table_after(blocks: list[dict], anchor: str, table: dict) -> tuple[list[dict], bool]:
    """Insert the transcribed table immediately after the matching note. Returns blocks and whether it was inserted."""
    result = []
    found = False
    for block in blocks:
        if block.get("type") == "list":
            for item in block["items"]:
                item["blocks"], nested = insert_table_after(item["blocks"], anchor, table)
                found = found or nested
        result.append(block)
        if not found and block.get("type") == "note" and block.get("text") == anchor:
            result.append(table)
            found = True
    return result, found


def flatten_content(blocks: list[dict], *, include_tables: bool = False) -> str:
    parts: list[str] = []
    for block in blocks:
        kind = block["type"]
        if kind in {"heading", "paragraph", "note"}:
            parts.append(block["text"])
        elif kind == "options":
            parts.append(block["stem"])
            parts.extend(f"○{choice}" for choice in block["choices"])
        elif kind == "list":
            for item in block["items"]:
                parts.append(item["marker"])
                parts.append(flatten_content(item["blocks"], include_tables=include_tables))
        elif kind == "table" and include_tables:
            parts.append("".join(block["columns"]))
            parts.extend("".join(row) for row in block["rows"])
    return "".join(parts)


def comparable_text(blocks: list[dict]) -> str:
    return _compact(flatten_content(blocks, include_tables=False))
