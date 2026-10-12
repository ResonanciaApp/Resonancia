import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminStreakInfo,
  useUpdateAdminStreakInfo,
  getGetAdminStreakInfoQueryKey,
} from "@workspace/api-client-react";
import type { StreakInfoSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, Flame, RefreshCw } from "lucide-react";
import {
  STREAK_CARD_LABELS,
  STREAK_LIMITS,
  errorStatus,
  sameDraft,
  toDraft,
  toPayload,
  validateStreakInfo,
  type StreakInfoDraft,
} from "@/lib/streak-info-form";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={`text-xs ${value.length > max ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
      {value.length} / {max}
    </span>
  );
}

function FieldError({ message, testId }: { message?: string; testId: string }) {
  return message ? (
    <p className="text-sm font-medium text-destructive" data-testid={testId}>{message}</p>
  ) : <span />;
}

export default function SistemaRachasPage() {
  const queryClient = useQueryClient();
  const queryKey = getGetAdminStreakInfoQueryKey();
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminStreakInfo({ query: { queryKey } });
  const update = useUpdateAdminStreakInfo();

  const [draft, setDraft] = useState<StreakInfoDraft | null>(null);
  const [baseline, setBaseline] = useState<StreakInfoDraft | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;

  const dirty = !!draft && !!baseline && !sameDraft(draft, baseline);

  // Initialize from server; on refetch only adopt new data when there is no dirty draft.
  useEffect(() => {
    if (!data) return;
    const next = toDraft(data.content);
    const d = draftRef.current;
    const b = baselineRef.current;
    const isDirty = !!d && !!b && !sameDraft(d, b);
    if (!d || !isDirty) {
      setDraft(next);
      setBaseline(next);
      setRevision(data.revision);
    }
  }, [data]);

  const reloadFromServer = async () => {
    const res = await refetch();
    if (res.data) {
      const next = toDraft(res.data.content);
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

  const errors = draft ? validateStreakInfo(draft) : {};
  const showErr = (k: string) => (submitted ? errors[k] : undefined);

  const onSave = () => {
    if (!draft || revision === null) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      toast.error("Revisa los campos marcados");
      return;
    }
    update.mutate(
      { data: toPayload(draft, revision) as StreakInfoSettings },
      {
        onSuccess: (saved) => {
          queryClient.setQueryData(queryKey, saved);
          const next = toDraft(saved.content);
          setDraft(next);
          setBaseline(next);
          setRevision(saved.revision);
          setSubmitted(false);
          setConflict(false);
          toast.success("Sistema de rachas actualizado");
        },
        onError: (error: unknown) => {
          if (errorStatus(error) === 409) {
            setConflict(true);
            toast.error("Alguien más modificó este contenido. Tus cambios no se guardaron.");
          } else if (errorStatus(error) === 400) {
            toast.error("El servidor rechazó los datos. Revisa los campos.");
          } else {
            toast.error("Error al guardar el sistema de rachas");
          }
        },
      },
    );
  };

  const setCard = (i: number, key: "title" | "description", value: string) =>
    setDraft((d) => d && { ...d, cards: d.cards.map((c, j) => (j === i ? { ...c, [key]: value } : c)) });

  const pending = update.isPending;

  return (
    <div className="space-y-8 max-w-[800px] mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sistema de rachas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edita el texto explicativo de la pantalla de rachas en la aplicación.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse" data-testid="status-loading">
          <div className="h-48 bg-muted/50 rounded-lg w-full" />
          <div className="h-40 bg-muted/50 rounded-lg w-full" />
          <div className="h-40 bg-muted/50 rounded-lg w-full" />
        </div>
      ) : isError || !draft ? (
        <div className="p-4 text-sm text-destructive flex items-start gap-3 bg-destructive/10 rounded-lg border border-destructive/20" data-testid="status-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Ocurrió un error</p>
            <p className="mt-1 opacity-90">No se pudo cargar el contenido del sistema de rachas.</p>
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
                <Flame className="w-5 h-5 text-primary" />
                Encabezado
              </CardTitle>
              <CardDescription>Título y descripción general de la pantalla.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="streak-title" className="text-foreground">Título</Label>
                <Input
                  id="streak-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  disabled={pending}
                  className="bg-card h-12 text-base"
                  data-testid="input-title"
                />
                <div className="flex justify-between items-center">
                  <FieldError message={showErr("title")} testId="error-title" />
                  <Counter value={draft.title} max={STREAK_LIMITS.title} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="streak-description" className="text-foreground">Descripción general</Label>
                <Textarea
                  id="streak-description"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  disabled={pending}
                  rows={4}
                  className="bg-card text-base"
                  data-testid="input-description"
                />
                <div className="flex justify-between items-center">
                  <FieldError message={showErr("description")} testId="error-description" />
                  <Counter value={draft.description} max={STREAK_LIMITS.description} />
                </div>
              </div>
            </CardContent>
          </Card>

          {draft.cards.map((card, i) => (
            <Card key={card.id} className="border-border/50 shadow-sm" data-testid={`card-streak-${card.id}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">{STREAK_CARD_LABELS[card.id]}</CardTitle>
                <CardDescription>Identificador fijo: <code>{card.id}</code></CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor={`card-${card.id}-title`} className="text-foreground">Título</Label>
                  <Input
                    id={`card-${card.id}-title`}
                    value={card.title}
                    onChange={(e) => setCard(i, "title", e.target.value)}
                    disabled={pending}
                    className="bg-card"
                    data-testid={`input-card-title-${card.id}`}
                  />
                  <div className="flex justify-between items-center">
                    <FieldError message={showErr(`cards.${i}.title`)} testId={`error-card-title-${card.id}`} />
                    <Counter value={card.title} max={STREAK_LIMITS.cardTitle} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`card-${card.id}-description`} className="text-foreground">Descripción</Label>
                  <Textarea
                    id={`card-${card.id}-description`}
                    value={card.description}
                    onChange={(e) => setCard(i, "description", e.target.value)}
                    disabled={pending}
                    rows={4}
                    className="bg-card"
                    data-testid={`input-card-description-${card.id}`}
                  />
                  <div className="flex justify-between items-center">
                    <FieldError message={showErr(`cards.${i}.description`)} testId={`error-card-description-${card.id}`} />
                    <Counter value={card.description} max={STREAK_LIMITS.cardDescription} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {submitted && errors.cards && <FieldError message={errors.cards} testId="error-cards" />}

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
