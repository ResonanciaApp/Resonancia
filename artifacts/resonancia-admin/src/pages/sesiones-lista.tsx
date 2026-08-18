import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, Pencil } from "lucide-react";
import {
  useGetAdminSessions,
  useApproveSubmission,
  useHideSubmission,
  useUnhideSubmission,
  useDeleteSubmission,
  getGetAdminSessionsQueryKey,
} from "@workspace/api-client-react";
import type {
  Submission,
  GetAdminSessionsStatus,
  GetAdminSessionsParams,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 25;

const STATUS_TABS: { value: GetAdminSessionsStatus; label: string }[] = [
  { value: "published", label: "Publicadas" },
  { value: "pending", label: "Pendientes" },
  { value: "draft", label: "Borrador" },
  { value: "rejected", label: "Rechazadas" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  draft: { label: "Borrador", variant: "outline" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

function RowActions({ submission, isModerator }: { submission: Submission; isModerator?: boolean }) {
  const qc = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const invalidate = () => qc.invalidateQueries();

  const approve = useApproveSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión publicada."); invalidate(); },
      onError: () => toast.error("No se pudo publicar."),
    },
  });
  const hide = useHideSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión despublicada."); invalidate(); },
      onError: () => toast.error("No se pudo despublicar."),
    },
  });
  const unhide = useUnhideSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión publicada."); invalidate(); },
      onError: () => toast.error("No se pudo publicar."),
    },
  });
  const remove = useDeleteSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión borrada."); setDeleteOpen(false); invalidate(); },
      onError: () => toast.error("No se pudo borrar."),
    },
  });

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button asChild size="sm" variant="secondary">
        <Link href={`/sesiones/${submission.id}/editar`}>
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Editar
        </Link>
      </Button>

      {submission.status === "published" && (
        <Button size="sm" variant="outline" disabled={hide.isPending} onClick={() => hide.mutate({ id: submission.id })}>
          Despublicar
        </Button>
      )}
      {submission.status === "draft" && (
        <Button size="sm" disabled={unhide.isPending} onClick={() => unhide.mutate({ id: submission.id })}>
          Publicar
        </Button>
      )}
      {(submission.status === "pending" || submission.status === "rejected") && (
        <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate({ id: submission.id })}>
          Publicar
        </Button>
      )}

      {!isModerator && (
        <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => setDeleteOpen(true)}>
          Borrar
        </Button>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará definitivamente "{submission.title}" junto con sus audios. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => { e.preventDefault(); remove.mutate({ id: submission.id }); }}
            >
              {remove.isPending ? "Borrando…" : "Borrar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SesionesListaPage() {
  const [status, setStatus] = useState<GetAdminSessionsStatus>("published");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params: GetAdminSessionsParams = {
    status,
    page,
    pageSize: PAGE_SIZE,
    ...(query ? { q: query } : {}),
  };

  const { data, isLoading } = useGetAdminSessions(params, {
    query: { queryKey: getGetAdminSessionsQueryKey(params) },
  });

  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sesiones</h1>
          <p className="text-muted-foreground">
            Gestioná todas las sesiones del catálogo.
          </p>
        </div>
        <Button asChild>
          <Link href="/sesiones/nueva">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nueva sesión
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{total} {total === 1 ? "sesión" : "sesiones"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={status}
            onValueChange={(v) => { setStatus(v as GetAdminSessionsStatus); setPage(1); }}
          >
            <TabsList>
              {STATUS_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Input
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin resultados.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => {
                    const badge = STATUS_BADGE[s.status] ?? { label: s.status, variant: "outline" as const };
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.subtitle}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.categoryLabel}</TableCell>
                        <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(s.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <RowActions submission={s} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
