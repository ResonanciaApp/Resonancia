import { useState } from "react";
import {
  useCreateProfileAvatarCategory,
  useUpdateProfileAvatarCategory,
  useDeleteProfileAvatarCategory,
  type ProfileAvatarCategory,
} from "@workspace/api-client-react";
import { Check, Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryCounts, errorMessage, validateCategoryName } from "@/lib/profile-avatar-categories";

type Props = {
  categories: ProfileAvatarCategory[];
  presets: { id: string; categoryIds?: string[] }[];
  selectedCount: number;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onChanged: () => Promise<unknown>;
  onBulk: (categoryId: string, add: boolean) => void;
};

export function ProfileAvatarCategoryManager({ categories, presets, selectedCount, disabled, onBusyChange, onChanged, onBulk }: Props) {
  const createCategory = useCreateProfileAvatarCategory();
  const updateCategory = useUpdateProfileAvatarCategory();
  const deleteCategory = useDeleteProfileAvatarCategory();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [bulkId, setBulkId] = useState("");
  const [busy, setBusy] = useState(false);
  const counts = categoryCounts(presets);
  const locked = disabled || busy;

  async function run(action: () => Promise<unknown>, success: string, failure: string) {
    if (locked) return false;
    setBusy(true);
    onBusyChange(true);
    try {
      await action();
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, failure));
      return false;
    } finally {
      try { await onChanged(); } catch { toast.error("No se pudo actualizar el catálogo"); }
      setBusy(false);
      onBusyChange(false);
    }
  }

  async function create() {
    const error = validateCategoryName(name, categories);
    setNameError(error);
    if (error) return;
    const ok = await run(() => createCategory.mutateAsync({ data: { name: name.trim() } }), "Categoría creada", "No se pudo crear la categoría");
    if (ok) setName("");
  }

  async function rename(category: ProfileAvatarCategory) {
    const error = validateCategoryName(editName, categories, category.id);
    setEditError(error);
    if (error) return;
    const ok = await run(() => updateCategory.mutateAsync({ id: category.id, data: { name: editName.trim() } }), "Categoría renombrada", "No se pudo renombrar la categoría");
    if (ok) setEditingId(null);
  }

  async function remove(category: ProfileAvatarCategory) {
    const count = counts.get(category.id) ?? 0;
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"? Se quitará de ${count} avatar${count === 1 ? "" : "es"}; los avatares y sus otras categorías se conservan.`)) return;
    const ok = await run(() => deleteCategory.mutateAsync({ id: category.id }), "Categoría eliminada", "No se pudo eliminar la categoría");
    if (ok && bulkId === category.id) setBulkId("");
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-secondary/20 p-4" data-testid="panel-avatar-categories">
      <div className="mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Categorías</h3>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Guardando" />}
      </div>

      <form className="flex items-start gap-2" onSubmit={event => { event.preventDefault(); void create(); }}>
        <div className="flex-1">
          <Input
            value={name}
            maxLength={80}
            placeholder="Nueva categoría"
            aria-label="Nombre de la nueva categoría"
            data-testid="input-new-avatar-category"
            disabled={locked}
            onChange={event => { setName(event.target.value); setNameError(null); }}
          />
          {nameError && <p role="alert" className="mt-1 text-xs text-destructive-foreground/90">{nameError}</p>}
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={locked} data-testid="button-create-avatar-category">
          <Plus className="mr-1 h-4 w-4" /> Crear
        </Button>
      </form>

      {categories.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Aún no hay categorías. Los avatares sin categoría aparecen en “Sin categoría”.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map(category => (
            <li key={category.id} className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-sm" data-testid={`row-avatar-category-${category.id}`}>
              {editingId === category.id ? (
                <form className="flex items-center gap-1" onSubmit={event => { event.preventDefault(); void rename(category); }}>
                  <Input
                    autoFocus
                    value={editName}
                    maxLength={80}
                    aria-label={`Nuevo nombre para ${category.name}`}
                    className="h-7 w-40"
                    disabled={locked}
                    onChange={event => { setEditName(event.target.value); setEditError(null); }}
                  />
                  <Button type="submit" variant="ghost" size="sm" className="h-7 px-1.5" disabled={locked} aria-label="Guardar nombre"><Check className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5" disabled={busy} aria-label="Cancelar" onClick={() => { setEditingId(null); setEditError(null); }}><X className="h-4 w-4" /></Button>
                  {editError && <span role="alert" className="text-xs text-destructive-foreground/90">{editError}</span>}
                </form>
              ) : (
                <>
                  <span>{category.name}</span>
                  <span className="text-xs text-muted-foreground">{counts.get(category.id) ?? 0}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5" disabled={locked} aria-label={`Renombrar ${category.name}`} onClick={() => { setEditingId(category.id); setEditName(category.name); setEditError(null); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={locked} aria-label={`Eliminar ${category.name}`} onClick={() => void remove(category)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">{selectedCount} seleccionado{selectedCount === 1 ? "" : "s"}:</span>
          <select
            value={bulkId}
            aria-label="Categoría para selección"
            data-testid="select-bulk-avatar-category"
            disabled={locked || selectedCount === 0}
            onChange={event => setBulkId(event.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Elegir categoría</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" disabled={locked || selectedCount === 0 || !bulkId} onClick={() => onBulk(bulkId, true)} data-testid="button-bulk-add-category">Agregar</Button>
          <Button type="button" size="sm" variant="outline" disabled={locked || selectedCount === 0 || !bulkId} onClick={() => onBulk(bulkId, false)} data-testid="button-bulk-remove-category">Quitar</Button>
        </div>
      )}
    </div>
  );
}
