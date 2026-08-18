import { useRoute, useLocation } from "wouter";
import { useGetAdminSession, getGetAdminSessionQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import SessionForm from "@/components/SessionForm";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

export default function SesionEditarPage() {
  const [, params] = useRoute("/sesiones/:id/editar");
  const [, setLocation] = useLocation();
  const id = params?.id ?? "";

  const { data, isLoading, isError } = useGetAdminSession(id, {
    query: { queryKey: getGetAdminSessionQueryKey(id), enabled: !!id },
  });

  if (isLoading) return <Spinner />;

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4">
        <p className="text-muted-foreground">No se pudo cargar la sesión.</p>
        <Button variant="outline" onClick={() => setLocation("/sesiones")}>
          Volver a Sesiones
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setLocation("/sesiones")}>
        ← Volver a Sesiones
      </Button>
      <SessionForm mode="edit" initial={data} onSaved={() => setLocation("/sesiones")} />
    </div>
  );
}
