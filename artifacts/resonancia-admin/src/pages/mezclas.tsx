import { useState } from "react";
import {
  useGetAdminMixes,
  useSetAdminMixHidden,
  useDeleteAdminMix,
} from "@workspace/api-client-react";
import type { AdminMix } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DeleteDialog({
  mix,
  open,
  onOpenChange,
}: {
  mix: AdminMix;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const mutation = useDeleteAdminMix({
    mutation: {
      onSuccess: () => {
        toast.success("Mezcla eliminada.");
        qc.invalidateQueries();
        onOpenChange(false);
      },
      onError: () => toast.error("No se pudo eliminar."),
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar “{mix.name}”</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta acción es permanente. La mezcla, sus me gusta, comentarios y
          reportes se eliminarán definitivamente.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: mix.id })}
          >
            Eliminar definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MixCard({ mix }: { mix: AdminMix }) {
  const qc = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setHidden = useSetAdminMixHidden({
    mutation: {
      onSuccess: (_data, vars) => {
        toast.success(vars.data.hidden ? "Mezcla ocultada." : "Mezcla visible nuevamente.");
        qc.invalidateQueries();
      },
      onError: () => toast.error("No se pudo actualizar la visibilidad."),
    },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{mix.name}</h3>
              {mix.hidden ? (
                <Badge variant="outline">Oculta</Badge>
              ) : (
                <Badge variant="default">Visible</Badge>
              )}
              {mix.reportCount > 0 && (
                <Badge variant="destructive">
                  {mix.reportCount} reporte{mix.reportCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {mix.description && (
              <p className="text-sm text-muted-foreground truncate">
                {mix.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""} ·{" "}
              {mix.likes} me gusta · por {mix.author.displayName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {mix.hidden ? (
              <Button
                size="sm"
                disabled={setHidden.isPending}
                onClick={() => setHidden.mutate({ id: mix.id, data: { hidden: false } })}
              >
                Mostrar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={setHidden.isPending}
                onClick={() => setHidden.mutate({ id: mix.id, data: { hidden: true } })}
              >
                Ocultar
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>

      <DeleteDialog mix={mix} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </Card>
  );
}

export default function MezclasPage() {
  const { data, isLoading, error } = useGetAdminMixes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mezclas de la comunidad</h1>
        <p className="text-muted-foreground">
          Mezclas reportadas u ocultas. Revísalas, vuélvelas a mostrar o
          elimínalas definitivamente.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <p className="text-destructive py-8 text-center">
          No se pudo cargar la cola.
        </p>
      ) : !data || data.mixes.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No hay mezclas reportadas ni ocultas.
        </p>
      ) : (
        <div className="space-y-3">
          {data.mixes.map((m) => (
            <MixCard key={m.id} mix={m} />
          ))}
        </div>
      )}
    </div>
  );
}
