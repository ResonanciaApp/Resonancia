import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminFeaturedMoment,
  getGetAdminFeaturedMomentQueryKey,
  useSetAdminFeaturedMoment,
  getGetFeaturedMomentQueryKey,
} from "@workspace/api-client-react";
import type { FeaturedMomentAdminResponse } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  resolveImageUrl,
  filterCandidates,
  resolveDeepLink,
  buildSaveInput,
  isStaleDayError,
} from "@/lib/featured-moment";
import { Search, RotateCcw, Check, AlertTriangle, Sun } from "lucide-react";

const SOURCE_LABEL: Record<string, string> = {
  automatic: "Automático",
  manual: "Elección manual",
  empty: "Sin sesión",
};

export default function ParaEsteMomentoPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } =
    useGetAdminFeaturedMoment({
      query: {
        queryKey: getGetAdminFeaturedMomentQueryKey(),
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
      },
    });
  const mutation = useSetAdminFeaturedMoment();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deepLinkNote, setDeepLinkNote] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deepLinkDone, setDeepLinkDone] = useState(false);

  // Refresh at the server-reported day boundary.
  const nextChangeAt = data?.nextChangeAt;
  useEffect(() => {
    if (!nextChangeAt) return;
    const ms = new Date(nextChangeAt).getTime() - Date.now() + 1500;
    if (ms <= 0 || ms > 2 ** 31 - 1) return;
    const t = setTimeout(() => void refetch(), ms);
    return () => clearTimeout(t);
  }, [nextChangeAt, refetch]);

  // Deep link ?sessionId=...
  useEffect(() => {
    if (!data || deepLinkDone) return;
    setDeepLinkDone(true);
    const link = resolveDeepLink(window.location.search, data.candidates);
    if (link.kind === "selected") setSelectedId(link.id);
    else if (link.kind === "ineligible")
      setDeepLinkNote(
        "La sesión indicada no es elegible hoy (sin audio, inactiva o de la categoría Música).",
      );
  }, [data, deepLinkDone]);

  const categories = useMemo(() => {
    const m = new Map<string, string>();
    (data?.candidates ?? []).forEach((c) => m.set(c.categoryId, c.categoryLabel));
    return [...m.entries()];
  }, [data]);

  const filtered = useMemo(
    () => filterCandidates(data?.candidates ?? [], search, category),
    [data, search, category],
  );

  const applyResponse = (res: FeaturedMomentAdminResponse) => {
    qc.setQueryData(getGetAdminFeaturedMomentQueryKey(), res);
    void qc.invalidateQueries({ queryKey: getGetFeaturedMomentQueryKey() });
  };

  const save = (sessionId: string | null) => {
    if (!data) return;
    setActionError(null);
    mutation.mutate(
      { data: buildSaveInput(data.date, sessionId) },
      {
        onSuccess: (res) => {
          applyResponse(res);
          setSelectedId(null);
          toast.success(
            sessionId ? "Sesión elegida para hoy" : "Selección automática restaurada",
          );
        },
        onError: (e) => {
          if (isStaleDayError(e)) {
            void refetch();
            setActionError(
              "El día cambió mientras editabas. Actualizamos la vista; revisa y vuelve a intentarlo.",
            );
          } else {
            setActionError("No se pudo guardar. Intenta de nuevo.");
          }
        },
      },
    );
  };

  const busy = mutation.isPending;
  const selected = data?.candidates.find((c) => c.id === selectedId) ?? null;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl" data-testid="loading-para-este-momento">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl border border-destructive/40 rounded-xl p-6 space-y-3" role="alert">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          No se pudo cargar la selección diaria
        </div>
        <p className="text-sm text-muted-foreground">
          El servidor no respondió. Esto no significa que no haya sesiones.
        </p>
        <Button onClick={() => void refetch()} disabled={isFetching} data-testid="button-retry">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary" /> Para este momento
        </h1>
        <p className="text-sm text-muted-foreground">
          Sesión destacada del día en la app. Zona horaria {data.timezone}.
        </p>
      </div>

      {data.manualMigrated && (
        <div className="text-sm border border-primary/30 bg-primary/10 rounded-lg px-4 py-3" data-testid="notice-migrated">
          Esta elección fue migrada desde la función anterior de fijar sesión.
        </div>
      )}

      <section className="border border-border bg-card rounded-xl p-5 flex gap-4" aria-label="Estado actual">
        {resolveImageUrl(data.session?.imageUrl) ? (
          <img src={resolveImageUrl(data.session?.imageUrl) ?? ""} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-secondary shrink-0" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">
            Hoy, {data.date} · {SOURCE_LABEL[data.source] ?? data.source}
          </p>
          <p className="text-lg font-semibold truncate" data-testid="text-current-title">
            {data.session?.title ?? "Sin sesión disponible"}
          </p>
          {data.session && (
            <p className="text-sm text-muted-foreground">
              {data.session.categoryLabel} · {data.session.durationLabel}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {data.source === "manual"
              ? `La elección manual vence el ${new Date(data.nextChangeAt).toLocaleString("es-CL", { timeZone: data.timezone })}.`
              : `Cambia el ${new Date(data.nextChangeAt).toLocaleString("es-CL", { timeZone: data.timezone })}.`}{" "}
            {data.eligibleCount} sesiones elegibles.
          </p>
          {data.source === "manual" && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => save(null)}
              data-testid="button-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              {busy ? "Guardando..." : "Volver a automático"}
            </Button>
          )}
        </div>
      </section>

      {deepLinkNote && (
        <div className="text-sm border border-border rounded-lg px-4 py-3" role="status" data-testid="notice-deeplink">
          {deepLinkNote}
        </div>
      )}
      {actionError && (
        <div className="text-sm border border-destructive/40 rounded-lg px-4 py-3" role="alert" data-testid="text-action-error">
          {actionError}
        </div>
      )}

      {data.candidates.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground" data-testid="empty-candidates">
          No hay sesiones elegibles. Publica sesiones con audio fuera de la categoría Música.
        </div>
      ) : (
        <section className="space-y-3" aria-label="Selector de sesión">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar sesión"
                placeholder="Buscar por título"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <select
              aria-label="Filtrar por categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              data-testid="select-category"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-border rounded-xl divide-y divide-border max-h-[420px] overflow-auto" role="listbox" aria-label="Sesiones elegibles">
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Ninguna sesión coincide.</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  c.id === selectedId ? "bg-primary/10" : "hover:bg-secondary"
                }`}
                data-testid={`option-session-${c.id}`}
              >
                {resolveImageUrl(c.imageUrl) ? (
                  <img src={resolveImageUrl(c.imageUrl) ?? ""} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-secondary" />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.categoryLabel} · {c.durationLabel}
                  </span>
                </span>
                {c.id === selectedId && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>

          <Button
            disabled={!selected || busy || selected.id === data.session?.id && data.source === "manual"}
            onClick={() => selected && save(selected.id)}
            data-testid="button-choose"
          >
            {busy ? "Guardando..." : "Elegir para hoy"}
          </Button>
        </section>
      )}
    </div>
  );
}
