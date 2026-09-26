import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type BoldRange = { start: number; end: number };

export function boldQuoteParts(quote: string, ranges: BoldRange[] = []) {
  const parts: { text: string; bold: boolean }[] = [];
  let position = 0;
  for (const { start, end } of ranges) {
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
      || start < position || end <= start || end > quote.length) continue;
    if (start > position) parts.push({ text: quote.slice(position, start), bold: false });
    parts.push({ text: quote.slice(start, end), bold: true });
    position = end;
  }
  if (position < quote.length) parts.push({ text: quote.slice(position), bold: false });
  return parts;
}

export function BoldQuoteText({ quote, ranges }: { quote: string; ranges?: BoldRange[] }) {
  return <>{boldQuoteParts(quote, ranges).map((part, index) =>
    part.bold ? <strong key={index} className="font-bold">{part.text}</strong> : part.text
  )}</>;
}

function readEditor(root: HTMLElement): { quote: string; ranges: BoldRange[] } {
  let quote = "";
  const ranges: BoldRange[] = [];
  const append = (text: string, bold: boolean) => {
    if (!text) return;
    const start = quote.length;
    quote += text;
    if (!bold) return;
    const last = ranges[ranges.length - 1];
    if (last?.end === start) last.end = quote.length;
    else ranges.push({ start, end: quote.length });
  };
  const walk = (node: Node, bold: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      append(node.textContent ?? "", bold);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      const placeholder = !node.previousSibling && !node.nextSibling
        && (node.parentElement === root || node.parentElement?.tagName === "DIV" || node.parentElement?.tagName === "P");
      if (!placeholder) append("\n", false);
      return;
    }
    if ((node.tagName === "DIV" || node.tagName === "P")
      && node.previousSibling && !(node.previousSibling instanceof HTMLElement && node.previousSibling.tagName === "BR")) {
      append("\n", false);
    }
    const weight = node.style.fontWeight;
    const nextBold = /^(normal|[1-5]00)$/.test(weight)
      ? false
      : bold || node.tagName === "B" || node.tagName === "STRONG"
        || /^(bold|[6-9]00)$/.test(weight);
    node.childNodes.forEach((child) => walk(child, nextBold));
  };
  root.childNodes.forEach((child) => walk(child, false));
  return { quote, ranges };
}

export function BoldQuoteEditor({
  quote,
  ranges,
  onChange,
  onBlur,
}: {
  quote: string;
  ranges: BoldRange[];
  onChange: (quote: string, ranges: BoldRange[]) => void;
  onBlur?: () => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLButtonElement>(null);
  const lastEmitted = useRef("");
  const savedSelection = useRef<Range | null>(null);
  const [boldActive, setBoldActive] = useState(false);
  const key = JSON.stringify([quote, ranges]);

  useLayoutEffect(() => {
    const root = editor.current;
    if (!root || key === lastEmitted.current) return;
    const current = readEditor(root);
    if (JSON.stringify([current.quote, current.ranges]) === key) return;
    savedSelection.current = null;
    root.replaceChildren();
    for (const part of boldQuoteParts(quote, ranges)) {
      root.appendChild(part.bold
        ? Object.assign(document.createElement("strong"), { textContent: part.text })
        : document.createTextNode(part.text));
    }
  }, [key, quote, ranges]);

  const updateSelection = useCallback(() => {
    const root = editor.current;
    const selection = window.getSelection();
    if (!root || !selection?.anchorNode || !root.contains(selection.anchorNode)) {
      if (document.activeElement !== toolbar.current) savedSelection.current = null;
      setBoldActive(false);
      return;
    }
    if (selection.rangeCount) savedSelection.current = selection.getRangeAt(0).cloneRange();
    setBoldActive(document.queryCommandState("bold"));
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, [updateSelection]);

  const emit = () => {
    const root = editor.current;
    if (!root) return;
    const next = readEditor(root);
    lastEmitted.current = JSON.stringify([next.quote, next.ranges]);
    onChange(next.quote, next.ranges);
    updateSelection();
  };

  const toggleBold = () => {
    editor.current?.focus();
    if (savedSelection.current && editor.current?.contains(savedSelection.current.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection.current);
    }
    document.execCommand("bold", false);
    emit();
  };

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-center border-b border-input px-2 py-1">
        <button
          ref={toolbar}
          type="button"
          aria-label="Negrita"
          aria-pressed={boldActive}
          title="Negrita (Ctrl+B)"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleBold}
          className={`h-8 w-8 rounded text-sm font-bold hover:bg-muted ${boldActive ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >B</button>
        <span className="ml-2 text-xs text-muted-foreground">Selecciona texto y pulsa B</span>
      </div>
      <div
        ref={editor}
        contentEditable
        role="textbox"
        aria-label="Frase del día"
        aria-multiline="true"
        data-placeholder="Escribe la frase principal..."
        suppressContentEditableWarning
        onInput={emit}
        onBlur={(event) => {
          if (event.relatedTarget !== toolbar.current) savedSelection.current = null;
          onBlur?.();
        }}
        onKeyUp={updateSelection}
        onMouseUp={updateSelection}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            document.execCommand("insertText", false, "\n");
            emit();
            return;
          }
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
            event.preventDefault();
            toggleBold();
          }
        }}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          emit();
        }}
        className="min-h-[100px] whitespace-pre-wrap break-words px-3 py-2 text-lg leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
      />
    </div>
  );
}