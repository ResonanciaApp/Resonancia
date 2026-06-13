import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API_BASE = `${BASE_URL}/api`;

type GeometryCategory = "circulares" | "rectilineas" | "combinaciones";
type GeometryType = "wireframe" | "mosaic";
type StrokeMode = "thin" | "natural";

interface GeometryRow {
  id: string;
  name: string | null;
  defaultName: string;
  category: GeometryCategory;
  sortOrder: number;
  geometryType: GeometryType;
  strokeMode: StrokeMode;
  visible: boolean;
  description: string | null;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<GeometryCategory, string> = {
  circulares: "Circulares",
  rectilineas: "Rectilíneas",
  combinaciones: "Combinaciones",
};

const CATEGORY_COUNT: Record<GeometryCategory, number> = {
  circulares: 24,
  rectilineas: 31,
  combinaciones: 25,
};

async function fetchGeometries(): Promise<GeometryRow[]> {
  const res = await fetch(`${API_BASE}/admin/geometrix`, { credentials: "include" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.geometries as GeometryRow[];
}

async function saveGeometries(rows: GeometryRow[]): Promise<GeometryRow[]> {
  const body = rows.map((r) => ({
    id: r.id,
    name: r.name?.trim() || null,
    sortOrder: r.sortOrder,
    geometryType: r.geometryType,
    strokeMode: r.strokeMode,
    visible: r.visible,
    description: r.description?.trim() || null,
  }));
  const res = await fetch(`${API_BASE}/admin/geometrix`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.geometries as GeometryRow[];
}

function sortByOrder(rows: GeometryRow[]): GeometryRow[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
}

function GeometryRowItem({
  row,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
}: {
  row: GeometryRow;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: (updated: Partial<GeometryRow>) => void;
}) {
  const displayName = row.name || row.defaultName;
  const isWireframe = row.geometryType === "wireframe";

  return (
    <div
      className={`flex gap-3 items-start p-3 rounded-lg border transition-colors ${
        row.visible
          ? "border-border bg-card hover:bg-secondary/30"
          : "border-border/40 bg-muted/20 opacity-60"
      }`}
    >
      {/* Orden */}
      <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 mb-1" />
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-0.5 rounded hover:bg-secondary disabled:opacity-20"
          title="Subir"
        >
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <span className="text-[10px] text-muted-foreground/50 font-mono w-5 text-center">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-0.5 rounded hover:bg-secondary disabled:opacity-20"
          title="Bajar"
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
        {/* Nombre */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input
            value={row.name ?? ""}
            onChange={(e) => onChange({ name: e.target.value || null })}
            placeholder={row.defaultName}
            className="h-8 text-sm"
          />
          {row.name && row.name !== row.defaultName && (
            <p className="text-[10px] text-muted-foreground">
              Original: {row.defaultName}
            </p>
          )}
        </div>

        {/* Tipo + Trazo */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select
              value={row.geometryType}
              onValueChange={(v) => onChange({ geometryType: v as GeometryType })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wireframe">Wireframe</SelectItem>
                <SelectItem value="mosaic">Mosaico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isWireframe && (
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Trazo</Label>
              <Select
                value={row.strokeMode}
                onValueChange={(v) => onChange({ strokeMode: v as StrokeMode })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="thin">Fino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="lg:col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">
            Descripción (sección Aprende)
          </Label>
          <Textarea
            value={row.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value || null })}
            placeholder="Significado y origen de esta geometría..."
            className="text-sm resize-none min-h-[56px]"
            rows={2}
          />
        </div>
      </div>

      {/* Visible toggle */}
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange({ visible: !row.visible })}
          className={`p-1.5 rounded-md transition-colors ${
            row.visible
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/40 hover:bg-secondary"
          }`}
          title={row.visible ? "Ocultar del carrusel" : "Mostrar en carrusel"}
        >
          {row.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
        <span className="text-[9px] text-muted-foreground/50">
          {row.visible ? "visible" : "oculta"}
        </span>
      </div>
    </div>
  );
}

export default function GeometrixPage() {
  const [rows, setRows] = useState<GeometryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeCategory, setActiveCategory] = useState<GeometryCategory>("circulares");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGeometries();
      setRows(data);
      setDirty(false);
    } catch {
      toast.error("No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rowsByCategory = (cat: GeometryCategory) =>
    sortByOrder(rows.filter((r) => r.category === cat));

  function updateRow(id: string, patch: Partial<GeometryRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  function moveRow(catRows: GeometryRow[], fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= catRows.length) return;
    const reordered = [...catRows];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updated = reordered.map((r, i) => ({ ...r, sortOrder: i }));
    setRows((prev) => {
      const out = [...prev];
      for (const u of updated) {
        const idx = out.findIndex((r) => r.id === u.id);
        if (idx !== -1) out[idx] = u;
      }
      return out;
    });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveGeometries(rows);
      setRows(saved);
      setDirty(false);
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const categories: GeometryCategory[] = ["circulares", "rectilineas", "combinaciones"];

  const hiddenCount = rows.filter((r) => !r.visible).length;
  const totalVisible = rows.filter((r) => r.visible).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Geometrix</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura el orden, tipo, trazo y visibilidad de cada geometría en el carrusel.
          </p>
          {!loading && (
            <div className="flex gap-3 mt-2">
              <Badge variant="outline" className="text-xs">
                {totalVisible} visibles
              </Badge>
              {hiddenCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {hiddenCount} ocultas
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading || saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving || loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as GeometryCategory)}
        >
          <TabsList className="mb-4">
            {categories.map((cat) => {
              const catRows = rows.filter((r) => r.category === cat);
              const hidden = catRows.filter((r) => !r.visible).length;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-2">
                  {CATEGORY_LABELS[cat]}
                  <span className="text-xs text-muted-foreground">
                    {catRows.length}
                    {hidden > 0 && ` (${hidden} ocultas)`}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((cat) => {
            const catRows = rowsByCategory(cat);
            return (
              <TabsContent key={cat} value={cat}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      {CATEGORY_LABELS[cat]}{" "}
                      <span className="text-sm text-muted-foreground font-normal">
                        — {catRows.length} geometrías (esperadas: {CATEGORY_COUNT[cat]})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {catRows.map((row, index) => (
                      <GeometryRowItem
                        key={row.id}
                        row={row}
                        index={index}
                        total={catRows.length}
                        onMoveUp={() => moveRow(catRows, index, index - 1)}
                        onMoveDown={() => moveRow(catRows, index, index + 1)}
                        onChange={(patch) => updateRow(row.id, patch)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {dirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}
