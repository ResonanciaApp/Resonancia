import { useEffect, useState } from "react";
import { useGetAdminDrawerScenes, useUpdateAdminDrawerScenes, useRequestUploadUrl, type DrawerScene } from "@workspace/api-client-react";
import { uploadFile } from "@/lib/uploadFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const preview = (path: string) => path.replace(/^\/objects\//, "/api/storage/objects/");
export default function EscenaPage() {
  const query = useGetAdminDrawerScenes();
  const update = useUpdateAdminDrawerScenes();
  const upload = useRequestUploadUrl();
  const [scenes, setScenes] = useState<DrawerScene[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { if (query.data && !dirty) setScenes(query.data.scenes); }, [query.data, dirty]);
  const busy = uploading || update.isPending;
  function change(id: string, patch: Partial<DrawerScene>) {
    setScenes(current => current?.map(scene => scene.id === id ? { ...scene, ...patch } : scene) ?? null);
    setDirty(true);
  }
  async function selectIcon(id: string, file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Usa PNG, JPG o WebP de hasta 5 MB"); return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file, args => upload.mutateAsync(args), null);
      change(id, { iconPath: result.objectPath });
    } catch { toast.error("No se pudo subir el icono"); }
    finally { setUploading(false); }
  }
  async function save() {
    if (!scenes) return;
    try {
      await update.mutateAsync({ data: { scenes } });
      await query.refetch();
      setDirty(false);
      toast.success("Escenas guardadas");
    } catch { toast.error("No se pudieron guardar. Tus cambios siguen aquí para reintentar."); }
  }
  return <div className="mx-auto max-w-3xl space-y-6 pb-12">
    <header><h1 className="text-2xl font-bold">Escena</h1>
      <p className="mt-2 text-sm text-muted-foreground">Edita los títulos e iconos del menú drawer. Los temas y su orden no cambian. Para iconos sin fondo, usa PNG transparente.</p></header>
    {query.isError && <div role="alert">No se pudieron cargar las escenas. <Button onClick={() => query.refetch()}>Reintentar</Button></div>}
    {!scenes && !query.isError && <p>Cargando escenas…</p>}
    {scenes?.map(scene => <section key={scene.id} className="rounded-xl border bg-card p-5 space-y-3">
      <label htmlFor={`scene-${scene.id}`} className="text-sm text-muted-foreground">Título · {scene.id}</label>
      <Input id={`scene-${scene.id}`} maxLength={40} value={scene.title} disabled={busy} onChange={event => change(scene.id, { title: event.target.value })} />
      <div className="flex flex-wrap items-center gap-4">
        {scene.iconPath ? <img src={preview(scene.iconPath)} alt={`Icono de ${scene.title}`} className="h-14 w-14 object-contain" /> : <span className="text-sm text-muted-foreground">Icono original de la app</span>}
        <label className="text-sm">Subir icono
          <input aria-label={`Subir icono de ${scene.title}`} className="mt-2 block text-sm" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy}
            onChange={event => { void selectIcon(scene.id, event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        {scene.iconPath && <Button variant="outline" disabled={busy} onClick={() => change(scene.id, { iconPath: null })}>Restaurar icono original</Button>}
      </div>
    </section>)}
    <Button disabled={!dirty || busy || !scenes || scenes.some(scene => !scene.title.trim())} onClick={save}>{busy ? "Procesando…" : "Guardar cambios"}</Button>
  </div>;
}
