import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { GripVertical, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SleepItem {
  key: string;
  label: string;
  type: "session" | "playlist";
  visible: boolean;
  sortOrder: number;
}

export default function DormirOrdenPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<SleepItem[]>([]);
  const [revision, setRevision] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/sleep-carousel-order", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setItems(data.carousels || []);
      setRevision(data.revision ?? "");
      setDirty(false);
    } catch {
      toast.error("No se pudieron cargar los elementos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleVisible(key: string) {
    setItems((prev) =>
      prev.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s)),
    );
    setDirty(true);
  }

  function onDragStart(idx: number) {
    dragIdx.current = idx;
  }

  function onDragEnter(idx: number) {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    dragOverIdx.current = idx;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
    setDirty(true);
  }

  function onDragEnd() {
    dragIdx.current = null;
    dragOverIdx.current = null;
  }

  async function save() {
    setSaving(true);
    try {
      const token = await getToken();
      const payload = items.map((s, i) => ({
        key: s.key,
        sortOrder: i,
        visible: s.visible,
      }));
      const res = await fetch("/api/admin/sleep-carousel-order", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ carousels: payload, revision }),
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
      toast.success("Orden de Dormir guardado");
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
          <h1 className="text-2xl font-bold">Dormir — orden</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arrastrá para ordenar los carruseles. Tocá el ojo para mostrarlos u ocultarlos en la pantalla Dormir.
          </p>
        </div>
        <Button onClick={save} disabled={!dirty || saving} size="sm">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="ml-2">Guardar</span>
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.key}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border bg-card transition-opacity cursor-grab active:cursor-grabbing select-none ${
              !item.visible ? "opacity-40" : ""
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium text-sm">{item.label}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                {item.type === "session" ? "Sesiones" : "Playlists"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleVisible(item.key)}
              className="p-1.5 rounded hover:bg-secondary transition-colors"
              title={item.visible ? "Ocultar carrusel" : "Mostrar carrusel"}
            >
              {item.visible ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>

      {dirty && (
        <p className="text-xs text-muted-foreground text-center">
          Cambios sin guardar — presioná "Guardar" para aplicarlos en la app.
        </p>
      )}
    </div>
  );
}
