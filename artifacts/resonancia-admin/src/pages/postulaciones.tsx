import { useState } from "react";
import {
  useGetAdminApplications,
  useUpdateApplicationStatus,
} from "@workspace/api-client-react";
import type {
  Application,
  GetAdminApplicationsStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { MapPin, Phone, User, Music } from "lucide-react";

const STATUS_TABS: { value: GetAdminApplicationsStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "reviewed", label: "En revisión" },
  { value: "accepted", label: "Aceptadas" },
  { value: "rejected", label: "Rechazadas" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  reviewed: { label: "En revisión", variant: "outline" },
  accepted: { label: "Aceptada", variant: "default" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

const TYPE_LABEL: Record<string, string> = {
  resonador: "Resonador",
  expansor: "Expansor",
};

function audioUrl(audioPath: string): string {
  const clean = audioPath.replace(/^\/objects\//, "");
  return `/api/storage/objects/${clean}`;
}

function ApplicationCard({ application }: { application: Application }) {
  const qc = useQueryClient();
  const badge = STATUS_BADGE[application.status] ?? {
    label: application.status,
    variant: "outline" as const,
  };

  const update = useUpdateApplicationStatus({
    mutation: {
      onSuccess: () => {
        toast.success("Estado actualizado.");
        qc.invalidateQueries();
      },
      onError: () => toast.error("No se pudo actualizar."),
    },
  });

  const setStatus = (status: GetAdminApplicationsStatus) =>
    update.mutate({ id: application.id, data: { status } });

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                {application.name}
              </h3>
              <Badge variant="outline">
                {TYPE_LABEL[application.type] ?? application.type}
              </Badge>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {application.aporte}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {application.phone}
              </span>
              {application.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {application.location}
                </span>
              )}
              <span>
                {new Date(application.createdAt).toLocaleDateString("es", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {application.services && (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap border-l-2 border-border pl-3">
            {application.services}
          </p>
        )}

        {application.audioPath && (
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary shrink-0" />
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio
              controls
              src={audioUrl(application.audioPath)}
              className="w-full h-9"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {application.status !== "reviewed" &&
            application.status !== "accepted" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={update.isPending}
                onClick={() => setStatus("reviewed")}
              >
                Marcar en revisión
              </Button>
            )}
          {application.status !== "accepted" && (
            <Button
              size="sm"
              disabled={update.isPending}
              onClick={() => setStatus("accepted")}
            >
              Aceptar
            </Button>
          )}
          {application.status !== "rejected" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={update.isPending}
              onClick={() => setStatus("rejected")}
            >
              Rechazar
            </Button>
          )}
          {application.status !== "pending" && (
            <Button
              size="sm"
              variant="outline"
              disabled={update.isPending}
              onClick={() => setStatus("pending")}
            >
              Devolver a pendiente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationList({ status }: { status: GetAdminApplicationsStatus }) {
  const { data, isLoading, error } = useGetAdminApplications({ status });

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
        No se pudieron cargar las postulaciones.
      </p>
    );
  }
  if (!data || data.applications.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No hay postulaciones en este estado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.applications.map((a) => (
        <ApplicationCard key={a.id} application={a} />
      ))}
    </div>
  );
}

export default function PostulacionesPage() {
  const [tab, setTab] = useState<GetAdminApplicationsStatus>("pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Postulaciones</h1>
        <p className="text-muted-foreground">
          Revisa quién quiere unirse al equipo como Resonador o Expansor.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as GetAdminApplicationsStatus)}
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
            {tab === t.value && <ApplicationList status={t.value} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
