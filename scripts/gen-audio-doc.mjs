import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";
import { writeFileSync } from "node:fs";

const NAVY = "0B0F14";
const GOLD = "BE9650";
const ACCENT = "D6A85B";
const FG = "2B2B2B";
const MUTED = "6B6B6B";

const FONT = "Calibri";

function h1(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 40, color: NAVY, font: FONT })],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, color: GOLD, font: FONT })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, color: FG, font: FONT, ...opts })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, color: FG, font: FONT, ...opts })],
  });
}

function cell(text, { header = false, width } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header
      ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY }
      : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: header,
            size: 20,
            color: header ? "FFFFFF" : FG,
            font: FONT,
          }),
        ],
      }),
    ],
  });
}

function table(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hh, i) => cell(hh, { header: true, width: widths?.[i] })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => cell(c, { width: widths?.[i] })),
          })
      ),
    ],
  });
}

const doc = new Document({
  creator: "RESONANCIA — Casa del Cuenco",
  title: "Decisión de formato de audio",
  styles: {
    default: { document: { run: { font: FONT } } },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "RESONANCIA — Casa del Cuenco", bold: true, size: 24, color: GOLD, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Decisión técnica: formato de audio para la app", bold: true, size: 48, color: NAVY, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({ text: "Fecha: 7 de junio de 2026  ·  Estado: DECISIÓN TOMADA", size: 20, color: MUTED, font: FONT, italics: true }),
          ],
        }),

        h1("1. Resumen de la decisión"),
        p(
          "Se adopta AAC (.m4a) como formato estándar de distribución de audio en la app. WAV se reserva únicamente para los masters de producción. Se descartan MP3 (menos eficiente y peor decodificación en iOS), Opus (soporte inconsistente en React Native / iOS vía expo-av) y HLS (sobre-ingeniería para sesiones de 10-50 minutos).",
          { bold: false }
        ),

        h1("2. Por qué AAC y no las demás opciones"),
        h2("WAV — solo masters"),
        bullet("Imprescindible en producción (grabación/edición en 24-bit), pero inviable para distribución por peso, ancho de banda y consumo de batería."),
        bullet("Una sesión de 10 min en WAV 48 kHz 24-bit ronda los 170 MB; en AAC 256 kbps pesa ~18 MB (≈10× menos)."),
        h2("AAC — el estándar elegido"),
        bullet("Reproducción nativa y por hardware en iOS y Android vía expo-av / expo-audio (menos batería)."),
        bullet("Calidad transparente a 256 kbps VBR para el oído de la mayoría de usuarios en audífonos o parlantes normales."),
        bullet("Excelente relación calidad / peso / experiencia, igual que Calm, Headspace o Pura Mente."),
        h2("Opus — descartado"),
        bullet("Más eficiente que AAC en papel, pero en iOS vía expo-av el soporte es inconsistente (requiere contenedores .caf/.ogg y no reproduce de forma confiable). El riesgo multiplataforma no compensa."),
        h2("HLS streaming — descartado por ahora"),
        bullet("Útil para archivos muy largos o bitrate adaptativo. Las sesiones (10-50 min) ya se sirven con progressive download + range requests (GET /api/storage/objects/*), que permite seek y arranque rápido sin la complejidad de segmentar y generar manifests."),

        h1("3. Caso especial: cuencos, gongs y sonoterapia"),
        p(
          "El contenido de RESONANCIA tiene armónicos largos, resonancias sutiles, frecuencias graves profundas y colas de reverberación extensas. Por eso se evita MP3 y se usa AAC con bitrate alto:"
        ),
        bullet("AAC 256 kbps como estándar para cuencos y gongs."),
        bullet("Alternativa: AAC VBR de alta calidad (≈320 kbps equivalente) cuando se requiera el máximo detalle."),

        h1("4. Matriz de formatos por tipo de contenido"),
        table(
          ["Tipo de contenido", "Formato de distribución", "Dónde vive"],
          [
            ["Cuencos / gongs / ancestrales", "AAC 256 VBR", "Object Storage"],
            ["Música ambient / paisajes sonoros", "AAC 256", "Object Storage"],
            ["Meditaciones guiadas (voz)", "AAC 128-192", "Object Storage"],
            ["Loops base de Naturaleza", "AAC 128-160 (cortos)", "Bundle (precarga)"],
            ["Premium Hi-Fi (futuro)", "FLAC / WAV descargable opcional", "Object Storage"],
          ],
          [40, 35, 25]
        ),

        h1("5. Bundle vs streaming"),
        bullet("Cada MB bundleado en assets/ infla el .ipa/.aab que el usuario descarga e instala."),
        bullet("Regla: bundlear solo lo imprescindible (los ~4 loops base de Sonidos Naturaleza) y servir el resto desde Object Storage."),
        bullet("Esto impacta la experiencia de instalación más que el propio formato."),

        h1("6. Loops de Sonidos Naturaleza (gapless)"),
        bullet("Tanto MP3 como AAC añaden priming/padding del encoder, que introduce un micro-silencio al reiniciar un loop."),
        bullet("Hoy se resuelve con crossfade, por lo que no es bloqueante."),
        bullet("Para un loop \u201cduro\u201d sin crossfade, AAC no garantiza gapless perfecto sin metadata especial. En loops cortos, AAC 128-160 kbps es suficiente."),

        h1("7. Pipeline de conversión (ffmpeg)"),
        p("Conversión desde el master WAV:"),
        bullet("Bitrate fijo:  ffmpeg -i master.wav -c:a aac -b:a 256k salida.m4a"),
        bullet("VBR alta calidad:  ffmpeg -i master.wav -c:a aac -q:a 1.5 salida.m4a"),
        bullet("Voz (meditaciones):  ffmpeg -i master.wav -c:a aac -b:a 160k voz.m4a"),
        bullet("Loops base (cortos):  ffmpeg -i loop.wav -c:a aac -b:a 160k loop.m4a"),

        h1("8. Impacto en el backlog del proyecto"),
        bullet("El plan de precarga de Sonidos Naturaleza pasa de MP3 128-160 kbps a AAC 128-160 kbps (misma calidad, algo menos de peso, mejor decodificación en iOS)."),
        bullet("La decisión queda registrada en replit.md (sección Pendientes/backlog) como referencia para toda subida futura de audio."),

        new Paragraph({
          spacing: { before: 360 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 8 } },
          children: [
            new TextRun({ text: "RESONANCIA — Casa del Cuenco  ·  Documento interno de decisión técnica", size: 16, color: MUTED, italics: true, font: FONT }),
          ],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("docs/formato-audio-decision.docx", buffer);
console.log("OK: docs/formato-audio-decision.docx");
