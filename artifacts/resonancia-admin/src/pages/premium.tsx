import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminPremiumContent,
  useUpdateAdminPremiumContent,
  useRequestUploadUrl,
  getGetAdminPremiumContentQueryKey,
} from "@workspace/api-client-react";
import type { PremiumEditorialContent } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Crown,
  ImageIcon,
  Loader2,
  Moon,
  Music2,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
  UserRound,
  CheckCircle2,
} from "lucide-react";
import { uploadFile } from "@/lib/uploadFile";
import { errorStatus } from "@/lib/streak-info-form";
import img1 from "../../../mobile/assets/images/sessions/ambiental-123-cascada.jpg";
import img2 from "../../../mobile/assets/images/sessions/ambiental-123-lago.jpg";
import img3 from "../../../mobile/assets/images/sessions/ambiental-espacio-profundo.jpg";
import img4 from "../../../mobile/assets/images/sessions/ambiental-rrrr-binaural.jpg";
import img5 from "../../../mobile/assets/images/sessions/ambiental-test-01-lluvia-suave.jpg";
import img6 from "../../../mobile/assets/images/sessions/ambiental-test-02-bosque-amanecer.jpg";
import img7 from "../../../mobile/assets/images/sessions/ambiental-test-03-oceano-calma.jpg";
import img8 from "../../../mobile/assets/images/sessions/ambiental-test-04-viento-bambues.jpg";
import img9 from "../../../mobile/assets/images/sessions/ambiental-test-05-fuego-hogar.jpg";
import img10 from "../../../mobile/assets/images/sessions/ambiental-test-06-noche-estrellas.jpg";

const BUILTIN = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];
const MAX_IMAGES = 30;
const LIMITS = { title: 150, description: 2000 };

type Surface = keyof PremiumEditorialContent;

const SURFACES: { key: Surface; label: string; hint: string; icon: typeof Sun; carousel: boolean }[] = [
  { key: "sounds", label: "Sonidos", hint: "Invitación en la pantalla de Sonidos.", icon: Music2, carousel: false },
  { key: "sleep", label: "Dormir", hint: "Invitación en Dormir, con carrusel de imágenes.", icon: Moon, carousel: true },
  { key: "home", label: "Inicio", hint: "Invitación en Inicio, con carrusel de imágenes.", icon: Sun, carousel: true },
  { key: "profile", label: "Perfil", hint: "Invitación en la pantalla de Perfil.", icon: UserRound, carousel: false },
];

function previewUrl(image: string): string | null {
  const m = /^builtin:(\d+)$/.exec(image);
  if (m) return BUILTIN[Number(m[1])] ?? null;
  if (image.startsWith("/objects/")) return image.replace(/^\/objects\//, "/api/storage/objects/");
  return null;
}

const same = (a: PremiumEditorialContent, b: PremiumEditorialContent) => JSON.stringify(a) === JSON.stringify(b);
const clone = (c: PremiumEditorialContent): PremiumEditorialContent => JSON.parse(JSON.stringify(c));

function validate(c: PremiumEditorialContent) {
  const errs: Partial<Record<string, string>> = {};
  for (const s of SURFACES) {
    const v = c[s.key];
    if (!v.title.trim()) errs[`${s.key}.title`] = "El título es obligatorio";
    else if (v.title.trim().length > LIMITS.title) errs[`${s.key}.title`] = `Máximo ${LIMITS.title} caracteres`;
    if (v.description.trim().length > LIMITS.description) errs[`${s.key}.description`] = `Máximo ${LIMITS.description} caracteres`;
    if (v.images.length > MAX_IMAGES) errs[`${s.key}.images`] = `Máximo ${MAX_IMAGES} imágenes`;
  }
  return errs;
}

function Counter({ value, max }: { value: string; max: number }) {
  const len = value.trim().length;
  return <span className={`text-xs ${len > max ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{len} / {max}</span>;
}

export default function PremiumPage() {
  const queryClient = useQueryClient();
  const queryKey = getGetAdminPremiumContentQueryKey();
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminPremiumContent({ query: { queryKey } });
  const update = useUpdateAdminPremiumContent();
  const requestUploadUrl = useRequestUploadUrl();

  const [draft, setDraft] = useState<PremiumEditorialContent | null>(null);
  const [baseline, setBaseline] = useState<PremiumEditorialContent | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;

  const dirty = !!draft && !!baseline && !same(draft, baseline);

  useEffect(() => {
    if (!data) return;
    const d = draftRef.current;
    const b = baselineRef.current;
    if (!d || !b || same(d, b)) {
      setDraft(clone(data.content));
      setBaseline(clone(data.content));
      setRevision(data.revision);
    }
  }, [data]);

  const reloadFromServer = async () => {
    const res = await refetch();
    if (res.data) {
      setDraft(clone(res.data.content));
      setBaseline(clone(res.data.content));
      setRevision(res.data.revision);
      setConflict(false);
      setSubmitted(false);
      setSaveError(null);
      toast.success("Se cargó la versión más reciente");
    } else toast.error("No se pudo recargar. Intenta de nuevo.");
  };

  const errors = draft ? validate(draft) : {};
  const err = (k: string) => (submitted ? errors[k] : undefined);
  const pending = update.isPending;
  const busy = pending || uploadingSlot !== null;

  const patch = (s: Surface, p: Partial<PremiumEditorialContent[Surface]>) =>
    setDraft((cur) => (cur ? { ...cur, [s]: { ...cur[s], ...p } } : cur));

  const setImages = (s: Surface, fn: (imgs: string[]) => string[]) =>
    setDraft((cur) => (cur ? { ...cur, [s]: { ...cur[s], images: fn([...cur[s].images]) } } : cur));

  async function handleUpload(s: Surface, index: number | null, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida (JPG, PNG, WebP)");
      return;
    }
    setUploadingSlot(`${s}:${index ?? "new"}`);
    try {
      const uploaded = await uploadFile(file, (args) => requestUploadUrl.mutateAsync(args), null);
      setImages(s, (imgs) => {
        if (index === null) return imgs.length >= MAX_IMAGES ? imgs : [...imgs, uploaded.objectPath];
        imgs[index] = uploaded.objectPath;
        return imgs;
      });
      toast.success(index === null ? "Imagen añadida al borrador" : "Imagen reemplazada en el borrador");
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploadingSlot(null);
    }
  }

  const onSave = () => {
    if (!draft || revision === null) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      toast.error("Revisa los campos marcados");
      return;
    }
    const content: PremiumEditorialContent = clone(draft);
    for (const s of SURFACES) {
      content[s.key].title = content[s.key].title.trim();
      content[s.key].description = content[s.key].description.trim();
    }
    setSaveError(null);
    update.mutate(
      { data: { content, revision } },
      {
        onSuccess: (saved) => {
          queryClient.setQueryData(queryKey, saved);
          setDraft(clone(saved.content));
          setBaseline(clone(saved.content));
          setRevision(saved.revision);
          setSubmitted(false);
          setConflict(false);
          setSavedAt(new Date());
          toast.success("Contenido Premium actualizado");
        },
        onError: (error: unknown) => {
          const st = errorStatus(error);
          if (st === 409) {
            setConflict(true);
            toast.error("Alguien más modificó este contenido. Tus cambios no se guardaron.");
          } else {
            const msg = st === 400 ? "El servidor rechazó los datos. Revisa los campos." : "No se pudo guardar. Tu borrador sigue aquí.";
            setSaveError(msg);
            toast.error(msg);
          }
        },
      },
    );
  };

  return (
    <div className="space-y-8 max-w-[900px] mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary" /> Premium
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edita las invitaciones editoriales de Premium en cuatro pantallas de la app. Solo modifica textos e imágenes, no precios ni acceso.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse" data-testid="status-loading">
          {[0, 1, 2].map((i) => <div key={i} className="h-48 bg-muted/50 rounded-lg w-full" />)}
        </div>
      ) : isError || !draft ? (
        <div className="p-4 text-sm text-destructive flex items-start gap-3 bg-destructive/10 rounded-lg border border-destructive/20" data-testid="status-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Ocurrió un error</p>
            <p className="mt-1 opacity-90">No se pudo cargar el contenido Premium.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-retry">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Reintentar
          </Button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          {conflict && (
            <div className="p-4 text-sm flex items-start gap-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20" data-testid="status-conflict">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Conflicto de versiones</p>
                <p className="mt-1 opacity-90">Otra persona guardó cambios mientras editabas. Tu borrador se conserva aquí, pero no puede guardarse sobre la versión nueva. Al recargar se descartarán tus cambios.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={reloadFromServer} disabled={isFetching} data-testid="button-reload-conflict">
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Recargar versión actual
              </Button>
            </div>
          )}

          {SURFACES.map(({ key, label, hint, icon: Icon, carousel }) => {
            const v = draft[key];
            return (
              <Card key={key} className="border-border/50 shadow-sm" data-testid={`card-premium-${key}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-primary" />{label}</CardTitle>
                  <CardDescription>{hint}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-title`}>Título</Label>
                    <Input id={`${key}-title`} value={v.title} disabled={pending} className="bg-card h-11"
                      onChange={(e) => patch(key, { title: e.target.value })} data-testid={`input-${key}-title`} />
                    <div className="flex justify-between items-center">
                      {err(`${key}.title`) ? <p className="text-sm font-medium text-destructive">{err(`${key}.title`)}</p> : <span />}
                      <Counter value={v.title} max={LIMITS.title} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-description`}>Descripción</Label>
                    <Textarea id={`${key}-description`} value={v.description} disabled={pending} rows={4} className="bg-card"
                      onChange={(e) => patch(key, { description: e.target.value })} data-testid={`input-${key}-description`} />
                    <div className="flex justify-between items-center">
                      {err(`${key}.description`) ? <p className="text-sm font-medium text-destructive">{err(`${key}.description`)}</p> : <span />}
                      <Counter value={v.description} max={LIMITS.description} />
                    </div>
                  </div>

                  {carousel && (
                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between gap-3 pt-3">
                        <div>
                          <p className="text-sm font-medium">Carrusel de imágenes</p>
                          <p className="text-xs text-muted-foreground">{v.images.length} / {MAX_IMAGES}. Sin imágenes, el carrusel no se muestra.</p>
                        </div>
                        <label className={`inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground ${busy || v.images.length >= MAX_IMAGES ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                            disabled={busy || v.images.length >= MAX_IMAGES} onChange={(e) => void handleUpload(key, null, e)} data-testid={`upload-${key}`} />
                          {uploadingSlot === `${key}:new` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Subir imagen
                        </label>
                      </div>
                      {err(`${key}.images`) && <p className="text-sm font-medium text-destructive">{err(`${key}.images`)}</p>}
                      {v.images.length === 0 ? (
                        <div className="flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20">
                          <ImageIcon className="mb-2 h-7 w-7 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">Carrusel vacío: no se mostrará en la app.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {v.images.map((img, i) => {
                            const url = previewUrl(img);
                            const slot = `${key}:${i}`;
                            return (
                              <div key={`${img}-${i}`} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 hover:bg-secondary/20 transition-colors">
                                <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                                  {uploadingSlot === slot ? (
                                    <div className="flex h-full items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                  ) : url ? <img src={url} alt={`Imagen ${i + 1}`} className="h-full w-full object-cover" /> : (
                                    <div className="flex h-full items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {img.startsWith("builtin:")
                                    ? <span className="inline-flex rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">App</span>
                                    : <span className="inline-flex rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Subida</span>}
                                </div>
                                <Button type="button" variant="ghost" size="sm" className="h-8 px-2" aria-label="Subir" disabled={busy || i === 0}
                                  onClick={() => setImages(key, (a) => { [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; })}><ArrowUp className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 px-2" aria-label="Bajar" disabled={busy || i === v.images.length - 1}
                                  onClick={() => setImages(key, (a) => { [a[i + 1], a[i]] = [a[i], a[i + 1]]; return a; })}><ArrowDown className="h-4 w-4" /></Button>
                                <label className={`inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
                                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={busy}
                                    onChange={(e) => void handleUpload(key, i, e)} />
                                  Reemplazar
                                </label>
                                <Button type="button" variant="ghost" size="sm" aria-label="Quitar" disabled={busy}
                                  className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setImages(key, (a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {saveError && (
            <div className="p-3 text-sm flex items-center gap-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20" data-testid="status-save-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="flex-1">{saveError}</p>
              <Button type="submit" variant="outline" size="sm" disabled={busy || conflict}>Reintentar</Button>
            </div>
          )}

          <div className="sticky bottom-0 flex items-center justify-end gap-3 py-3 bg-background/80 backdrop-blur rounded-lg">
            {!dirty && savedAt && (
              <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" data-testid="status-saved">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Guardado a las {savedAt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {dirty && <span className="mr-auto text-sm text-muted-foreground">Cambios sin guardar</span>}
            {dirty && (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => baseline && setDraft(clone(baseline))} data-testid="button-discard">
                Descartar cambios
              </Button>
            )}
            <Button type="submit" disabled={busy || !dirty || conflict} className="min-w-[140px]" data-testid="button-save">
              {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
