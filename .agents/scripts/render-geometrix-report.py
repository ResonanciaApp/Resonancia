from pathlib import Path
import sys

import fitz


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: render-geometrix-report.py INPUT.pdf OUTPUT_DIR")

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.mkdir(parents=True, exist_ok=True)

    document = fitz.open(source)
    print(f"pages={document.page_count}")
    print(f"metadata={document.metadata}")

    zoom = fitz.Matrix(1.5, 1.5)
    for index, page in enumerate(document):
        pixmap = page.get_pixmap(matrix=zoom, alpha=False)
        target = output / f"page-{index + 1:02d}.png"
        pixmap.save(target)
        print(f"{index + 1:02d}: {page.rect.width:.1f}x{page.rect.height:.1f} -> {target}")


if __name__ == "__main__":
    main()