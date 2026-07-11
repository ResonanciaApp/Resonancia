#!/usr/bin/env node
/**
 * Injects fontFamily: "Manrope" into every style object inside
 * StyleSheet.create({...}) blocks that have a text-related property
 * (fontSize, lineHeight, letterSpacing, textAlign, fontWeight, etc.)
 * but no fontFamily.  Handles both multi-line and single-line style objects.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const TEXT_PROPS = [
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "fontWeight",
  "textTransform",
  "textDecorationLine",
];

function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".expo" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, results);
    else if (extname(entry) === ".ts" || extname(entry) === ".tsx") results.push(full);
  }
  return results;
}

function countChar(str, ch) {
  let n = 0;
  for (const c of str) if (c === ch) n++;
  return n;
}

function hasTextPropInStr(s) {
  return TEXT_PROPS.some(p => new RegExp(p + "\\s*:").test(s));
}
function hasFontFamilyInStr(s) {
  return /fontFamily\s*:/.test(s);
}

function processFile(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const out = [];
  let changed = false;

  let inSSCreate = false;
  let depth = 0;
  let styleObjLines = [];
  let hasTextProp = false;
  let hasFontFamily = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Enter StyleSheet.create block ──────────────────────────────────────
    if (!inSSCreate && /StyleSheet\.create\s*\(\s*\{/.test(line)) {
      inSSCreate = true;
      depth = 1;
      out.push(line);
      continue;
    }

    if (!inSSCreate) {
      out.push(line);
      continue;
    }

    const opens  = countChar(line, "{");
    const closes = countChar(line, "}");

    // ── Top level of StyleSheet.create: individual named style entries ─────
    if (depth === 1) {
      if (opens > closes) {
        // Multi-line style object starts here
        depth += opens - closes;
        styleObjLines = [line];
        hasFontFamily = hasFontFamilyInStr(line);
        hasTextProp   = hasTextPropInStr(line);
      } else if (opens === closes && opens > 0) {
        // ── Single-line style object: e.g.  foo: { fontSize: 14, color: "#fff" }
        if (hasTextPropInStr(line) && !hasFontFamilyInStr(line)) {
          // Inject fontFamily right after the opening brace
          const injected = line.replace(/(\{)/, '$1 fontFamily: "Manrope",');
          out.push(injected);
          changed = true;
        } else {
          out.push(line);
        }
        // depth stays 1
      } else {
        // Closing brace of StyleSheet.create itself (or empty line, etc.)
        depth += opens - closes;
        if (depth <= 0) { inSSCreate = false; depth = 0; }
        out.push(line);
      }
      continue;
    }

    // ── Inside a multi-line style object (depth >= 2) ─────────────────────
    styleObjLines.push(line);
    if (hasFontFamilyInStr(line)) hasFontFamily = true;
    if (hasTextPropInStr(line))   hasTextProp   = true;
    depth += opens - closes;

    if (depth === 1) {
      // Style object just closed → flush it
      if (hasTextProp && !hasFontFamily) {
        let inserted = false;
        for (const sl of styleObjLines) {
          out.push(sl);
          if (!inserted && /\{/.test(sl)) {
            // Use next line's indentation, or fall back to 4 spaces
            const nextLine = styleObjLines[styleObjLines.indexOf(sl) + 1];
            const indent = nextLine
              ? nextLine.match(/^(\s*)/)[1]
              : (sl.match(/^(\s*)/)[1] + "  ");
            out.push(`${indent}fontFamily: "Manrope",`);
            inserted = true;
          }
        }
        changed = true;
      } else {
        for (const sl of styleObjLines) out.push(sl);
      }
      styleObjLines = [];
    }
  }

  if (changed) {
    writeFileSync(file, out.join("\n"), "utf8");
    return true;
  }
  return false;
}

const files = walk("artifacts/mobile");
let totalModified = 0;

for (const file of files) {
  if (processFile(file)) {
    totalModified++;
    console.log(`  ✓ ${file}`);
  }
}

console.log(`\nDone — ${totalModified} files modified.`);
