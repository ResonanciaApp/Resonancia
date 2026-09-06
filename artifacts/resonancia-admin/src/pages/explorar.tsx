import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { GripVertical, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Section {
  id: number;
  slug: string;
  label: string;
  visible: boolean;
  sortOrder: number;
}

export default function ExplorarPage() {
  const { getToken } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Drag state
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/explore-sections", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setSections(data.sections);
    } catch {
      toast.error("No se pudieron cargar las secciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleVisible(id: number) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    );
    setDirty(true);
  }

  function onDragStart(idx: number) {
    dragIdx.current = idx;
  }

  function onDragEnter(idx: number) {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    dragOverIdx.current = idx;
    setSections((prev) => {
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
      const payload = sections.map((s, i) => ({
        id: s.id,
        sortOrder: i,
        visible: s.visible,
      }));
      const res = await fetch("/api/admin/explore-sections", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sections: payload }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const data = await res.json();
      setSections(data.sections);
      setDirty(false);
      toast.success("Orden de Otras temáticas guardado");
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
          <h1 className="text-2xl font-bold">Explorar — Otras temáticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arrastrá para ordenar las cards. Tocá el ojo para mostrarlas u ocultarlas en Descubrir.
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
        {sections.map((section, idx) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border bg-card transition-opacity cursor-grab active:cursor-grabbing select-none ${
              !section.visible ? "opacity-40" : ""
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 font-medium text-sm">{section.label}</span>
            <button
              type="button"
              onClick={() => toggleVisible(section.id)}
              className="p-1.5 rounded hover:bg-secondary transition-colors"
              title={section.visible ? "Ocultar card" : "Mostrar card"}
            >
              {section.visible ? (
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
