import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Video, Link2, CheckCircle2, XCircle } from "lucide-react";
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

interface GuideConfig {
  guideId: string;
  displayName: string;
  calLink: string | null;
  dailyRoomUrl: string | null;
  isLiveEnabled: boolean;
  updatedAt: string;
}

async function fetchGuideConfigs(): Promise<GuideConfig[]> {
  const res = await fetch("/api/admin/guide-configs", { credentials: "include" });
  if (!res.ok) throw new Error("Error al cargar configuraciones");
  const data = await res.json() as { guideConfigs: GuideConfig[] };
  return data.guideConfigs;
}

async function createGuideConfig(body: Omit<GuideConfig, "updatedAt">): Promise<GuideConfig> {
  const res = await fetch("/api/admin/guide-configs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al crear");
  }
  return res.json() as Promise<GuideConfig>;
}

async function updateGuideConfig(
  guideId: string,
  body: Partial<Omit<GuideConfig, "guideId" | "updatedAt">>,
): Promise<GuideConfig> {
  const res = await fetch(`/api/admin/guide-configs/${encodeURIComponent(guideId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al actualizar");
  }
  return res.json() as Promise<GuideConfig>;
}

async function deleteGuideConfig(guideId: string): Promise<void> {
  const res = await fetch(`/api/admin/guide-configs/${encodeURIComponent(guideId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar");
}

const EMPTY_FORM = {
  guideId: "",
  displayName: "",
  calLink: "",
  dailyRoomUrl: "",
  isLiveEnabled: false,
};

export default function GuiadoresVivoPage() {
  const qc = useQueryClient();
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin-guide-configs"],
    queryFn: fetchGuideConfigs,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuideConfig | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: createGuideConfig,
    onSuccess: () => {
      toast.success("Guiador creado");
      qc.invalidateQueries({ queryKey: ["admin-guide-configs"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ guideId, body }: { guideId: string; body: Partial<Omit<GuideConfig, "guideId" | "updatedAt">> }) =>
      updateGuideConfig(guideId, body),
    onSuccess: () => {
      toast.success("Guiador actualizado");
      qc.invalidateQueries({ queryKey: ["admin-guide-configs"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGuideConfig,
    onSuccess: () => {
      toast.success("Guiador eliminado");
      qc.invalidateQueries({ queryKey: ["admin-guide-configs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (g: GuideConfig) => {
    setEditing(g);
    setForm({
      guideId: g.guideId,
      displayName: g.displayName,
      calLink: g.calLink ?? "",
      dailyRoomUrl: g.dailyRoomUrl ?? "",
      isLiveEnabled: g.isLiveEnabled,
    });
    setDialogOpen(true);
  };

  const handleToggleEnabled = (g: GuideConfig) => {
    updateMutation.mutate({
      guideId: g.guideId,
      body: { isLiveEnabled: !g.isLiveEnabled },
    });
  };

  const handleSubmit = () => {
    if (!form.guideId.trim() || !form.displayName.trim()) {
      toast.error("ID de guiador y nombre son requeridos");
      return;
    }
    const payload = {
      guideId: form.guideId.trim(),
      displayName: form.displayName.trim(),
      calLink: form.calLink.trim() || null,
      dailyRoomUrl: form.dailyRoomUrl.trim() || null,
      isLiveEnabled: form.isLiveEnabled,
    };
    if (editing) {
      updateMutation.mutate({ guideId: editing.guideId, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (g: GuideConfig) => {
    if (!confirm(`¿Eliminar la configuración de "${g.displayName}"?`)) return;
    deleteMutation.mutate(g.guideId);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guiadores en vivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurá los guiadores con sesiones en vivo habilitadas (Cal.com + Daily.co).
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar guiador
        </Button>
      </div>

      {/* Instrucciones */}
      <div className="bg-card border border-border rounded-xl p-4 text-sm space-y-2 text-muted-foreground">
        <p className="font-semibold text-foreground">Cómo configurar un guiador</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>El guiador crea una cuenta en <strong className="text-foreground">cal.com</strong> y configura su disponibilidad.</li>
          <li>Copiá el link de su página de Cal.com (ej. <code className="bg-secondary px-1 rounded">https://cal.com/sofia-ramirez/sesion-1-hora</code>).</li>
          <li>Creá (o copiá) una sala de <strong className="text-foreground">Daily.co</strong> para este guiador y pegá la URL.</li>
          <li>Activá "Sesiones en vivo" para que aparezca en la app.</li>
          <li>Configurá el webhook de Cal.com apuntando a <code className="bg-secondary px-1 rounded">/api/live/webhook/cal</code> con el secreto <code className="bg-secondary px-1 rounded">CAL_WEBHOOK_SECRET</code>.</li>
        </ol>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <Video className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin guiadores configurados</p>
          <p className="text-xs mt-1">Agregá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((g) => (
            <div
              key={g.guideId}
              className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{g.displayName}</span>
                  <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {g.guideId}
                  </code>
                  <Badge
                    variant={g.isLiveEnabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {g.isLiveEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="space-y-1 mt-2">
                  {g.calLink ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Link2 className="w-3 h-3 shrink-0" />
                      <a
                        href={g.calLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-primary transition-colors"
                      >
                        {g.calLink}
                      </a>
                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span className="italic">Sin link de Cal.com</span>
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    </div>
                  )}
                  {g.dailyRoomUrl ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Video className="w-3 h-3 shrink-0" />
                      <span className="truncate">{g.dailyRoomUrl}</span>
                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Video className="w-3 h-3 shrink-0" />
                      <span className="italic">Sin sala de Daily.co</span>
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={g.isLiveEnabled}
                  onCheckedChange={() => handleToggleEnabled(g)}
                  title="Habilitar sesiones en vivo"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(g)}
                  className="h-8 w-8"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(g)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar guiador" : "Agregar guiador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>ID del guiador *</Label>
              <Input
                value={form.guideId}
                onChange={(e) => setForm((f) => ({ ...f, guideId: e.target.value }))}
                placeholder="sofia-ramirez"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground">
                Debe coincidir con el guideId en las sesiones del catálogo.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre para mostrar *</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Sofía Ramírez"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link de Cal.com</Label>
              <Input
                value={form.calLink}
                onChange={(e) => setForm((f) => ({ ...f, calLink: e.target.value }))}
                placeholder="https://cal.com/sofia-ramirez/sesion-1-hora"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL sala Daily.co</Label>
              <Input
                value={form.dailyRoomUrl}
                onChange={(e) => setForm((f) => ({ ...f, dailyRoomUrl: e.target.value }))}
                placeholder="https://resonancia.daily.co/sofia-ramirez"
                type="url"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isLiveEnabled"
                checked={form.isLiveEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isLiveEnabled: v }))}
              />
              <Label htmlFor="isLiveEnabled" className="cursor-pointer">
                Sesiones en vivo habilitadas
              </Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "Guardando..." : editing ? "Guardar cambios" : "Crear guiador"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
