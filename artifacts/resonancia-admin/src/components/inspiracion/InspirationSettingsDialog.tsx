import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpdateInspirationSettings, getGetAdminInspirationWeekQueryKey } from "@workspace/api-client-react";
import { InspirationSettings } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { getApiErrorMessage, getApiErrorStatus } from "./apiError";

const schema = z.object({
  sectionTitle: z.string().min(1, "Requerido").max(100),
  readMoreLabel: z.string().min(1, "Requerido").max(50),
  discoverMoreLabel: z.string().min(1, "Requerido").max(50),
  notesLabel: z.string().min(1, "Requerido").max(50),
});

export function InspirationSettingsDialog({
  open,
  onOpenChange,
  currentSettings,
  currentWeekStart
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: InspirationSettings;
  currentWeekStart: string;
}) {
  const queryClient = useQueryClient();
  const updateSettings = useUpdateInspirationSettings();
  const mutateFnRef = React.useRef(updateSettings.mutate);
  mutateFnRef.current = updateSettings.mutate;
  const [serverConflict, setServerConflict] = React.useState<InspirationSettings | null>(null);
  const [conflictPending, setConflictPending] = React.useState(false);
  const editingRevision = React.useRef(currentSettings.revision);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      sectionTitle: currentSettings.sectionTitle,
      readMoreLabel: currentSettings.readMoreLabel,
      discoverMoreLabel: currentSettings.discoverMoreLabel,
      notesLabel: currentSettings.notesLabel,
    },
  });

  const saveSettings = (data: z.infer<typeof schema>, revision: number) => {
    mutateFnRef.current({
      data: {
        ...data,
        revision,
      }
    }, {
      onSuccess: (saved) => {
        toast.success("Ajustes guardados");
        queryClient.invalidateQueries({ queryKey: getGetAdminInspirationWeekQueryKey() });
        editingRevision.current = saved.revision;
        setServerConflict(null);
        setConflictPending(false);
        form.reset(data);
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        if (getApiErrorStatus(err) === 409) {
          setConflictPending(true);
          toast.error(getApiErrorMessage(err, "Los ajustes fueron modificados por otro usuario."));
          queryClient.invalidateQueries({ queryKey: getGetAdminInspirationWeekQueryKey() });
        } else {
          toast.error(getApiErrorMessage(err, "Error al guardar ajustes"));
        }
      }
    });
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    if (serverConflict || conflictPending) {
      toast.error("Resuelve el conflicto antes de guardar.");
      return;
    }
    saveSettings(data, editingRevision.current);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && form.formState.isDirty) {
      if (!window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres cerrar?")) {
        return;
      }
      form.reset(); // Limpiamos para el próximo render
      setServerConflict(null);
      setConflictPending(false);
    }
    onOpenChange(isOpen);
  };

  // Safe refresh from props
  React.useEffect(() => {
    if (!open) return;

    if (form.formState.isDirty && currentSettings.revision !== editingRevision.current) {
      setServerConflict(currentSettings);
      setConflictPending(false);
    } else if (!form.formState.isDirty) {
      editingRevision.current = currentSettings.revision;
      form.reset({
        sectionTitle: currentSettings.sectionTitle,
        readMoreLabel: currentSettings.readMoreLabel,
        discoverMoreLabel: currentSettings.discoverMoreLabel,
        notesLabel: currentSettings.notesLabel,
      });
      setServerConflict(null);
      setConflictPending(false);
    }
  }, [open, currentSettings, form]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustes de Inspiración Diaria</DialogTitle>
        </DialogHeader>
        {(serverConflict || conflictPending) && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive space-y-3">
            <p className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Conflicto de revisión
            </p>
            {serverConflict ? (
              <>
                <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1 text-xs">
                  <strong>Campo</strong><strong>Mi versión</strong><strong>Servidor</strong>
                  <span>Título</span><span>{form.getValues("sectionTitle")}</span><span>{serverConflict.sectionTitle}</span>
                  <span>Leer más</span><span>{form.getValues("readMoreLabel")}</span><span>{serverConflict.readMoreLabel}</span>
                  <span>Descubre</span><span>{form.getValues("discoverMoreLabel")}</span><span>{serverConflict.discoverMoreLabel}</span>
                  <span>Notas</span><span>{form.getValues("notesLabel")}</span><span>{serverConflict.notesLabel}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={updateSettings.isPending}
                    onClick={async () => {
                      if (await form.trigger()) {
                        saveSettings(form.getValues(), serverConflict.revision);
                      }
                    }}
                  >
                    Sobrescribir con mi versión
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const serverValues = {
                        sectionTitle: serverConflict.sectionTitle,
                        readMoreLabel: serverConflict.readMoreLabel,
                        discoverMoreLabel: serverConflict.discoverMoreLabel,
                        notesLabel: serverConflict.notesLabel,
                      };
                      editingRevision.current = serverConflict.revision;
                      form.reset(serverValues);
                      setServerConflict(null);
                      setConflictPending(false);
                    }}
                  >
                    Cargar servidor
                  </Button>
                </div>
              </>
            ) : (
              <p>Cargando la versión actual del servidor…</p>
            )}
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sectionTitle">Título de la sección</Label>
            <Input id="sectionTitle" {...form.register("sectionTitle")} placeholder="Ej. Inspiración diaria" />
            {form.formState.errors.sectionTitle && (
              <p className="text-sm text-destructive">{form.formState.errors.sectionTitle.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="readMoreLabel">Botón "Leer más"</Label>
            <Input id="readMoreLabel" {...form.register("readMoreLabel")} placeholder="Ej. Leer más" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discoverMoreLabel">Botón "Descubre más"</Label>
            <Input id="discoverMoreLabel" {...form.register("discoverMoreLabel")} placeholder="Ej. Descubre más" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notesLabel">Botón "Mis notas"</Label>
            <Input id="notesLabel" {...form.register("notesLabel")} placeholder="Ej. Mis notas" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateSettings.isPending || !!serverConflict || conflictPending}>
              {updateSettings.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
