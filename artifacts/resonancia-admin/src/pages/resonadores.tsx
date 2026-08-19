import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Database,
  BadgeCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
};

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

export default function ResonadoresPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiResonador | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

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

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  }

  function openEdit(r: ApiResonador) {
    setEditing(r);
    setForm({
      ...r,
      specialty: r.specialty,
      genres: r.genres,
    });
    setOpen(true);
  }

  function handleSubmit() {
    const payload = {
      ...form,
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
              Seed inicial (10)
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
                onClick={handleSubmit}
                disabled={createMut.isPending || updateMut.isPending}
              >
                {editing ? "Guardar cambios" : "Crear resonador"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
