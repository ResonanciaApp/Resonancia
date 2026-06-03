import { useState } from "react";
import {
  useGetPendingSubmissions,
  useApproveSubmission,
  useRejectSubmission,
  useEditSubmission,
  useHideSubmission,
  useUnhideSubmission,
} from "@workspace/api-client-react";
import type {
  Submission,
  GetPendingSubmissionsStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_TABS: { value: GetPendingSubmissionsStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Ocultas" },
  { value: "rejected", label: "Rechazadas" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  draft: { label: "Oculta", variant: "outline" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

function RejectDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const mutation = useRejectSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Envío rechazado.");
        qc.invalidateQueries();
        onOpenChange(false);
        setReason("");
      },
      onError: () => toast.error("No se pudo rechazar."),
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar “{submission.title}”</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo del rechazo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica al creador por qué se rechaza…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length === 0 || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                id: submission.id,
                data: { reason: reason.trim() },
              })
            }
          >
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(submission.title);
  const [subtitle, setSubtitle] = useState(submission.subtitle);
  const mutation = useEditSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Cambios guardados.");
        qc.invalidateQueries();
        onOpenChange(false);
      },
      onError: () => toast.error("No se pudo editar."),
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar envío</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-subtitle">Subtítulo</Label>
            <Input
              id="edit-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={
              title.trim().length === 0 ||
              subtitle.trim().length === 0 ||
              mutation.isPending
            }
            onClick={() =>
              mutation.mutate({
                id: submission.id,
                data: { title: title.trim(), subtitle: subtitle.trim() },
              })
            }
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const badge = STATUS_BADGE[submission.status] ?? {
    label: submission.status,
    variant: "outline" as const,
  };

  const invalidate = () => qc.invalidateQueries();

  const approve = useApproveSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Envío aprobado y publicado.");
        invalidate();
      },
      onError: () => toast.error("No se pudo aprobar."),
    },
  });
  const hide = useHideSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Contenido ocultado.");
        invalidate();
      },
      onError: () => toast.error("No se pudo ocultar."),
    },
  });
  const unhide = useUnhideSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Contenido visible nuevamente.");
        invalidate();
      },
      onError: () => toast.error("No se pudo mostrar."),
    },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{submission.title}</h3>
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {submission.isPremium && <Badge variant="outline">Premium</Badge>}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {submission.subtitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {submission.categoryLabel} · {submission.durationLabel}
              {submission.creator
                ? ` · por ${submission.creator.displayName}`
                : ""}
            </p>
            {submission.status === "rejected" && submission.rejectionReason && (
              <p className="text-xs text-destructive mt-1">
                Motivo: {submission.rejectionReason}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {submission.status === "pending" && (
              <>
                <Button
                  size="sm"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate({ id: submission.id })}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                >
                  Rechazar
                </Button>
              </>
            )}
            {submission.status === "published" && (
              <Button
                size="sm"
                variant="outline"
                disabled={hide.isPending}
                onClick={() => hide.mutate({ id: submission.id })}
              >
                Ocultar
              </Button>
            )}
            {submission.status === "draft" && (
              <Button
                size="sm"
                disabled={unhide.isPending}
                onClick={() => unhide.mutate({ id: submission.id })}
              >
                Mostrar
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditOpen(true)}
            >
              Editar
            </Button>
          </div>
        </div>
      </CardContent>

      <RejectDialog
        submission={submission}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
      <EditDialog
        submission={submission}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
}

function SubmissionList({ status }: { status: GetPendingSubmissionsStatus }) {
  const { data, isLoading, error } = useGetPendingSubmissions({ status });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-destructive py-8 text-center">
        No se pudo cargar la cola.
      </p>
    );
  }
  if (!data || data.submissions.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No hay contenido en este estado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.submissions.map((s) => (
        <SubmissionCard key={s.id} submission={s} />
      ))}
    </div>
  );
}

export default function ModeracionPage() {
  const [tab, setTab] = useState<GetPendingSubmissionsStatus>("pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderación</h1>
        <p className="text-muted-foreground">
          Revisa, aprueba, edita y oculta el contenido enviado por creadores.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as GetPendingSubmissionsStatus)}
      >
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUS_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {tab === t.value && <SubmissionList status={t.value} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
