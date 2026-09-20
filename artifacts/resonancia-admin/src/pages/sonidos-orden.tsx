import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { Eye, EyeOff, GripVertical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SoundItem {
  key: string;
  label: string;
  visible: boolean;
  sortOrder: number;
}

export default function SonidosOrdenPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<SoundItem[]>([]);
  const [revision, setRevision] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dragIdx = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sound-carousel-order", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setItems(data.carousels || []);
      setRevision(data.revision ?? "");
      setDirty(false);
    } catch {
      toast.error("No se pudieron cargar los carruseles de Sonidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleVisible(key: string) {
    setItems((prev) => prev.map((item) =>
      item.key === key ? { ...item, visible: !item.visible } : item,
    ));
    setDirty(true);
  }

  function onDragEnter(idx: number) {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sound-carousel-order", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          revision,
          carousels: items.map((item) => ({ key: item.key, visible: item.visible })),
        }),
      });
      if (res.status === 409) {
        toast.error("La lista fue modificada por otro usuario. Recargando estado actual...");
        await load();
        return;
      }
      if (!res.ok) throw new Error("Error al guardar");
      const data = await res.json();
      setItems(data.carousels || items);
      setRevision(data.revision ?? revision);
      setDirty(false);
      toast.success("Orden de Sonidos guardado");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sonidos — orden</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arrastrá para ordenar los carruseles. Tocá el ojo para mostrarlos u ocultarlos en la portada de Sonidos.
          </p>
        </div>
        <Button onClick={save} disabled={!dirty || saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="ml-2">Guardar</span>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card px-5 py-10 text-center">
          <p className="text-sm font-medium">No hay carruseles de Sonidos disponibles</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aparecerán cuando existan sesiones publicadas asociadas a una colección.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.key}
              draggable
              onDragStart={() => { dragIdx.current = idx; }}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={() => { dragIdx.current = null; }}
              onDragOver={(event) => event.preventDefault()}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border bg-card transition-opacity cursor-grab active:cursor-grabbing select-none ${
                !item.visible ? "opacity-40" : ""
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-medium text-sm">{item.label}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                  Colección
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleVisible(item.key)}
                className="p-1.5 rounded hover:bg-secondary transition-colors"
                title={item.visible ? "Ocultar carrusel" : "Mostrar carrusel"}
              >
                {item.visible
                  ? <Eye className="w-4 h-4 text-primary" />
                  : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {dirty && (
        <p className="text-xs text-muted-foreground text-center">
          Cambios sin guardar — presioná "Guardar" para aplicarlos en la app.
        </p>
      )}
    </div>
  );
}