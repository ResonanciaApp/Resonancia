import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetGrowthCatalog,
  getGetGrowthCatalogQueryKey,
  useSaveGrowthCatalog,
  useRequestUploadUrl,
  type GrowthCatalog,
} from "@workspace/api-client-react";
import { uploadFile } from "@/lib/uploadFile";
import { MAX_WORLDS, addWorld, moveStage, newStage, orderStages, resolveWorlds, validate, type WorldLike } from "@/lib/growth-worlds";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Plus, Trash2, Upload, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Stage = GrowthCatalog["stages"][number];
type Reward = Stage["rewards"][number];
type World = WorldLike;
const DEFAULT_TEXT = "Desbloquea {cantidad} avatares a elección";
const uid = () => crypto.randomUUID();

function imgSrc(url: string) {
  if (!url) return "";
  if (/^https?:\/\//.test(url) || url.startsWith("/api/")) return url;
  return `/api/storage${url}`;
}
function rewardPreview(r: Reward) {
  return (r.text || DEFAULT_TEXT).split("{cantidad}").join(String(r.amount));
}
export default function TuCaminoPage() {
  const qc = useQueryClient();
  const query = useGetGrowthCatalog();
  const save = useSaveGrowthCatalog();
  const requestUploadUrl = useRequestUploadUrl();
  const [draft, setDraft] = useState<Stage[] | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [rangeIds, setRangeIds] = useState<Set<string>>(new Set());
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const data = query.data;
  useEffect(() => {
    if (!data || dirtyRef.current) return;
    setDraft(data.stages);
    setWorlds(resolveWorlds(data as never));
    setRevision(data.revision);
    setRangeIds(new Set(data.stages.filter((s) => s.endDay !== s.startDay).map((s) => s.id)));
  }, [data]);

  const errors = useMemo(() => validate(worlds, draft ?? []), [worlds, draft]);
  const errorCount = Object.keys(errors).length;

  function edit(fn: (s: Stage[]) => Stage[]) {
    setDraft((d) => fn(d ?? []));
    setDirty(true);
    setSaveError(null);
  }
  function markDirty() { dirtyRef.current = true; setDirty(true); setSaveError(null); }
  function patchWorld(id: string, p: Partial<World>) {
    setWorlds((w) => w.map((x) => (x.id === id ? { ...x, ...p } : x)));
    markDirty();
  }
  function createWorld() {
    setWorlds((w) => addWorld(w));
    markDirty();
  }
  function patch(id: string, p: Partial<Stage>) {
    edit((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }
  function addStage(group: string) {
    edit((s) => newStage(s, group, uid(), worlds));
  }
  function move(id: string, dir: -1 | 1) {
    edit((all) => moveStage(all, id, dir));
  }
  function patchReward(sid: string, rid: string, p: Partial<Reward>) {
    edit((all) => all.map((s) => (s.id === sid ? { ...s, rewards: s.rewards.map((r) => (r.id === rid ? { ...r, ...p } : r)) } : s)));
  }
  async function upload(id: string, file?: File, worldId?: string) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen válida"); return; }
    setUploadingId(id);
    try {
      const up = await uploadFile(file, (a) => requestUploadUrl.mutateAsync(a), null);
      if (worldId) patchWorld(worldId, { coverUrl: up.objectPath });
      else patch(id, { imageUrl: up.objectPath });
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploadingId(null);
    }
  }
  async function doSave() {
    setShowErrors(true);
    if (errorCount > 0 || !draft) { toast.error("Corrige los errores antes de guardar"); return; }
    const ordered = orderStages(worlds, draft);
    try {
      const saved = await save.mutateAsync({ data: { revision, worlds, stages: ordered } });
      qc.setQueryData(getGetGrowthCatalogQueryKey(), saved);
      void qc.invalidateQueries({ queryKey: getGetGrowthCatalogQueryKey() });
      dirtyRef.current = false;
      setDirty(false);
      setConflict(false);
      setShowErrors(false);
      setDraft(saved.stages);
      setWorlds(resolveWorlds(saved as never));
      setRevision(saved.revision);
      toast.success("Tu camino guardado");
    } catch (e) {
      const status = (e as { status?: number })?.status;
      if (status === 409) {
        setConflict(true);
        void query.refetch();
      } else {
        setSaveError(
          status === 400 || status === 422
            ? "El servidor rechazó el catálogo: revisa que los rangos de días no se superpongan y estén en orden."
            : "No se pudo guardar. Intenta de nuevo.",
        );
      }
    }
  }
  function reload() {
    const d = query.data;
    if (!d) return;
    dirtyRef.current = false;
    setDirty(false);
    setConflict(false);
    setSaveError(null);
    setShowErrors(false);
    setDraft(d.stages);
    setWorlds(resolveWorlds(d as never));
    setRevision(d.revision);
    setRangeIds(new Set(d.stages.filter((s) => s.endDay !== s.startDay).map((s) => s.id)));
  }

  if (query.isLoading || (!draft && !query.error)) {
    return <div className="mx-auto max-w-4xl space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-card" />)}</div>;
  }
  if (query.error && !draft) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-8 text-center">
        <p className="mb-4 text-sm text-muted-foreground">No se pudo cargar el catálogo.</p>
        <Button onClick={() => void query.refetch()}>Reintentar</Button>
      </div>
    );
  }
  const stages = draft ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-28">
      <div>
        <h1 className="text-2xl font-bold">Tu camino</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Etapas del recorrido personal y recompensas de avatares. Los cambios en cantidades afectan solo las recompensas futuras; no modifican las ya otorgadas ni el progreso de ningún usuario.
        </p>
        {data && <p className="mt-1 text-xs text-muted-foreground">Revisión {revision} · actualizado {new Date(data.updatedAt).toLocaleString("es-CL")}</p>}
      </div>

      {conflict && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="flex-1">Otra persona guardó una versión nueva. Tus cambios siguen aquí sin perderse. Recarga para traer la versión actual (se descartarán tus ediciones).</span>
          <Button size="sm" variant="outline" onClick={reload} data-testid="button-reload-catalog">Recargar versión actual</Button>
        </div>
      )}
      {saveError && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm" data-testid="text-save-error">{saveError}</p>}

      {worlds.map((g, wi) => {
        const list = stages.filter((s) => s.group === g.id);
        const werrs = errors[g.id] ?? [];
        return (
          <section key={g.id} className="space-y-3" data-testid={`world-${g.id}`}>
            <div className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
              <div className="flex gap-4">
                <div className="w-28 shrink-0 space-y-2">
                  <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                    {g.coverUrl ? <img src={imgSrc(g.coverUrl)} alt={g.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
                  </div>
                  <label className="inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-input text-xs hover:bg-secondary">
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploadingId === `world:${g.id}`} data-testid={`input-world-cover-${g.id}`} onChange={(e) => { void upload(`world:${g.id}`, e.target.files?.[0], g.id); e.target.value = ""; }} />
                    {uploadingId === `world:${g.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                    Portada
                  </label>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mundo {wi + 1} de {MAX_WORLDS}</p>
                  <Input value={g.name} maxLength={100} placeholder="Título del mundo" onChange={(e) => patchWorld(g.id, { name: e.target.value })} data-testid={`input-world-name-${g.id}`} />
                  <Textarea value={g.description} maxLength={2000} rows={2} placeholder="Descripción del mundo" onChange={(e) => patchWorld(g.id, { description: e.target.value })} data-testid={`input-world-description-${g.id}`} />
                </div>
              </div>
              {showErrors && werrs.length > 0 && <ul className="list-disc pl-5 text-xs text-destructive" role="alert">{werrs.map((m) => <li key={m}>{m}</li>)}</ul>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{list.length === 0 ? "Sin etapas: este mundo permanece inactivo en la app hasta configurarlas." : `${list.length} etapa(s)`}</p>
                <Button size="sm" variant="outline" onClick={() => addStage(g.id)} data-testid={`button-add-${g.id}`}>
                  <Plus className="mr-1 h-4 w-4" /> Añadir etapa
                </Button>
              </div>
            </div>
            {list.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
                Sin etapas en {g.name.toLowerCase()}.
              </div>
            )}
            {list.map((s, i) => {
              const errs = errors[s.id] ?? [];
              const isRange = rangeIds.has(s.id);
              const total = s.rewards.filter((r) => r.enabled).reduce((a, r) => a + (Number.isInteger(r.amount) ? r.amount : 0), 0);
              return (
                <div key={s.id} data-testid={`card-stage-${s.id}`} className={`rounded-xl border bg-card p-4 ${showErrors && errs.length ? "border-destructive/60" : "border-border"}`}>
                  <div className="flex gap-4">
                    <div className="w-28 shrink-0 space-y-2">
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                        {s.imageUrl ? <img src={imgSrc(s.imageUrl)} alt={s.name} className="h-full w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
                      </div>
                      <label className="inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-input text-xs hover:bg-secondary">
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploadingId === s.id} onChange={(e) => { void upload(s.id, e.target.files?.[0]); e.target.value = ""; }} />
                        {uploadingId === s.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                        {s.imageUrl ? "Cambiar" : "Subir"}
                      </label>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input value={s.name} maxLength={100} placeholder="Nombre de la etapa" onChange={(e) => patch(s.id, { name: e.target.value })} data-testid={`input-name-${s.id}`} />
                        <Button size="sm" variant="ghost" className="h-9 px-2" disabled={i === 0} aria-label="Subir" onClick={() => move(s.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-9 px-2" disabled={i === list.length - 1} aria-label="Bajar" onClick={() => move(s.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-9 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar etapa" onClick={() => setToDelete(s.id)} data-testid={`button-delete-${s.id}`}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Día</span>
                        <Input type="number" min={0} className="w-24" value={Number.isNaN(s.startDay) ? "" : s.startDay}
                          onChange={(e) => { const v = e.target.value === "" ? NaN : Number(e.target.value); patch(s.id, isRange ? { startDay: v } : { startDay: v, endDay: v }); }} data-testid={`input-start-${s.id}`} />
                        {isRange && (<><span className="text-muted-foreground">a</span>
                          <Input type="number" min={0} className="w-24" value={Number.isNaN(s.endDay) ? "" : s.endDay} onChange={(e) => patch(s.id, { endDay: e.target.value === "" ? NaN : Number(e.target.value) })} data-testid={`input-end-${s.id}`} /></>)}
                        <Button type="button" size="sm" variant="outline" onClick={() => {
                          setRangeIds((r) => { const n = new Set(r); if (isRange) n.delete(s.id); else n.add(s.id); return n; });
                          if (isRange) patch(s.id, { endDay: s.startDay });
                        }}>{isRange ? "Día único" : "Rango"}</Button>
                      </div>
                      <Textarea value={s.story} maxLength={2000} rows={2} placeholder="Historia de la etapa" onChange={(e) => patch(s.id, { story: e.target.value })} />
                      <fieldset className="space-y-3 rounded-lg border border-border p-3">
                        <legend className="px-1 text-sm font-medium">Pantalla de detalle</legend>
                        <p className="text-xs text-muted-foreground">El título, los días y la imagen usan los datos de esta etapa.</p>
                        <div className="space-y-1">
                          <label htmlFor={`detail-phrase-${s.id}`} className="text-sm font-medium">Frase del detalle</label>
                          <Textarea id={`detail-phrase-${s.id}`} data-testid={`input-detail-phrase-${s.id}`}
                            value={s.detailPhrase ?? s.story} maxLength={2000} rows={3}
                            onChange={(e) => patch(s.id, { detailPhrase: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`detail-description-${s.id}`} className="text-sm font-medium">Descripción larga del detalle</label>
                          <Textarea id={`detail-description-${s.id}`} data-testid={`input-detail-description-${s.id}`}
                            value={s.detailDescription ?? ""} maxLength={10000} rows={5}
                            onChange={(e) => patch(s.id, { detailDescription: e.target.value })} />
                        </div>
                      </fieldset>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Recompensas <span className="ml-2 rounded-sm bg-primary/10 px-2 py-0.5 text-xs text-primary" data-testid={`text-total-${s.id}`}>Total: {total} avatares</span></p>
                      <Button size="sm" variant="ghost" disabled={s.rewards.length >= 3} onClick={() => patch(s.id, { rewards: [...s.rewards, { id: uid(), enabled: true, text: DEFAULT_TEXT, amount: 5 }] })} data-testid={`button-add-reward-${s.id}`}>
                        <Plus className="mr-1 h-4 w-4" /> Recompensa ({s.rewards.length}/3)
                      </Button>
                    </div>
                    {s.rewards.map((r) => (
                      <div key={r.id} className="space-y-1 rounded-lg bg-secondary/30 p-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={r.enabled} onCheckedChange={(v) => patchReward(s.id, r.id, { enabled: v })} aria-label="Activa" />
                          <Input value={r.text} maxLength={240} className="flex-1" placeholder={DEFAULT_TEXT} onChange={(e) => patchReward(s.id, r.id, { text: e.target.value })} />
                          <Input type="number" min={1} step={1} className="w-20" value={Number.isNaN(r.amount) ? "" : r.amount} onChange={(e) => patchReward(s.id, r.id, { amount: e.target.value === "" ? NaN : Number(e.target.value) })} aria-label="Cantidad" />
                          <Button size="sm" variant="ghost" className="h-9 px-2" aria-label="Quitar recompensa" onClick={() => patch(s.id, { rewards: s.rewards.filter((x) => x.id !== r.id) })}><X className="h-4 w-4" /></Button>
                        </div>
                        <p className={`pl-12 text-xs ${r.enabled ? "text-muted-foreground" : "text-muted-foreground/50 line-through"}`}>{rewardPreview(r)}</p>
                      </div>
                    ))}
                  </div>
                  {showErrors && errs.length > 0 && (
                    <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-destructive" role="alert">{errs.map((m) => <li key={m}>{m}</li>)}</ul>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">{worlds.length} de {MAX_WORLDS} mundos</p>
        <Button size="sm" variant="outline" disabled={worlds.length >= MAX_WORLDS} onClick={createWorld} data-testid="button-add-world">
          <Plus className="mr-1 h-4 w-4" /> Añadir mundo
        </Button>
      </div>

      <div className="sticky bottom-0 -mx-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {dirty ? (showErrors && errorCount ? `${errorCount} etapa(s) con errores.` : "Cambios sin guardar.") : "Todo guardado."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!dirty || save.isPending} onClick={reload} data-testid="button-discard">Descartar</Button>
          <Button size="sm" disabled={!dirty || save.isPending || conflict} onClick={() => void doSave()} data-testid="button-save-catalog">
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
          </Button>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta etapa?</AlertDialogTitle>
            <AlertDialogDescription>Se quitará del borrador y se aplicará al guardar. Las recompensas ya otorgadas no se modifican.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const id = toDelete; setToDelete(null); if (id) edit((s) => s.filter((x) => x.id !== id)); }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
