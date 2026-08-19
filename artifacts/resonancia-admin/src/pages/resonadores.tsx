import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Database,
  BadgeCheck,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ApiResonador {
  id: string;
  name: string;
  subtipo: string;
  bio: string;
  city: string;
  country: string;
  specialty: string[];
  genres: string[];
  memberSince: string | null;
  followersCount: number | null;
  followingCount: number | null;
  certified: boolean;
  servicesDescription: string | null;
  bookingUrl: string | null;
  bookingTagline: string | null;
  bookingPrice: string | null;
  bookingModality: string | null;
  email: string | null;
  instagram: string | null;
  linktree: string | null;
  donationUrl: string | null;
  quote: string | null;
  photoUrl: string | null;
  coverPhotoUrl: string | null;
  photos: string[];
  status: string;
  sortOrder: number;
}

const SUBTIPO_OPTIONS = ["Voz guía", "Músico", "Sonoterapeuta", "Productor"] as const;
const MODALITY_OPTIONS = [
  { value: "", label: "Sin booking" },
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
  { value: "ambas", label: "Online y presencial" },
];

const EMPTY_FORM: Partial<ApiResonador> & { id: string } = {
  id: "",
  name: "",
  subtipo: "Sonoterapeuta",
  bio: "",
  city: "",
  country: "",
  specialty: [],
  genres: [],
  certified: false,
  status: "published",
  sortOrder: 0,
  bookingModality: "",
  photoUrl: null,
  coverPhotoUrl: null,
  photos: [],
};

function resolveImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/objects/")) return `/api/storage${raw}`;
  return raw;
}

async function fetchResonadores(): Promise<ApiResonador[]> {
  const res = await fetch("/api/admin/resonadores", { credentials: "include" });
  if (!res.ok) throw new Error("Error al cargar resonadores");
  const data = (await res.json()) as { resonadores: ApiResonador[] };
  return data.resonadores;
}

async function createResonador(body: Partial<ApiResonador>): Promise<ApiResonador> {
  const res = await fetch("/api/admin/resonadores", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Error al crear");
  }
  return res.json() as Promise<ApiResonador>;
}

async function updateResonador(
  id: string,
  body: Partial<ApiResonador>,
): Promise<ApiResonador> {
  const res = await fetch(`/api/admin/resonadores/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Error al actualizar");
  }
  return res.json() as Promise<ApiResonador>;
}

async function deleteResonador(id: string): Promise<void> {
  const res = await fetch(`/api/admin/resonadores/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar");
}

async function seedResonadores(): Promise<{ seeded: number }> {
  const res = await fetch("/api/admin/resonadores/seed", {
    method: "POST",
    credentials: "include",
  });
  const data = (await res.json()) as { seeded?: number; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Error al hacer seed");
  return { seeded: data.seeded ?? 0 };
}

function csvToArray(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// ── Image upload widget ───────────────────────────────────────────────────────

interface ImageUploadCellProps {
  currentUrl: string | null;
  pendingFile: File | null;
  onFilePicked: (file: File | null) => void;
  label: string;
  aspectClass?: string;
}

function ImageUploadCell({
  currentUrl,
  pendingFile,
  onFilePicked,
  label,
  aspectClass = "aspect-square",
}: ImageUploadCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = pendingFile
    ? URL.createObjectURL(pendingFile)
    : resolveImageUrl(currentUrl);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div
        className={`relative border rounded-lg overflow-hidden bg-muted cursor-pointer group ${aspectClass}`}
        onClick={() => inputRef.current?.click()}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Sin foto</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Upload className="w-5 h-5 text-white" />
        </div>
        {(pendingFile || currentUrl) && (
          <button
            type="button"
            className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              onFilePicked(null);
            }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onFilePicked(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Photos gallery widget ─────────────────────────────────────────────────────

interface PhotosGalleryProps {
  existingUrls: string[];
  pendingFiles: File[];
  onAddFile: (file: File) => void;
  onRemoveExisting: (index: number) => void;
  onRemovePending: (index: number) => void;
}

function PhotosGallery({
  existingUrls,
  pendingFiles,
  onAddFile,
  onRemoveExisting,
  onRemovePending,
}: PhotosGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = existingUrls.length + pendingFiles.length;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Galería (hasta 6 fotos)</Label>
      <div className="flex flex-wrap gap-2">
        {existingUrls.map((url, i) => {
          const resolved = resolveImageUrl(url);
          return (
            <div key={`ex-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted group">
              {resolved && (
                <img src={resolved} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveExisting(i)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {pendingFiles.map((file, i) => (
          <div key={`pend-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-blue-400 bg-muted group">
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-blue-500/80 text-white text-center text-[9px] py-0.5">Nueva</div>
            <button
              type="button"
              className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemovePending(i)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {total < 6 && (
          <button
            type="button"
            className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-muted-foreground transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px]">Agregar</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResonadoresPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiResonador | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [uploading, setUploading] = useState(false);

  // Pending files for images (not yet uploaded)
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  // existingPhotos: current photo URLs in DB; pendingGallery: newly selected files
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [pendingGallery, setPendingGallery] = useState<File[]>([]);

  const { mutateAsync: requestUrl } = useRequestUploadUrl();

  const { data: resonadores = [], isLoading } = useQuery({
    queryKey: ["admin-resonadores"],
    queryFn: fetchResonadores,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-resonadores"] });

  const createMut = useMutation({
    mutationFn: createResonador,
    onSuccess: () => { toast.success("Resonador creado"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ApiResonador> }) =>
      updateResonador(id, body),
    onSuccess: () => { toast.success("Resonador actualizado"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteResonador,
    onSuccess: () => { toast.success("Resonador eliminado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedMut = useMutation({
    mutationFn: seedResonadores,
    onSuccess: (d) => { toast.success(`${d.seeded} resonadores insertados`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Upload helper ──────────────────────────────────────────────────────────

  async function uploadFile(file: File): Promise<string> {
    const { uploadURL, objectPath } = await requestUrl({
      data: { name: file.name, size: file.size, contentType: file.type },
    });
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
      xhr.onerror = () => reject(new Error("Error de red"));
      xhr.send(file);
    });
    return objectPath;
  }

  // ── Dialog open helpers ────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPendingPhoto(null);
    setPendingCover(null);
    setExistingPhotos([]);
    setPendingGallery([]);
    setOpen(true);
  }

  function openEdit(r: ApiResonador) {
    setEditing(r);
    setForm({ ...r, specialty: r.specialty, genres: r.genres });
    setPendingPhoto(null);
    setPendingCover(null);
    setExistingPhotos(r.photos ?? []);
    setPendingGallery([]);
    setOpen(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setUploading(true);
    try {
      // Upload new photos if any
      let photoUrl = form.photoUrl ?? null;
      let coverPhotoUrl = form.coverPhotoUrl ?? null;

      if (pendingPhoto) {
        photoUrl = await uploadFile(pendingPhoto);
      } else if (pendingPhoto === null && form.photoUrl === null) {
        // User explicitly removed the photo
        photoUrl = null;
      }

      if (pendingCover) {
        coverPhotoUrl = await uploadFile(pendingCover);
      } else if (pendingCover === null && form.coverPhotoUrl === null) {
        coverPhotoUrl = null;
      }

      // Upload new gallery photos
      const newGalleryPaths = await Promise.all(
        pendingGallery.map((f) => uploadFile(f)),
      );
      const photos = [...existingPhotos, ...newGalleryPaths];

      const payload = {
        ...form,
        photoUrl,
        coverPhotoUrl,
        photos,
        specialty: Array.isArray(form.specialty)
          ? form.specialty
          : csvToArray(String(form.specialty ?? "")),
        genres: Array.isArray(form.genres)
          ? form.genres
          : csvToArray(String(form.genres ?? "")),
        bookingModality: form.bookingModality || null,
        sortOrder: Number(form.sortOrder ?? 0),
      };

      if (editing) {
        const { id: _id, ...rest } = payload;
        updateMut.mutate({ id: editing.id, body: rest });
      } else {
        createMut.mutate(payload);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  }

  function toggleStatus(r: ApiResonador) {
    const newStatus = r.status === "published" ? "draft" : "published";
    updateMut.mutate(
      { id: r.id, body: { status: newStatus } },
      { onSuccess: () => toast.success(`${r.name} → ${newStatus}`) },
    );
  }

  const set = (k: keyof typeof EMPTY_FORM, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const isBusy = uploading || createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resonadores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {resonadores.length} resonadores en la BD
          </p>
        </div>
        <div className="flex gap-2">
          {resonadores.length === 0 && (
            <Button
              variant="outline"
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
            >
              <Database className="w-4 h-4 mr-2" />
              Seed inicial (9)
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo resonador
          </Button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : resonadores.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Database className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay resonadores en la BD.</p>
          <p className="text-xs mt-1">Usa "Seed inicial" para cargar el catálogo base.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {resonadores.map((r) => (
            <div key={r.id} className="flex items-center gap-4 p-4">
              {/* Avatar */}
              <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted border">
                {resolveImageUrl(r.photoUrl) ? (
                  <img
                    src={resolveImageUrl(r.photoUrl)!}
                    alt={r.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="shrink-0">
                {r.status === "published" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.name}</span>
                  <Badge variant="outline" className="text-xs">{r.subtipo}</Badge>
                  {r.certified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {r.city}, {r.country}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.id}</p>
              </div>

              {/* Booking */}
              {r.bookingModality && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {r.bookingModality}
                </Badge>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={r.status === "published"}
                  onCheckedChange={() => toggleStatus(r)}
                  title={r.status === "published" ? "Publicado" : "Borrador"}
                />
                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`¿Eliminar a ${r.name}?`)) {
                      deleteMut.mutate(r.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar — ${editing.name}` : "Nuevo resonador"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* ID (solo en creación) */}
            {!editing && (
              <div className="grid gap-1.5">
                <Label>ID (slug único)</Label>
                <Input
                  placeholder="ej: luna-cosmica"
                  value={form.id}
                  onChange={(e) => set("id", e.target.value)}
                />
              </div>
            )}

            {/* ── Fotos ── */}
            <div className="border rounded-md p-3 space-y-3">
              <p className="text-sm font-medium">Fotos</p>
              <div className="grid grid-cols-2 gap-3">
                <ImageUploadCell
                  label="Foto de perfil"
                  currentUrl={pendingPhoto ? null : form.photoUrl ?? null}
                  pendingFile={pendingPhoto}
                  onFilePicked={(f) => {
                    setPendingPhoto(f);
                    if (f === null) set("photoUrl", null);
                  }}
                />
                <ImageUploadCell
                  label="Foto de portada (hero)"
                  currentUrl={pendingCover ? null : form.coverPhotoUrl ?? null}
                  pendingFile={pendingCover}
                  onFilePicked={(f) => {
                    setPendingCover(f);
                    if (f === null) set("coverPhotoUrl", null);
                  }}
                  aspectClass="aspect-video"
                />
              </div>
              <PhotosGallery
                existingUrls={existingPhotos}
                pendingFiles={pendingGallery}
                onAddFile={(f) => setPendingGallery((prev) => [...prev, f])}
                onRemoveExisting={(i) => setExistingPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                onRemovePending={(i) => setPendingGallery((prev) => prev.filter((_, idx) => idx !== i))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Nombre</Label>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Subtipo</Label>
                <Select
                  value={form.subtipo ?? "Sonoterapeuta"}
                  onValueChange={(v) => set("subtipo", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBTIPO_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Ciudad</Label>
                <Input
                  value={form.city ?? ""}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>País</Label>
                <Input
                  value={form.country ?? ""}
                  onChange={(e) => set("country", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Bio</Label>
              <Textarea
                rows={3}
                value={form.bio ?? ""}
                onChange={(e) => set("bio", e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Descripción de servicios</Label>
              <Textarea
                rows={3}
                value={form.servicesDescription ?? ""}
                onChange={(e) => set("servicesDescription", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Especialidades (separadas por coma)</Label>
                <Input
                  value={Array.isArray(form.specialty) ? form.specialty.join(", ") : (form.specialty ?? "")}
                  onChange={(e) => set("specialty", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Géneros (separados por coma)</Label>
                <Input
                  value={Array.isArray(form.genres) ? form.genres.join(", ") : (form.genres ?? "")}
                  onChange={(e) => set("genres", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                />
              </div>
            </div>

            {/* Booking */}
            <div className="border rounded-md p-3 space-y-3">
              <p className="text-sm font-medium">Booking</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Modalidad</Label>
                  <Select
                    value={form.bookingModality ?? ""}
                    onValueChange={(v) => set("bookingModality", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin booking" /></SelectTrigger>
                    <SelectContent>
                      {MODALITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Precio</Label>
                  <Input
                    placeholder="USD 45"
                    value={form.bookingPrice ?? ""}
                    onChange={(e) => set("bookingPrice", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>URL de booking</Label>
                <Input
                  placeholder="https://calendly.com/…"
                  value={form.bookingUrl ?? ""}
                  onChange={(e) => set("bookingUrl", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Tagline de booking</Label>
                <Input
                  placeholder="Sesiones individuales · 60 min"
                  value={form.bookingTagline ?? ""}
                  onChange={(e) => set("bookingTagline", e.target.value)}
                />
              </div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Instagram (URL)</Label>
                <Input
                  value={form.instagram ?? ""}
                  onChange={(e) => set("instagram", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Linktree</Label>
                <Input
                  value={form.linktree ?? ""}
                  onChange={(e) => set("linktree", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Quote</Label>
              <Input
                value={form.quote ?? ""}
                onChange={(e) => set("quote", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Orden de aparición</Label>
                <Input
                  type="number"
                  value={String(form.sortOrder ?? 0)}
                  onChange={(e) => set("sortOrder", Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch
                  checked={form.certified ?? false}
                  onCheckedChange={(v) => set("certified", v)}
                />
                <Label>Certificado</Label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.status === "published"}
                onCheckedChange={(v) => set("status", v ? "published" : "draft")}
              />
              <Label>Publicado</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={isBusy}
              >
                {isBusy ? "Guardando…" : editing ? "Guardar cambios" : "Crear resonador"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
