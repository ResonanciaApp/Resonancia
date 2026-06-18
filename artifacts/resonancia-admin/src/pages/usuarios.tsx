import { useState } from "react";
import {
  useGetAdminUsers,
  useSetUserRole,
} from "@workspace/api-client-react";
import type {
  AdminUser,
  AdminUserRole,
  GetAdminUsersParams,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<AdminUserRole, string> = {
  user: "Usuario",
  creator: "Creador",
  admin: "Admin",
  expansor: "Expansor",
  resonador: "Resonador",
};

function RoleBadge({ role }: { role: AdminUserRole }) {
  const variant =
    role === "admin" ? "default"
    : role === "creator" ? "secondary"
    : role === "expansor" ? "secondary"
    : role === "resonador" ? "secondary"
    : "outline";
  return <Badge variant={variant}>{ROLE_LABEL[role]}</Badge>;
}

function RoleSelect({ user }: { user: AdminUser }) {
  const qc = useQueryClient();
  const mutation = useSetUserRole({
    mutation: {
      onSuccess: () => {
        toast.success(`Rol de ${user.displayName} actualizado.`);
        qc.invalidateQueries();
      },
      onError: () => toast.error("No se pudo cambiar el rol."),
    },
  });

  return (
    <Select
      value={user.role}
      onValueChange={(value) =>
        mutation.mutate({
          userId: user.id,
          data: { role: value as AdminUserRole },
        })
      }
      disabled={mutation.isPending}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">Usuario</SelectItem>
        <SelectItem value="creator">Creador</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="expansor">Expansor</SelectItem>
        <SelectItem value="resonador">Resonador</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | "all">("all");
  const [page, setPage] = useState(1);

  const params: GetAdminUsersParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(query ? { q: query } : {}),
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
  };

  const { data, isLoading, error } = useGetAdminUsers(params);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona cuentas y asigna roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {data ? `${data.total} usuarios` : "Usuarios"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(search.trim());
            }}
          >
            <Input
              placeholder="Buscar por nombre, usuario o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setPage(1);
                setRoleFilter(value as AdminUserRole | "all");
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="creator">Creador</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center">
              No se pudieron cargar los usuarios.
            </p>
          ) : !data || data.users.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No hay usuarios que coincidan.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Envíos</TableHead>
                      <TableHead>Rol actual</TableHead>
                      <TableHead className="text-right">Cambiar rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            @{u.username}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {u.submissionCount}
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <RoleSelect user={u} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  Página {data.page} de {totalPages}
                </span>
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
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
