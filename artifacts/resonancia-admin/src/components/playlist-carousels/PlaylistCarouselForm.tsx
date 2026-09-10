import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateAdminPlaylistCarousel,
  useUpdateAdminPlaylistCarousel,
  type AdminPlaylistCarouselInput,
  type CatalogPlaylist,
  type PlaylistCarousel,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaylistCarouselPicker } from "./PlaylistCarouselPicker";

type PlaylistCarouselFormProps = {
  initial: PlaylistCarousel | null;
  playlists: CatalogPlaylist[];
  onCancel: () => void;
  onSaved: () => void;
};

type FormState = {
  title: string;
  surface: PlaylistCarousel["surface"];
  sortOrder: number;
  isActive: boolean;
  playlistIds: string[];
};

function getInitialState(initial: PlaylistCarousel | null): FormState {
  return {
    title: initial?.title ?? "",
    surface: initial?.surface ?? "discover",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
    playlistIds: [...new Set(initial?.playlistIds ?? [])],
  };
}

export function PlaylistCarouselForm({
  initial,
  playlists,
  onCancel,
  onSaved,
}: PlaylistCarouselFormProps) {
  const [form, setForm] = useState<FormState>(() => getInitialState(initial));
  const [saving, setSaving] = useState(false);
  const { mutateAsync: createCarousel } = useCreateAdminPlaylistCarousel();
  const { mutateAsync: updateCarousel } = useUpdateAdminPlaylistCarousel();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("El nombre del carrusel es obligatorio");
      return;
    }
    if (title.length > 120) {
      toast.error("El nombre del carrusel no puede superar 120 caracteres");
      return;
    }

    const payload: AdminPlaylistCarouselInput = {
      title,
      surface: form.surface,
      sortOrder: Number.isFinite(form.sortOrder)
        ? Math.max(0, Math.trunc(form.sortOrder))
        : 0,
      isActive: form.isActive,
      playlistIds: [...new Set(form.playlistIds)],
    };

    setSaving(true);
    try {
      if (initial) {
        await updateCarousel({ id: initial.id, data: payload });
        toast.success("Carrusel actualizado");
      } else {
        await createCarousel({ data: payload });
        toast.success("Carrusel creado");
      }
      onSaved();
      onCancel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el carrusel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-1.5">
          <Label htmlFor="carousel-title">Nombre del carrusel *</Label>
          <Input
            id="carousel-title"
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Recomendadas para ti"
            maxLength={120}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="carousel-order">Orden en la pantalla</Label>
          <Input
            id="carousel-order"
            type="number"
            min={0}
            step={1}
            value={form.sortOrder}
            onChange={(event) => set("sortOrder", Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="carousel-surface">Pantalla de destino</Label>
          <Select
            value={form.surface}
            onValueChange={(surface) => set("surface", surface as PlaylistCarousel["surface"])}
          >
            <SelectTrigger id="carousel-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discover">Descubrir</SelectItem>
              <SelectItem value="sleep">Dormir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 sm:pb-2">
          <Switch
            id="carousel-active"
            checked={form.isActive}
            onCheckedChange={(active) => set("isActive", active)}
          />
          <Label htmlFor="carousel-active" className="cursor-pointer">
            Visible
          </Label>
        </div>
      </div>

      <PlaylistCarouselPicker
        playlists={playlists}
        selected={form.playlistIds}
        onChange={(playlistIds) => set("playlistIds", playlistIds)}
      />

      <p className="text-xs text-muted-foreground">
        Ocultar un carrusel conserva su nombre, playlists y orden para volver a publicarlo después.
      </p>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Guardar cambios" : "Crear carrusel"}
        </Button>
      </div>
    </form>
  );
}