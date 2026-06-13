import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  geometrixSettingsTable,
  BulkUpdateGeometrixSchema,
  type GeometrixSetting,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

/**
 * Lista canónica de todas las geometrías con sus valores por defecto.
 * Espeja data/geometries.ts de la app móvil — sirve como fallback cuando
 * una geometría no tiene fila en geometrix_settings.
 */
const GEOMETRY_DEFAULTS: {
  id: string;
  name: string;
  category: "circulares" | "rectilineas" | "combinaciones" | "chakras";
  geometryType: "wireframe" | "mosaic";
}[] = [
  // ── Circulares ──────────────────────────────────────────────────────────────
  { id: "caleidoscopio",     name: "Caleidoscopio",              category: "circulares",    geometryType: "wireframe" },
  { id: "flor-vida",         name: "Flor de la Vida",            category: "circulares",    geometryType: "wireframe" },
  { id: "semilla-vida",      name: "Semilla de la Vida",         category: "circulares",    geometryType: "wireframe" },
  { id: "vesica",            name: "Vesica Piscis",              category: "circulares",    geometryType: "wireframe" },
  { id: "metatron",          name: "Cubo de Metatrón",           category: "circulares",    geometryType: "wireframe" },
  { id: "toroide",           name: "Toroide",                    category: "circulares",    geometryType: "wireframe" },
  { id: "mandala",           name: "Mandala",                    category: "circulares",    geometryType: "wireframe" },
  { id: "triquetra",         name: "Triquetra",                  category: "circulares",    geometryType: "wireframe" },
  { id: "fruto-vida",        name: "Fruto de la Vida",           category: "circulares",    geometryType: "wireframe" },
  { id: "huevo-vida",        name: "Huevo de la Vida",           category: "circulares",    geometryType: "wireframe" },
  { id: "nudo-celta",        name: "Nudo Celta",                 category: "circulares",    geometryType: "wireframe" },
  { id: "yin-yang",          name: "Yin-Yang",                   category: "circulares",    geometryType: "wireframe" },
  { id: "circulos",          name: "Círculos Concéntricos",      category: "circulares",    geometryType: "wireframe" },
  { id: "loto",              name: "Loto",                       category: "circulares",    geometryType: "wireframe" },
  { id: "circulo",           name: "Círculo",                    category: "circulares",    geometryType: "wireframe" },
  { id: "espiral-fibonacci", name: "Espiral de Fibonacci",       category: "circulares",    geometryType: "wireframe" },
  { id: "roseta-ocho",       name: "Roseta de Ocho Pétalos",     category: "circulares",    geometryType: "wireframe" },
  { id: "torus-infinito",    name: "Torus Infinito",             category: "circulares",    geometryType: "wireframe" },
  { id: "c-asset-3",         name: "Circular A3",                category: "circulares",    geometryType: "mosaic" },
  { id: "c-asset-5",         name: "Circular A5",                category: "circulares",    geometryType: "mosaic" },
  { id: "c-asset-10",        name: "Circular A10",               category: "circulares",    geometryType: "mosaic" },
  { id: "c-asset-11",        name: "Circular A11",               category: "circulares",    geometryType: "mosaic" },
  { id: "c-asset-12",        name: "Circular A12",               category: "circulares",    geometryType: "mosaic" },
  { id: "c-asset-24",        name: "Circular A24",               category: "circulares",    geometryType: "mosaic" },
  // ── Rectilíneas ─────────────────────────────────────────────────────────────
  { id: "merkaba",           name: "Merkaba",                    category: "rectilineas",   geometryType: "wireframe" },
  { id: "cubo-vida",         name: "Cubo de la Vida",            category: "rectilineas",   geometryType: "wireframe" },
  { id: "tetraedro",         name: "Tetraedro",                  category: "rectilineas",   geometryType: "wireframe" },
  { id: "hexaedro",          name: "Cubo (Hexaedro)",            category: "rectilineas",   geometryType: "wireframe" },
  { id: "octaedro",          name: "Octaedro",                   category: "rectilineas",   geometryType: "wireframe" },
  { id: "icosaedro",         name: "Icosaedro",                  category: "rectilineas",   geometryType: "wireframe" },
  { id: "dodecaedro",        name: "Dodecaedro",                 category: "rectilineas",   geometryType: "wireframe" },
  { id: "cuboctaedro",       name: "Cuboctaedro",                category: "rectilineas",   geometryType: "wireframe" },
  { id: "ivm",               name: "Lattice Isotrópica Vectorial", category: "rectilineas", geometryType: "wireframe" },
  { id: "cuadrado",          name: "Cuadrado",                   category: "rectilineas",   geometryType: "wireframe" },
  { id: "triangulo",         name: "Triángulo",                  category: "rectilineas",   geometryType: "wireframe" },
  { id: "r-1geometry",       name: "Rectilínea 1a",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-1geometry2",      name: "Rectilínea 1b",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-2geometry",       name: "Rectilínea 2a",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-2geometry2",      name: "Rectilínea 2b",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-3geometry",       name: "Rectilínea 3a",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-3geometry2",      name: "Rectilínea 3b",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-4geometry",       name: "Rectilínea 4a",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-4geometry2",      name: "Rectilínea 4b",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-1",         name: "Rectilínea A1",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-2",         name: "Rectilínea A2",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-4",         name: "Rectilínea A4",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-6",         name: "Rectilínea A6",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-7",         name: "Rectilínea A7",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-9",         name: "Rectilínea A9",              category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-17",        name: "Rectilínea A17",             category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-20",        name: "Rectilínea A20",             category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-21",        name: "Rectilínea A21",             category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-22",        name: "Rectilínea A22",             category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-26",        name: "Rectilínea A26",             category: "rectilineas",   geometryType: "mosaic" },
  { id: "r-asset-27",        name: "Rectilínea A27",             category: "rectilineas",   geometryType: "mosaic" },
  // ── Combinaciones ───────────────────────────────────────────────────────────
  { id: "arbol-vida",           name: "Árbol de la Vida",           category: "combinaciones", geometryType: "wireframe" },
  { id: "espiral",              name: "Espiral Áurea",              category: "combinaciones", geometryType: "wireframe" },
  { id: "pentagrama",           name: "Pentagrama",                 category: "combinaciones", geometryType: "wireframe" },
  { id: "hexagrama",            name: "Hexagrama",                  category: "combinaciones", geometryType: "wireframe" },
  { id: "octagrama",            name: "Octagrama",                  category: "combinaciones", geometryType: "wireframe" },
  { id: "eneagrama",            name: "Eneagrama",                  category: "combinaciones", geometryType: "wireframe" },
  { id: "sri-yantra",           name: "Sri Yantra",                 category: "combinaciones", geometryType: "wireframe" },
  { id: "decagrama",            name: "Decagrama",                  category: "combinaciones", geometryType: "wireframe" },
  { id: "cruz-solar",           name: "Cruz Solar",                 category: "combinaciones", geometryType: "wireframe" },
  { id: "vector-equilibrium",   name: "Vector Equilibrium",         category: "combinaciones", geometryType: "wireframe" },
  { id: "metatron-expandido",   name: "Cubo de Metatrón Expandido", category: "combinaciones", geometryType: "wireframe" },
  { id: "hexagono-sagrado",     name: "Hexágono Sagrado",           category: "combinaciones", geometryType: "wireframe" },
  { id: "estrella-12",          name: "Estrella de 12 Puntas",      category: "combinaciones", geometryType: "wireframe" },
  { id: "estrella",             name: "Estrella",                   category: "combinaciones", geometryType: "wireframe" },
  { id: "estrella-tetraedrica", name: "Estrella Tetraédrica",       category: "combinaciones", geometryType: "wireframe" },
  { id: "k-asset-8",            name: "Combinación A8",             category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-13",           name: "Combinación A13",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-14",           name: "Combinación A14",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-15",           name: "Combinación A15",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-16",           name: "Combinación A16",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-18",           name: "Combinación A18",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-19",           name: "Combinación A19",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-23",           name: "Combinación A23",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-25",           name: "Combinación A25",            category: "combinaciones", geometryType: "mosaic" },
  { id: "k-asset-28",           name: "Combinación A28",            category: "combinaciones", geometryType: "mosaic" },
  // ── 7 Chakras ────────────────────────────────────────────────────────────────
  { id: "chakra-1", name: "Muladhara",    category: "chakras", geometryType: "mosaic" },
  { id: "chakra-2", name: "Svadhisthana", category: "chakras", geometryType: "mosaic" },
  { id: "chakra-3", name: "Manipura",     category: "chakras", geometryType: "mosaic" },
  { id: "chakra-4", name: "Anahata",      category: "chakras", geometryType: "mosaic" },
  { id: "chakra-5", name: "Vishuddha",    category: "chakras", geometryType: "mosaic" },
  { id: "chakra-6", name: "Ajna",         category: "chakras", geometryType: "mosaic" },
  { id: "chakra-7", name: "Sahasrara",    category: "chakras", geometryType: "mosaic" },
];

function serializeSetting(
  def: (typeof GEOMETRY_DEFAULTS)[number],
  row: GeometrixSetting | undefined,
  fallbackSortOrder: number,
) {
  return {
    id: def.id,
    name: row?.name ?? null,
    defaultName: def.name,
    category: def.category,
    sortOrder: row?.sortOrder ?? fallbackSortOrder,
    geometryType: (row?.geometryType as "wireframe" | "mosaic") ?? def.geometryType,
    strokeMode: (row?.strokeMode as "thin" | "natural") ?? "natural",
    outlineWidth: row?.outlineWidth ?? 0,
    wireframeDefault: row?.wireframeDefault ?? false,
    visible: row?.visible ?? true,
    description: row?.description ?? null,
    color: row?.color ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function buildMerged(rows: GeometrixSetting[], { includeDeleted = false } = {}) {
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const catCounters: Record<string, number> = {};

  return GEOMETRY_DEFAULTS
    .filter((def) => {
      if (includeDeleted) return true;
      const row = rowMap.get(def.id);
      return !row?.deleted;
    })
    .map((def) => {
      const cat = def.category;
      const fallback = catCounters[cat] ?? 0;
      catCounters[cat] = fallback + 1;
      return serializeSetting(def, rowMap.get(def.id), fallback);
    });
}

// GET /admin/geometrix — lista completa con ajustes (admin)
router.get("/admin/geometrix", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db.select().from(geometrixSettingsTable);
    res.json({ geometries: buildMerged(rows) });
  } catch (err) {
    req.log.error({ err }, "Error getting geometrix settings");
    res.status(500).json({ error: "Error interno" });
  }
});

// PUT /admin/geometrix — bulk upsert (admin)
router.put("/admin/geometrix", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = BulkUpdateGeometrixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }

  const validIds = new Set(GEOMETRY_DEFAULTS.map((g) => g.id));
  const items = parsed.data.filter((item) => validIds.has(item.id));

  if (items.length === 0) {
    res.status(400).json({ error: "No hay geometrías válidas para guardar" });
    return;
  }

  try {
    for (const item of items) {
      await db
        .insert(geometrixSettingsTable)
        .values({
          id: item.id,
          name: item.name ?? null,
          sortOrder: item.sortOrder,
          geometryType: item.geometryType,
          strokeMode: item.strokeMode,
          outlineWidth: item.outlineWidth ?? 0,
          wireframeDefault: item.wireframeDefault ?? false,
          visible: item.visible,
          description: item.description ?? null,
          color: item.color ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: geometrixSettingsTable.id,
          set: {
            name: item.name ?? null,
            sortOrder: item.sortOrder,
            geometryType: item.geometryType,
            strokeMode: item.strokeMode,
            outlineWidth: item.outlineWidth ?? 0,
            wireframeDefault: item.wireframeDefault ?? false,
            visible: item.visible,
            description: item.description ?? null,
            color: item.color ?? null,
            updatedAt: new Date(),
          },
        });
    }

    const rows = await db.select().from(geometrixSettingsTable);
    res.json({ geometries: buildMerged(rows) });
  } catch (err) {
    req.log.error({ err }, "Error updating geometrix settings");
    res.status(500).json({ error: "Error interno" });
  }
});

// DELETE /admin/geometrix/:id — soft-delete (marca deleted=true)
router.delete("/admin/geometrix/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const isValid = GEOMETRY_DEFAULTS.some((g) => g.id === id);
  if (!isValid) {
    res.status(404).json({ error: "Geometría no encontrada" });
    return;
  }

  try {
    await db
      .insert(geometrixSettingsTable)
      .values({
        id,
        deleted: true,
        visible: false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: geometrixSettingsTable.id,
        set: { deleted: true, visible: false, updatedAt: new Date() },
      });

    const rows = await db.select().from(geometrixSettingsTable);
    res.json({ geometries: buildMerged(rows) });
  } catch (err) {
    req.log.error({ err }, "Error deleting geometry");
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /geometrix/settings — configuración pública para la app móvil
router.get("/geometrix/settings", async (req, res) => {
  try {
    const rows = await db.select().from(geometrixSettingsTable);
    res.json({ geometries: buildMerged(rows) });
  } catch (err) {
    req.log.error({ err }, "Error getting geometrix settings (public)");
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
