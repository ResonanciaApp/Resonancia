import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/react";
import { toast } from "sonner";
import { GLYPH_STRINGS } from "@/lib/glyph-strings";
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Save, RotateCcw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const API_BASE = "/api";

type GeometryCategory = "circulares" | "rectilineas" | "combinaciones" | "chakras";
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
  outlineWidth: number;
  wireframeDefault: boolean;
  visible: boolean;
  description: string | null;
  color: string | null;
  updatedAt: string;
}

const COLOR_PALETTE = [
  "#BE9650", "#8B9FC9", "#C4887A", "#7FB5A0",
  "#B8A5C8", "#C4A882", "#87B5C4", "#A89878",
  "#C4B87A", "#8BA87F", "#C47A8A", "#7A9AC4",
];

const CATEGORY_LABELS: Record<GeometryCategory, string> = {
  circulares: "Circulares",
  rectilineas: "Rectilíneas",
  combinaciones: "Combinaciones",
  chakras: "7 Chakras",
};

const CATEGORY_COUNT: Record<GeometryCategory, number> = {
  circulares: 24,
  rectilineas: 31,
  combinaciones: 25,
  chakras: 7,
};

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchGeometries(token: string | null): Promise<GeometryRow[]> {
  const res = await fetch(`${API_BASE}/admin/geometrix`, {
    headers: { ...authHeaders(token) },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.geometries as GeometryRow[];
}

async function saveGeometries(rows: GeometryRow[], token: string | null): Promise<GeometryRow[]> {
  const body = rows.map((r) => ({
    id: r.id,
    name: r.name?.trim() || null,
    sortOrder: r.sortOrder,
    geometryType: r.geometryType,
    strokeMode: r.strokeMode,
    outlineWidth: r.outlineWidth ?? 0,
    wireframeDefault: r.wireframeDefault ?? false,
    visible: r.visible,
    description: r.description?.trim() || null,
    color: r.color || null,
  }));
  const res = await fetch(`${API_BASE}/admin/geometrix`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.geometries as GeometryRow[];
}

function sortByOrder(rows: GeometryRow[]): GeometryRow[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
}

function GeometryThumbnail({ id, color, wireframeDefault }: { id: string; color?: string | null; wireframeDefault?: boolean }) {
  const svgContent = useMemo(() => {
    const raw = GLYPH_STRINGS[id];
    if (!raw) return null;
    const stroke = color ?? "#D4AF37";
    let content = raw.replace(/GLYPH_STROKE/g, stroke);
    if (wireframeDefault) {
      content = content.replace(/fill="([^"]+)"/g, (_m, fillColor) =>
        fillColor === "none"
          ? 'fill="none"'
          : `fill="none" stroke="${fillColor}" stroke-width="3.5"`
      );
    }
    return content;
  }, [id, color, wireframeDefault]);

  if (!svgContent) {
    return (
      <div className="w-[120px] h-[120px] rounded border border-border/40 flex items-center justify-center shrink-0 bg-secondary/20">
        <span className="text-[8px] text-muted-foreground/40 font-mono">?</span>
      </div>
    );
  }

  return (
    <div className="w-[120px] h-[120px] rounded border border-border/30 shrink-0 bg-secondary/20 overflow-hidden flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        width="108"
        height="108"
        xmlns="http://www.w3.org/2000/svg"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

function GeometryRowItem({
  row,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onChange,
  onDelete,
}: {
  row: GeometryRow;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChange: (updated: Partial<GeometryRow>) => void;
  onDelete: () => void;
}) {
  const displayName = row.name || row.defaultName;
  // "Trazo fino" solo tiene efecto en geometrías dibujadas con líneas (su SVG
  // define stroke-width). Las de relleno sólido (mosaicos "asset…") no tienen
  // grosor de línea que adelgazar, así que el control no aplica. Esto se deriva
  // del SVG real (intrínseco), NO del geometryType editable por el usuario.
  // Se usa la MISMA regex con la que SacredGlyph escala el trazo en el móvil
  // (stroke-width="…") para no mostrar "Trazo" donde el render no haría nada.
  const supportsThin = /stroke-width="[^"]+"/.test(GLYPH_STRINGS[row.id] ?? "");

  return (
    <div
      className={`flex gap-3 items-center p-3 rounded-lg border transition-colors ${
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

      {/* Thumbnail */}
      <GeometryThumbnail id={row.id} color={row.color} wireframeDefault={row.wireframeDefault} />

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
          {row.geometryType !== "mosaic" && (
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
          )}
          {supportsThin ? (
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
          ) : (
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Modo por defecto</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Switch
                  id={`wf-${row.id}`}
                  checked={row.wireframeDefault ?? false}
                  onCheckedChange={(v) => onChange({ wireframeDefault: v })}
                />
                <label htmlFor={`wf-${row.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                  {row.wireframeDefault ? "Wireframe sutil" : "Mosaico"}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Color */}
        <div className="lg:col-span-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Color del trazo</Label>
            {row.color && (
              <button
                type="button"
                onClick={() => onChange({ color: null })}
                className="text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                restaurar default
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => onChange({ color: row.color === c ? null : c })}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  background: c,
                  borderColor: row.color === c ? "#fff" : "transparent",
                  boxShadow: row.color === c ? `0 0 0 1px ${c}` : "none",
                  outline: "none",
                }}
              />
            ))}
            {/* Custom hex */}
            <div className="flex items-center gap-1 ml-1">
              <div
                className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/40 overflow-hidden shrink-0"
                style={{ background: row.color && !COLOR_PALETTE.includes(row.color) ? row.color : "transparent" }}
              />
              <input
                type="text"
                maxLength={7}
                placeholder="#hex"
                value={row.color && !COLOR_PALETTE.includes(row.color) ? row.color : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange({ color: v.length === 7 ? v : null });
                }}
                className="h-6 w-16 px-1.5 text-[11px] font-mono rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
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

      {/* Visible toggle + delete */}
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-md transition-colors text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 mt-1"
              title="Borrar geometría"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Borrar geometría?</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-medium text-foreground">{displayName}</span> dejará de aparecer en
                el carrusel de la app. Esta acción no se puede deshacer desde el panel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Borrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function GeometrixPage() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<GeometryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeCategory, setActiveCategory] = useState<GeometryCategory>("circulares");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchGeometries(token);
      setRows(data);
      setDirty(false);
    } catch {
      toast.error("No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

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

  async function handleDelete(id: string) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/admin/geometrix/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
      });
      if (!res.ok) throw new Error("Error al borrar");
      const data = await res.json();
      setRows(data.geometries as GeometryRow[]);
      setDirty(false);
      toast.success("Geometría borrada");
    } catch {
      toast.error("No se pudo borrar la geometría");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      const saved = await saveGeometries(rows, token);
      setRows(saved);
      setDirty(false);
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const categories: GeometryCategory[] = ["circulares", "rectilineas", "combinaciones", "chakras"];

  const hiddenCount = rows.filter((r) => !r.visible).length;
  const totalVisible = rows.filter((r) => r.visible).length;

  return (
    <div data-gx-theme className="-m-6 p-6 min-h-screen" style={{ background: "linear-gradient(160deg, #1A1030 0%, #0D0820 55%, #06070F 100%)" }}>
    <style>{`
      [data-gx-theme] {
        --background: 270 50% 8%;
        --foreground: 270 20% 92%;
        --card: 264 60% 11%;
        --card-foreground: 270 20% 92%;
        --popover: 264 60% 11%;
        --popover-foreground: 270 20% 92%;
        --primary: 43 60% 52%;
        --primary-foreground: 0 0% 8%;
        --secondary: 268 55% 18%;
        --secondary-foreground: 270 20% 88%;
        --muted: 268 50% 15%;
        --muted-foreground: 270 20% 62%;
        --accent: 268 55% 22%;
        --accent-foreground: 270 20% 92%;
        --border: 270 38% 22%;
        --input: 270 38% 22%;
        --ring: 43 60% 52%;
        --destructive: 0 72% 51%;
        --destructive-foreground: 0 0% 98%;
      }
    `}</style>
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
                        onDelete={() => handleDelete(row.id)}
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
