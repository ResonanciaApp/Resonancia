import { useGetAdminStats } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  Music,
  Clock,
  PlayCircle,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function formatNumber(n: number) {
  return new Intl.NumberFormat("es").format(n);
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-destructive">
        No se pudieron cargar las estadísticas.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Panel de control</h1>
        <p className="text-muted-foreground">Estadísticas globales de la app.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Usuarios totales"
          value={formatNumber(data.totalUsers)}
          icon={Users}
        />
        <StatCard
          label="Creadores activos"
          value={formatNumber(data.activeCreators)}
          icon={UserCheck}
        />
        <StatCard
          label="Sesiones publicadas"
          value={formatNumber(data.publishedSessions)}
          icon={Music}
        />
        <StatCard
          label="Reproducciones"
          value={formatNumber(data.totalPlays)}
          icon={PlayCircle}
        />
        <StatCard
          label="Minutos escuchados"
          value={formatNumber(data.totalMinutes)}
          icon={Clock}
        />
        <StatCard
          label="Pendientes de revisión"
          value={formatNumber(data.pendingSubmissions)}
          icon={ShieldAlert}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reproducciones por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {data.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin datos de reproducción todavía.
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.categoryBreakdown}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="categoryLabel"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar
                    dataKey="plays"
                    name="Reproducciones"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contenido más escuchado</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin reproducciones registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sesión</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Reproducciones</TableHead>
                  <TableHead className="text-right">Minutos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSessions.map((s) => (
                  <TableRow key={s.sessionId}>
                    <TableCell className="font-medium">
                      {s.title ?? s.sessionId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.categoryLabel ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(s.plays)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(s.minutes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
