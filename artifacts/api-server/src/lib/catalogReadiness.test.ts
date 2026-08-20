import { describe, expect, it } from "vitest";
import { getCatalogReadiness } from "./catalogReadiness";

const session = {
  id: "20",
  title: "Baño de cuencos",
  subtitle: "Sesión de prueba",
  categoryId: "sonidos-ancestrales",
  categoryLabel: "Sonoterapia",
  duration: 20,
  description: "Una descripción válida.",
  isPlaceholder: false,
};

describe("getCatalogReadiness", () => {
  it("acepta una sesión final con pista principal remota", () => {
    expect(
      getCatalogReadiness(session, [
        { role: "main", url: "/objects/catalog/audio.mp3", assetKey: null },
      ]),
    ).toEqual({ ready: true, kind: "final" });
  });

  it("acepta una sesión final con asset bundleado", () => {
    expect(
      getCatalogReadiness(session, [
        { role: "base", url: null, assetKey: "bundle:20" },
      ]),
    ).toEqual({ ready: true, kind: "final" });
  });

  it("permite un placeholder explícito sin audio", () => {
    expect(
      getCatalogReadiness({ ...session, isPlaceholder: true }, []),
    ).toEqual({ ready: true, kind: "placeholder" });
  });

  it("bloquea una sesión final sin pista reproducible", () => {
    const result = getCatalogReadiness(session, [
      { role: "voice", url: "/objects/catalog/voz.mp3", assetKey: null },
    ]);
    expect(result.ready).toBe(false);
    if (!result.ready) expect(result.reason).toContain("audio principal");
  });

  it("no acepta un assetKey arbitrario como si fuera un bundle reproducible", () => {
    const result = getCatalogReadiness(session, [
      { role: "main", url: null, assetKey: "cuencos.mp3" },
    ]);
    expect(result.ready).toBe(false);
  });

  it("no acepta un marker bundle si la sesión no está en el manifiesto de la app", () => {
    const result = getCatalogReadiness(
      { ...session, id: "test-session" },
      [{ role: "main", url: null, assetKey: "bundle:test-session" }],
    );
    expect(result.ready).toBe(false);
  });

  it("bloquea metadata esencial vacía incluso para un placeholder", () => {
    const result = getCatalogReadiness(
      { ...session, title: " ", isPlaceholder: true },
      [],
    );
    expect(result.ready).toBe(false);
    if (!result.ready) expect(result.reason).toContain("datos esenciales");
  });
});