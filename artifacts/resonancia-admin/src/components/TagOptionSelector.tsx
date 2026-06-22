import { useState, useEffect, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TagOption {
  id: number;
  type: string;
  label: string;
}

interface TagOptionSelectorProps {
  tagType: string;
  defaults: string[];
  label: string;
  selected: string[];
  onToggle: (tag: string) => void;
  pill?: boolean;
}

export function TagOptionSelector({
  tagType,
  defaults,
  label,
  selected,
  onToggle,
  pill = false,
}: TagOptionSelectorProps) {
  const [dbTags, setDbTags] = useState<TagOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/tag-options?type=${encodeURIComponent(tagType)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: TagOption[] = await res.json();
        setDbTags(data);
      }
    } catch {
      // silently ignore
    }
  }, [tagType]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tag-options", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tagType, label: trimmed }),
      });
      if (!res.ok) throw new Error("Error al crear");
      const created: TagOption = await res.json();
      setDbTags((p) => [...p, created]);
      setNewLabel("");
      setAdding(false);
      toast.success(`"${trimmed}" agregada`);
    } catch {
      toast.error("No se pudo agregar la etiqueta");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (opt: TagOption) => {
    setDeleting(opt.id);
    try {
      const res = await fetch(`/api/admin/tag-options/${opt.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setDbTags((p) => p.filter((t) => t.id !== opt.id));
      toast.success(`"${opt.label}" eliminada`);
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setDeleting(null);
    }
  };

  const allDefaults = defaults;
  const customOnly = dbTags.filter(
    (d) => !allDefaults.some((def) => def.toLowerCase() === d.label.toLowerCase()),
  );

  const btnClass = (tag: string) =>
    `${pill ? "px-3 py-1 rounded-full text-xs" : "px-3 py-1.5 rounded-lg text-sm"} font-medium border transition-colors ${
      selected.includes(tag)
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:border-foreground"
    }`;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2 items-center">
        {allDefaults.map((tag) => (
          <button key={tag} type="button" onClick={() => onToggle(tag)} className={btnClass(tag)}>
            {tag}
          </button>
        ))}
        {customOnly.map((opt) => (
          <div key={opt.id} className="relative flex items-center group">
            <button
              type="button"
              onClick={() => onToggle(opt.label)}
              className={btnClass(opt.label)}
            >
              {opt.label}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(opt)}
              disabled={deleting === opt.id}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deleting === opt.id ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <X className="w-2.5 h-2.5" />
              )}
            </button>
          </div>
        ))}

        {adding ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
                if (e.key === "Escape") { setAdding(false); setNewLabel(""); }
              }}
              placeholder="Nueva etiqueta…"
              className="h-7 px-2 text-xs rounded border border-primary bg-background text-foreground outline-none w-36"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !newLabel.trim()}
              className="h-7 px-2 text-xs rounded border border-primary bg-primary/10 text-primary disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewLabel(""); }}
              className="h-7 px-2 text-xs rounded border border-border text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-7 px-2 text-xs rounded border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Nueva
          </button>
        )}
      </div>
    </div>
  );
}

interface SingleTagOptionSelectorProps {
  tagType: string;
  defaults: string[];
  label: string;
  selected: string;
  onSelect: (tag: string) => void;
}

export function SingleTagOptionSelector({
  tagType,
  defaults,
  label,
  selected,
  onSelect,
}: SingleTagOptionSelectorProps) {
  return (
    <TagOptionSelector
      tagType={tagType}
      defaults={defaults}
      label={label}
      selected={selected ? [selected] : []}
      onToggle={(tag) => onSelect(selected === tag ? "" : tag)}
    />
  );
}
