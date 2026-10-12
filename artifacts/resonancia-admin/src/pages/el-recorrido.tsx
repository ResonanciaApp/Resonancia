import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminJourneyInfo,
  useUpdateAdminJourneyInfo,
  getGetAdminJourneyInfoQueryKey,
} from "@workspace/api-client-react";
import type { JourneyInfoSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, Map as MapIcon, RefreshCw } from "lucide-react";
import { errorStatus } from "@/lib/streak-info-form";
import {
  JOURNEY_LIMITS,
  sameJourneyDraft,
  toJourneyDraft,
  toJourneyPayload,
  validateJourneyInfo,
  type JourneyInfoDraft,
} from "@/lib/journey-info-form";

function Counter({ value, max }: { value: string; max: number }) {
  const len = value.trim().length;
  return (
    <span className={`text-xs ${len > max ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
      {len} / {max}
    </span>
  );
}

function FieldError({ message, testId }: { message?: string; testId: string }) {
  return message ? (
    <p className="text-sm font-medium text-destructive" data-testid={testId}>{message}</p>
  ) : <span />;
}

export default function ElRecorridoPage() {
  const queryClient = useQueryClient();
  const queryKey = getGetAdminJourneyInfoQueryKey();
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminJourneyInfo({ query: { queryKey } });
  const update = useUpdateAdminJourneyInfo();

  const [draft, setDraft] = useState<JourneyInfoDraft | null>(null);
  const [baseline, setBaseline] = useState<JourneyInfoDraft | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;

  const dirty = !!draft && !!baseline && !sameJourneyDraft(draft, baseline);

  // Initialize from server; on refetch only adopt new data when there is no dirty draft.
  useEffect(() => {
    if (!data) return;
    const next = toJourneyDraft(data.content);
    const d = draftRef.current;
    const b = baselineRef.current;
    const isDirty = !!d && !!b && !sameJourneyDraft(d, b);
    if (!d || !isDirty) {
      setDraft(next);
      setBaseline(next);
      setRevision(data.revision);
    }
  }, [data]);

  const reloadFromServer = async () => {
    const res = await refetch();
    if (res.data) {
      const next = toJourneyDraft(res.data.content);
      setDraft(next);
      setBaseline(next);
      setRevision(res.data.revision);
      setConflict(false);
      setSubmitted(false);
      toast.success("Se cargó la versión más reciente");
    } else {
      toast.error("No se pudo recargar. Intenta de nuevo.");
    }
  };

  const errors = draft ? validateJourneyInfo(draft) : {};
  const showErr = (k: keyof JourneyInfoDraft) => (submitted ? errors[k] : undefined);

  const onSave = () => {
    if (!draft || revision === null) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      toast.error("Revisa los campos marcados");
      return;
    }
    const payload: JourneyInfoSettings = toJourneyPayload(draft, revision);
    update.mutate(
      { data: payload },
      {
        onSuccess: (saved) => {
          queryClient.setQueryData(queryKey, saved);
          const next = toJourneyDraft(saved.content);
          setDraft(next);
          setBaseline(next);
          setRevision(saved.revision);
          setSubmitted(false);
          setConflict(false);
          toast.success("El Recorrido actualizado");
        },
        onError: (error: unknown) => {
          if (errorStatus(error) === 409) {
            setConflict(true);
            toast.error("Alguien más modificó este contenido. Tus cambios no se guardaron.");
          } else if (errorStatus(error) === 400) {
            toast.error("El servidor rechazó los datos. Revisa los campos.");
          } else {
            toast.error("Error al guardar El Recorrido");
          }
        },
      },
    );
  };

  const pending = update.isPending;

  return (
    <div className="space-y-8 max-w-[800px] mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">El Recorrido</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edita el texto explicativo que aparece en la app en Tu camino &gt; El recorrido &gt; ? (botón de ayuda arriba a la derecha). No modifica reglas ni el mapa.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse" data-testid="status-loading">
          <div className="h-64 bg-muted/50 rounded-lg w-full" />
        </div>
      ) : isError || !draft ? (
        <div className="p-4 text-sm text-destructive flex items-start gap-3 bg-destructive/10 rounded-lg border border-destructive/20" data-testid="status-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Ocurrió un error</p>
            <p className="mt-1 opacity-90">No se pudo cargar el contenido de El Recorrido.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-retry">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          {conflict && (
            <div className="p-4 text-sm flex items-start gap-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20" data-testid="status-conflict">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Conflicto de versiones</p>
                <p className="mt-1 opacity-90">
                  Otra persona guardó cambios mientras editabas. Tu borrador se conserva aquí, pero no puede guardarse
                  sobre la versión nueva. Al recargar se descartarán tus cambios.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={reloadFromServer} disabled={isFetching} data-testid="button-reload-conflict">
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                Recargar versión actual
              </Button>
            </div>
          )}

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-primary" />
                Explicación
              </CardTitle>
              <CardDescription>Título y texto que ve la persona al abrir la explicación. Los saltos de línea separan párrafos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="journey-title" className="text-foreground">Título</Label>
                <Input
                  id="journey-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  disabled={pending}
                  className="bg-card h-12 text-base"
                  data-testid="input-title"
                />
                <div className="flex justify-between items-center">
                  <FieldError message={showErr("title")} testId="error-title" />
                  <Counter value={draft.title} max={JOURNEY_LIMITS.title} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="journey-description" className="text-foreground">Descripción</Label>
                <Textarea
                  id="journey-description"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  disabled={pending}
                  rows={12}
                  className="bg-card text-base"
                  data-testid="input-description"
                />
                <div className="flex justify-between items-center">
                  <FieldError message={showErr("description")} testId="error-description" />
                  <Counter value={draft.description} max={JOURNEY_LIMITS.description} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            {dirty && (
              <Button type="button" variant="ghost" onClick={() => baseline && setDraft(baseline)} disabled={pending} data-testid="button-discard">
                Descartar cambios
              </Button>
            )}
            <Button type="submit" disabled={pending || !dirty || conflict} className="min-w-[140px]" data-testid="button-save">
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
