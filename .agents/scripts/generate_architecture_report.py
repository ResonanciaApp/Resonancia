#!/usr/bin/env python3
"""Generate a branded PDF from the executive architecture Markdown source."""

from __future__ import annotations

import html
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs" / "informe-ejecutivo-arquitectura-resonancia.md"
HTML_OUT = ROOT / ".agents" / "outputs" / "informe-ejecutivo-arquitectura-resonancia.html"
PDF_OUT = ROOT / "docs" / "informe-ejecutivo-arquitectura-resonancia.pdf"


def inline(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", escaped)
    return escaped


def table_to_html(rows: list[str]) -> str:
    parsed = [[inline(cell.strip()) for cell in row.strip().strip("|").split("|")] for row in rows]
    if len(parsed) > 1 and all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in parsed[1]):
        parsed.pop(1)
    head, *body = parsed
    result = ["<table><thead><tr>"]
    result.extend(f"<th>{cell}</th>" for cell in head)
    result.append("</tr></thead><tbody>")
    for row in body:
        result.append("<tr>")
        result.extend(f"<td>{cell}</td>" for cell in row)
        result.append("</tr>")
    result.append("</tbody></table>")
    return "".join(result)


def markdown_to_html(markdown: str) -> str:
    lines = markdown.splitlines()
    output: list[str] = []
    paragraph: list[str] = []
    list_kind: str | None = None
    code_lines: list[str] = []
    in_code = False
    table_rows: list[str] = []
    first_heading = True

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            output.append(f"<p>{inline(' '.join(part.strip() for part in paragraph))}</p>")
            paragraph = []

    def close_list() -> None:
        nonlocal list_kind
        if list_kind:
            output.append(f"</{list_kind}>")
            list_kind = None

    def flush_table() -> None:
        nonlocal table_rows
        if table_rows:
            output.append(table_to_html(table_rows))
            table_rows = []

    for raw in lines:
        line = raw.rstrip()

        if line.startswith("```"):
            flush_paragraph()
            close_list()
            flush_table()
            if in_code:
                output.append(f"<pre>{html.escape(chr(10).join(code_lines))}</pre>")
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if line.startswith("|") and line.endswith("|"):
            flush_paragraph()
            close_list()
            table_rows.append(line)
            continue
        flush_table()

        heading = re.match(r"^(#{1,4})\s+(.+)$", line)
        if heading:
            flush_paragraph()
            close_list()
            level = len(heading.group(1))
            text = inline(heading.group(2))
            if first_heading:
                output.append(f'<section class="cover"><div class="cover-mark">◎</div><h1>{text}</h1>')
                first_heading = False
            elif level == 2 and output and output[-1].endswith("</h1>"):
                output.append(f'<p class="subtitle">{text}</p>')
            else:
                if output and any("cover" in item for item in output[:2]) and "</section>" not in output:
                    output.append("</section>")
                output.append(f"<h{level}>{text}</h{level}>")
            continue

        if line == "---":
            flush_paragraph()
            close_list()
            if output and any("cover" in item for item in output[:2]) and "</section>" not in output:
                output.append("</section>")
            else:
                output.append("<hr>")
            continue

        if line.startswith("> "):
            flush_paragraph()
            close_list()
            output.append(f"<blockquote>{inline(line[2:])}</blockquote>")
            continue

        bullet = re.match(r"^-\s+(.+)$", line)
        ordered = re.match(r"^\d+\.\s+(.+)$", line)
        if bullet or ordered:
            flush_paragraph()
            wanted = "ul" if bullet else "ol"
            if list_kind != wanted:
                close_list()
                output.append(f"<{wanted}>")
                list_kind = wanted
            output.append(f"<li>{inline((bullet or ordered).group(1))}</li>")
            continue

        if not line.strip():
            flush_paragraph()
            close_list()
            continue

        paragraph.append(line)

    flush_paragraph()
    close_list()
    flush_table()
    if in_code:
        output.append(f"<pre>{html.escape(chr(10).join(code_lines))}</pre>")
    return "\n".join(output)


CSS = """
@page { size: A4; margin: 18mm 16mm 20mm; }
@page:first { margin: 0; }
* { box-sizing: border-box; }
html { background: #fff; }
body {
  margin: 0;
  min-height: 100vh;
  color: #17202B;
  background: #fff;
  font-family: "DejaVu Sans", "Noto Sans", Arial, sans-serif;
  font-size: 9.2pt;
  line-height: 1.46;
}
.cover {
  width: 210mm;
  height: 297mm;
  min-height: 297mm;
  margin: 0;
  padding: 34mm 23mm 22mm;
  color: #F6F0E5;
  background:
    radial-gradient(circle at 78% 22%, rgba(190,150,80,.25), transparent 24%),
    radial-gradient(circle at 20% 80%, rgba(89,44,99,.28), transparent 30%),
    linear-gradient(145deg, #060A0F 0%, #101827 58%, #1B1025 100%);
  page-break-after: always;
}
.cover::after {
  content: "";
  display: block;
  width: 54mm;
  height: 1px;
  margin-top: 28mm;
  background: linear-gradient(90deg, #BE9650, transparent);
}
.cover-mark {
  width: 27mm;
  height: 27mm;
  border: 1px solid rgba(190,150,80,.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48mm;
  color: #D8B66D;
  font-family: Georgia, serif;
  font-size: 25pt;
}
.cover h1 {
  max-width: 150mm;
  margin: 0 0 7mm;
  color: #D8B66D;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 35pt;
  line-height: 1.02;
  letter-spacing: .4pt;
}
.cover .subtitle {
  max-width: 145mm;
  margin: 0 0 32mm;
  color: #F6F0E5;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18pt;
  line-height: 1.22;
}
.cover p {
  margin: 2.2mm 0;
  color: rgba(246,240,229,.82);
  font-size: 10.5pt;
}
.cover strong { color: #D8B66D; }
h2 {
  margin: 9mm 0 6mm;
  padding: 0 0 3mm;
  color: #0A1320;
  border-bottom: 1px solid #BE9650;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22pt;
  line-height: 1.1;
  page-break-before: auto;
  break-before: auto;
  break-after: avoid;
}
h3 {
  margin: 7mm 0 2.5mm;
  color: #7D5E25;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13pt;
  line-height: 1.2;
  break-after: avoid;
}
h4 {
  margin: 5mm 0 2mm;
  color: #25354B;
  font-size: 10.5pt;
  break-after: avoid;
}
p { margin: 0 0 3.4mm; orphans: 3; widows: 3; }
strong { color: #111A27; }
code {
  padding: .25mm 1mm;
  color: #6E4D13;
  background: #F7F0E2;
  border-radius: 2px;
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 8.2pt;
}
pre {
  margin: 4mm 0 5mm;
  padding: 4mm;
  overflow: hidden;
  color: #E8DEC9;
  background: #0B111B;
  border-left: 2.2mm solid #BE9650;
  border-radius: 2mm;
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 6.9pt;
  line-height: 1.35;
  white-space: pre-wrap;
  break-inside: avoid;
}
blockquote {
  margin: 5mm 0;
  padding: 4mm 5mm;
  color: #3C2E16;
  background: #FBF6EC;
  border-left: 1.5mm solid #BE9650;
  break-inside: avoid;
}
ul, ol { margin: 1.5mm 0 4mm 5.5mm; padding-left: 4mm; }
li { margin: 1.5mm 0; padding-left: 1mm; }
li::marker { color: #A47A30; }
table {
  width: 100%;
  margin: 4mm 0 6mm;
  border-collapse: collapse;
  font-size: 7.6pt;
  line-height: 1.35;
  break-inside: avoid;
}
thead { display: table-header-group; }
th {
  padding: 2.4mm 2.2mm;
  color: #F8F2E6;
  background: #121B29;
  text-align: left;
  font-size: 7.3pt;
  letter-spacing: .15pt;
}
td {
  padding: 2.2mm;
  border-bottom: .25mm solid #E3D8C4;
  vertical-align: top;
}
tr:nth-child(even) td { background: #FBF8F2; }
hr { margin: 8mm 0; border: 0; border-top: .3mm solid #D9C7A5; }
"""


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source: {SOURCE}")

    body = markdown_to_html(SOURCE.read_text(encoding="utf-8"))
    document = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RESONANCIA — Informe ejecutivo de arquitectura</title>
<style>{CSS}</style>
</head>
<body>{body}</body>
</html>"""

    HTML_OUT.parent.mkdir(parents=True, exist_ok=True)
    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    HTML_OUT.write_text(document, encoding="utf-8")

    chromium_candidates = [
        "chromium",
        "chromium-browser",
        "google-chrome",
    ]
    last_error: Exception | None = None
    for browser in chromium_candidates:
        try:
            subprocess.run(
                [
                    browser,
                    "--headless",
                    "--no-sandbox",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--no-pdf-header-footer",
                    f"--print-to-pdf={PDF_OUT}",
                    HTML_OUT.as_uri(),
                ],
                cwd=ROOT,
                check=True,
                timeout=120,
            )
            break
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            last_error = exc
    else:
        raise SystemExit(f"Could not generate PDF: {last_error}")

    print(PDF_OUT)


if __name__ == "__main__":
    sys.exit(main())