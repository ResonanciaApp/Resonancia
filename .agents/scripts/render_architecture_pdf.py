#!/usr/bin/env python3
"""Render every report page with PyMuPDF for visual verification."""

from __future__ import annotations

import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "docs" / "informe-ejecutivo-arquitectura-resonancia.pdf"
OUT = ROOT / ".agents" / "outputs" / "architecture-report-pages"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    matrix = fitz.Matrix(1.25, 1.25)
    for index, page in enumerate(doc):
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pix.save(OUT / f"page-{index + 1:02d}.png")
    print(f"Rendered {doc.page_count} pages to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())