import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { Plus, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  fixed?: boolean;
}

export function TagOptionSelector({
  tagType,
  defaults,
  label,
  selected,
  onToggle,
  pill = false,
  fixed = false,
}: TagOptionSelectorProps) {
  const { getToken } = useAuth();
  const [dbTags, setDbTags] = useState<TagOption[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Map<string, number>>(new Map());
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const hiddenType = `${tagType}_hidden`;

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const [resCustom, resHidden] = await Promise.all([
        fetch(`/api/admin/tag-options?type=${encodeURIComponent(tagType)}`, {
          credentials: "include",
          headers: authHeaders(token),
        }),
        fetch(`/api/admin/tag-options?type=${encodeURIComponent(hiddenType)}`, {
          credentials: "include",
          headers: authHeaders(token),
        }),
      ]);
      if (resCustom.ok) setDbTags(await resCustom.json());
      if (resHidden.ok) {
        const hidden: TagOption[] = await resHidden.json();
        setHiddenIds(new Map(hidden.map((h) => [h.label.toLowerCase(), h.id])));
      }
    } catch {
      // silently ignore
    }
  }, [tagType, hiddenType, getToken]);

  useEffect(() => {
    if (!fixed) load();
  }, [fixed, load]);

  // ── Agregar tag custom nueva ──────────────────────────────────────────────
  const handleAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/tag-options", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ type: tagType, label: trimmed }),
      });
      if (!res.ok) throw new Error("Error al crear");
      const created: TagOption = await res.json();
      setDbTags((p) => [...p, created]);
      setNewLabel("");
      setAdding(false);
      if (!selected.includes(trimmed)) onToggle(trimmed);
      toast.success(`"${trimmed}" agregada y seleccionada`);
    } catch {
      toast.error("No se pudo agregar la etiqueta");
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar tag custom (DB) ──────────────────────────────────────────────
  const handleDeleteCustom = async (opt: TagOption) => {
    setDeleting(`custom-${opt.id}`);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/tag-options/${opt.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error();
      setDbTags((p) => p.filter((t) => t.id !== opt.id));
      toast.success(`"${opt.label}" eliminada`);
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setDeleting(null);
    }
  };

  // ── Ocultar default (guarda en catalog_tag_options con tipo _hidden) ───────
  const handleHideDefault = async (tag: string) => {
    const key = tag.toLowerCase();
    if (hiddenIds.has(key)) return;
    setDeleting(`default-${key}`);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/tag-options", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ type: hiddenType, label: tag }),
      });
      if (!res.ok) throw new Error();
      const created: TagOption = await res.json();
      setHiddenIds((prev) => new Map(prev).set(key, created.id));
      toast.success(`"${tag}" eliminada`);
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setDeleting(null);
    }
  };

  // ── Derivados ─────────────────────────────────────────────────────────────
  const visibleDefaults = fixed
    ? defaults
    : defaults.filter((d) => !hiddenIds.has(d.toLowerCase()));
  const customOnly = fixed ? [] : dbTags.filter(
    (d) => !defaults.some((def) => def.toLowerCase() === d.label.toLowerCase()),
  );

  const btnClass = (tag: string) =>
    `${pill ? "px-3 py-1 rounded-full text-xs" : "px-3 py-1.5 rounded-lg text-sm"} font-medium border transition-colors ${
      selected.includes(tag)
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:border-foreground"
    }`;

  const deleteBtn = (key: string, busy: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
    >
      {busy ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />}
    </button>
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2 items-center">

        {/* ── Defaults visibles (con X para ocultar) ── */}
        {visibleDefaults.map((tag) => {
          const key = `default-${tag.toLowerCase()}`;
          const busy = deleting === key;
          return (
            <div key={tag} className="relative flex items-center group">
              <button type="button" onClick={() => onToggle(tag)} className={btnClass(tag)}>
                {tag}
              </button>
              {!fixed && deleteBtn(key, busy, () => handleHideDefault(tag))}
            </div>
          );
        })}

        {/* ── Tags custom (con X para eliminar de DB) ── */}
        {customOnly.map((opt) => {
          const key = `custom-${opt.id}`;
          const busy = deleting === key;
          return (
            <div key={opt.id} className="relative flex items-center group">
              <button type="button" onClick={() => onToggle(opt.label)} className={btnClass(opt.label)}>
                {opt.label}
              </button>
              {deleteBtn(key, busy, () => handleDeleteCustom(opt))}
            </div>
          );
        })}

        {/* ── Agregar nueva ── */}
        {!fixed && (adding ? (
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
        ))}
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
