from pathlib import Path
import fitz


INPUTS = [
    Path("attached_assets/descarga_1787229978068.pdf"),
    Path("attached_assets/Informe_Final_1787229978069.pdf"),
]
OUT = Path(".agents/outputs/pdf-review")
OUT.mkdir(parents=True, exist_ok=True)

for source in INPUTS:
    doc = fitz.open(source)
    stem = source.stem
    text_parts = []
    for index, page in enumerate(doc, start=1):
        text_parts.append(f"\n\n===== PAGE {index} =====\n\n{page.get_text()}")
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        pix.save(OUT / f"{stem}-page-{index:02d}.png")
    (OUT / f"{stem}-fitz.txt").write_text("".join(text_parts), encoding="utf-8")
    print(f"{source}: {len(doc)} pages rendered")