import { Router } from "express";

const router = Router();

router.get("/calendar/event.ics", (req, res) => {
  const { title, start, end, description, uid } = req.query as Record<string, string>;

  if (!title || !start || !end) {
    res.status(400).json({ error: "Parámetros requeridos: title, start, end" });
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res.status(400).json({ error: "Fechas inválidas" });
    return;
  }

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const eventUid = uid ?? `${Date.now()}@resonancia.app`;
  const desc = (description ?? "").replace(/\n/g, "\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RESONANCIA//Casa del Cuenco//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${eventUid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tu encuentro en vivo está por comenzar",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="encuentro.ics"`);
  res.send(ics);
});

export default router;
