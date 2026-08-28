import { useState } from "react";
import {
  useGetCatalog,
  useCreateAdminCategory,
  useUpdateAdminCategory,
} from "@workspace/api-client-react";
import type {
  CatalogCategory,
  AdminCategoryInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FormState = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconFamily: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  isPrimary: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  id: "",
  title: "",
  subtitle: "",
  icon: "sparkles",
  iconFamily: "MaterialCommunityIcons",
  color: "#D4AF37",
  gradientStart: "#1B060F",
  gradientEnd: "#27070E",
  isPrimary: false,
  sortOrder: 0,
};

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}

function CreateDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const mutation = useCreateAdminCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Categoría creada.");
        qc.invalidateQueries();
        setOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () => toast.error("No se pudo crear (¿id duplicado o inválido?)."),
    },
  });

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    /^[a-z0-9-]+$/.test(form.id) &&
    form.title.trim() &&
    form.subtitle.trim() &&
    form.icon.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva categoría</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="ID (slug)"
            value={form.id}
            onChange={set("id")}
            placeholder="meditaciones-guiadas"
          />
          <Field label="Icono" value={form.icon} onChange={set("icon")} />
          <Field
            label="Familia del icono"
            value={form.iconFamily}
            onChange={set("iconFamily")}
            placeholder="MaterialCommunityIcons"
          />
          <Field
            label="Título"
            value={form.title}
            onChange={set("title")}
            className="col-span-2"
          />
          <Field
            label="Subtítulo"
            value={form.subtitle}
            onChange={set("subtitle")}
            className="col-span-2"
          />
          <Field label="Color" value={form.color} onChange={set("color")} />
          <Field
            label="Gradiente inicio"
            value={form.gradientStart}
            onChange={set("gradientStart")}
          />
          <Field
            label="Gradiente fin"
            value={form.gradientEnd}
            onChange={set("gradientEnd")}
          />
          <Field
            label="Orden"
            type="number"
            min={0}
            value={String(form.sortOrder)}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                sortOrder: Math.max(0, Number.parseInt(e.target.value, 10) || 0),
              }))
            }
          />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) =>
                setForm((current) => ({ ...current, isPrimary: e.target.checked }))
              }
            />
            Categoría principal
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!valid || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                data: {
                  ...form,
                  iconFamily: form.iconFamily.trim() || null,
                } as AdminCategoryInput,
              })
            }
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ category }: { category: CatalogCategory }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(category.title);
  const [subtitle, setSubtitle] = useState(category.subtitle);
  const [icon, setIcon] = useState(category.icon);
  const [iconFamily, setIconFamily] = useState(category.iconFamily ?? "");
  const [color, setColor] = useState(category.color);
  const [gradientStart, setGradientStart] = useState(category.gradientStart);
  const [gradientEnd, setGradientEnd] = useState(category.gradientEnd);
  const [isPrimary, setIsPrimary] = useState(category.isPrimary);
  const [sortOrder, setSortOrder] = useState(category.sortOrder);
  const mutation = useUpdateAdminCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Categoría actualizada.");
        qc.invalidateQueries();
        setOpen(false);
      },
      onError: () => toast.error("No se pudo actualizar."),
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar “{category.title}”</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field
            label="Subtítulo"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Icono"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <Field
              label="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <Field
              label="Familia del icono"
              value={iconFamily}
              onChange={(e) => setIconFamily(e.target.value)}
              placeholder="MaterialCommunityIcons"
            />
            <Field
              label="Orden"
              type="number"
              min={0}
              value={String(sortOrder)}
              onChange={(e) =>
                setSortOrder(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
              }
            />
            <Field
              label="Gradiente inicio"
              value={gradientStart}
              onChange={(e) => setGradientStart(e.target.value)}
            />
            <Field
              label="Gradiente fin"
              value={gradientEnd}
              onChange={(e) => setGradientEnd(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Categoría principal
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                id: category.id,
                data: {
                  title: title.trim(),
                  subtitle: subtitle.trim(),
                  icon: icon.trim(),
                  iconFamily: iconFamily.trim() || null,
                  color: color.trim(),
                  gradientStart: gradientStart.trim(),
                  gradientEnd: gradientEnd.trim(),
                  isPrimary,
                  sortOrder,
                },
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

export default function CategoriasPage() {
  const { data, isLoading, error } = useGetCatalog();
  const categories = data?.categories ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-muted-foreground">
            Organiza las categorías del catálogo.
          </p>
        </div>
        <CreateDialog />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <p className="text-destructive py-8 text-center">
          No se pudieron cargar las categorías.
        </p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          Aún no hay categorías.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base truncate">{c.title}</CardTitle>
                  {c.isPrimary && <Badge>Principal</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {c.subtitle}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {c.sessionCount} sesiones · orden {c.sortOrder} · {c.id}
                  </span>
                  <EditDialog category={c} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
