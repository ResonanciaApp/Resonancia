import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Lock,
  Unlock,
} from "lucide-react";
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

const API_BASE = "/api";

interface SceneAnimation {
  id: number;
  name: string;
  description: string | null;
  recipe: Record<string, unknown>;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
  submittedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchScenes(token: string | null): Promise<SceneAnimation[]> {
  const res = await fetch(`${API_BASE}/admin/scene-animations`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.scenes as SceneAnimation[];
}

async function patchScene(
  id: number,
  patch: Partial<SceneAnimation>,
  token: string | null,
): Promise<SceneAnimation> {
  const res = await fetch(`${API_BASE}/admin/scene-animations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

async function deleteScene(id: number, token: string | null): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/scene-animations/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function layerCount(recipe: Record<string, unknown>): number {
  try {
    const active = recipe.active;
    if (Array.isArray(active)) return active.length;
  } catch {
    // ignore
  }
  return 0;
}

function SceneRow({
  scene,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onTogglePremium,
  onSaveName,
  onSaveDescription,
  onDelete,
}: {
  scene: SceneAnimation;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleActive: () => void;
  onTogglePremium: () => void;
  onSaveName: (name: string) => void;
  onSaveDescription: (desc: string) => void;
  onDelete: () => void;
}) {
  const [localName, setLocalName] = useState(scene.name);
  const [localDesc, setLocalDesc] = useState(scene.description ?? "");

  const layers = layerCount(scene.recipe);

  return (
    <div
      className={`flex gap-3 items-start p-4 rounded-lg border transition-colors ${
        scene.isActive
          ? "border-border bg-card"
          : "border-border/40 bg-muted/20 opacity-70"
      }`}
    >
      {/* Orden */}
      <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
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
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="text-[10px] font-mono">
            #{scene.id}
          </Badge>
          {layers > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {layers} {layers === 1 ? "capa" : "capas"}
            </Badge>
          )}
          {scene.submittedBy && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              móvil
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDate(scene.createdAt)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <div className="flex gap-1.5">
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Nombre de la escena"
                className="h-8 text-sm flex-1"
              />
              {localName !== scene.name && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-2 text-xs"
                  onClick={() => onSaveName(localName)}
                >
                  Guardar
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Descripción</Label>
            <div className="flex gap-1.5">
              <Textarea
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
                placeholder="Descripción opcional..."
                className="text-sm resize-none min-h-[32px] h-8 flex-1"
                rows={1}
              />
              {localDesc !== (scene.description ?? "") && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-2 text-xs self-start"
                  onClick={() => onSaveDescription(localDesc)}
                >
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controles derecha */}
      <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
        {/* Activa */}
        <button
          type="button"
          onClick={onToggleActive}
          className={`p-1.5 rounded-md transition-colors ${
            scene.isActive
              ? "text-green-400 hover:bg-green-400/10"
              : "text-muted-foreground/40 hover:bg-secondary"
          }`}
          title={scene.isActive ? "Desactivar" : "Activar"}
        >
          {scene.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <span className="text-[9px] text-muted-foreground/50">
          {scene.isActive ? "activa" : "inactiva"}
        </span>

        {/* Premium */}
        <button
          type="button"
          onClick={onTogglePremium}
          className={`p-1.5 rounded-md transition-colors mt-1 ${
            scene.isPremium
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/40 hover:bg-secondary"
          }`}
          title={scene.isPremium ? "Quitar premium" : "Marcar premium"}
        >
          {scene.isPremium ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <span className="text-[9px] text-muted-foreground/50">
          {scene.isPremium ? "premium" : "free"}
        </span>

        {/* Eliminar */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-md transition-colors text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 mt-1"
              title="Eliminar escena"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar escena?</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-medium text-foreground">{scene.name}</span>{" "}
                se eliminará permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function EscenasPage() {
  const { getToken } = useAuth();
  const [scenes, setScenes] = useState<SceneAnimation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchScenes(token);
      setScenes(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      toast.error("No se pudieron cargar las escenas");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePatch(id: number, patch: Partial<SceneAnimation>) {
    try {
      const token = await getToken();
      const updated = await patchScene(id, patch, token);
      setScenes((prev) =>
        prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.sortOrder - b.sortOrder),
      );
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    }
  }

  async function handleDelete(id: number) {
    try {
      const token = await getToken();
      await deleteScene(id, token);
      setScenes((prev) => prev.filter((s) => s.id !== id));
      toast.success("Escena eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function moveScene(index: number, dir: -1 | 1) {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= scenes.length) return;
    const next = [...scenes];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const reordered = next.map((s, i) => ({ ...s, sortOrder: i }));
    setScenes(reordered);
    const moved = reordered[newIndex];
    void handlePatch(moved.id, { sortOrder: moved.sortOrder });
    const displaced = reordered[index];
    void handlePatch(displaced.id, { sortOrder: displaced.sortOrder });
  }

  const sorted = [...scenes].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = scenes.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Escenas animadas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Composiciones Geometrix curadas que se muestran como fondo animado en la app.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {activeCount} activa{activeCount !== 1 ? "s" : ""} / {scenes.length} total
            </span>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Recargar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-7 h-7 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : scenes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Plus className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay escenas todavía.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Los usuarios admin pueden subir composiciones desde la app usando
              "Subir como Escena" en Mis Creaciones de Geometrix.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {scenes.length} escena{scenes.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.map((scene, i) => (
              <SceneRow
                key={scene.id}
                scene={scene}
                index={i}
                total={sorted.length}
                onMoveUp={() => moveScene(i, -1)}
                onMoveDown={() => moveScene(i, 1)}
                onToggleActive={() => handlePatch(scene.id, { isActive: !scene.isActive })}
                onTogglePremium={() => handlePatch(scene.id, { isPremium: !scene.isPremium })}
                onSaveName={(name) => handlePatch(scene.id, { name })}
                onSaveDescription={(description) =>
                  handlePatch(scene.id, { description: description || null })
                }
                onDelete={() => handleDelete(scene.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
