import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  ArrowUp,
  ArrowDown,
  Info,
  Plus,
  Pen,
  AlertCircle,
  Heart,
  Sprout,
  Triangle,
  Flower2,
  Sun,
  Brain,
  Star,
  Lightbulb,
  Leaf,
  Compass,
  User,
  HandHeart,
  Eye,
  Droplet
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  "cards-heart": Heart,
  "sprout": Sprout,
  "triangle": Triangle,
  "flower-tulip": Flower2,
  "white-balance-sunny": Sun,
  "brain": Brain,
  "heart-outline": Heart,
  "star-outline": Star,
  "lightbulb-outline": Lightbulb,
  "leaf": Leaf,
  "compass-outline": Compass,
  "weather-sunny": Sun,
  "meditation": User,
  "hand-heart": HandHeart,
  "eye-outline": Eye,
  "water-outline": Droplet,
};
import {
  useListReflectionCategories,
  getListReflectionCategoriesQueryKey,
  useCreateAdminReflectionCategory,
  useUpdateAdminReflectionCategory,
  useReorderAdminReflectionCategories,
} from "@workspace/api-client-react";
import type {
  ReflectionCategoryConfig,
  ReflectionIconOption,
} from "@workspace/api-client-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 40);
}

function IconRenderer({ name, className }: { name: string; className?: string }) {
  const IconComp = ICON_MAP[name];

  if (!IconComp) {
    return <span className={`text-[10px] font-mono truncate ${className}`}>{name}</span>;
  }

  return <IconComp className={className} />;
}

function IconSelector({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReflectionIconOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card text-foreground"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <IconRenderer name={value} className="w-4 h-4" />
              <span className="truncate">{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground font-normal">Seleccionar ícono...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar ícono..." />
          <CommandList>
            <CommandEmpty>No se encontraron íconos.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={`${option.family}-${option.name}`}
                  value={option.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <IconRenderer name={option.name} className="w-4 h-4" />
                  <span className="truncate flex-1">{option.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {option.family}
                  </span>
                  <Check
                    className={`ml-2 h-4 w-4 ${
                      value === option.name ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CreateCategoryDialog({
  icons,
}: {
  icons: ReflectionIconOption[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [id, setId] = useState("");
  const [icon, setIcon] = useState("");
  const [isManualId, setIsManualId] = useState(false);

  const createMutation = useCreateAdminReflectionCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Categoría creada.");
        qc.invalidateQueries({ queryKey: getListReflectionCategoriesQueryKey() });
        setOpen(false);
        setLabel("");
        setId("");
        setIcon("");
        setIsManualId(false);
      },
      onError: (error: any) => {
        toast.error(error?.message || "No se pudo crear la categoría.");
      },
    },
  });

  // Auto-generate slug
  useEffect(() => {
    if (!isManualId) {
      setId(slugify(label));
    }
  }, [label, isManualId]);

  // Auto-suggest default icon
  useEffect(() => {
    if (open && icons.length > 0 && !icon) {
      setIcon(icons[0].name);
    }
  }, [open, icons, icon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !id.trim() || !icon.trim()) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    
    if (id.trim().length > 40 || label.trim().length > 40) {
      toast.error("El identificador y el nombre no pueden exceder 40 caracteres.");
      return;
    }

    createMutation.mutate({
      data: {
        id: id.trim(),
        label: label.trim(),
        icon,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setLabel("");
        setId("");
        setIcon("");
        setIsManualId(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear categoría de reflexión</DialogTitle>
            <DialogDescription>
              Agrega una nueva categoría para la sección "Mi viaje interior".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Nombre (Label)</Label>
              <Input
                id="label"
                value={label}
                maxLength={40}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (!isManualId) setId(slugify(e.target.value));
                }}
                placeholder="Ej. Familia y amigos"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="id">ID (Slug)</Label>
              <Input
                id="id"
                value={id}
                maxLength={40}
                onChange={(e) => {
                  setId(e.target.value);
                  setIsManualId(true);
                }}
                placeholder="familia-amigos"
              />
              <p className="text-xs text-muted-foreground">
                Debe ser único. Se usa en la URL y base de datos.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Ícono</Label>
              <IconSelector value={icon} onChange={setIcon} options={icons} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({
  category,
  icons,
}: {
  category: ReflectionCategoryConfig;
  icons: ReflectionIconOption[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [icon, setIcon] = useState(category.icon);

  const updateMutation = useUpdateAdminReflectionCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Categoría actualizada.");
        qc.invalidateQueries({ queryKey: getListReflectionCategoriesQueryKey() });
        setOpen(false);
      },
      onError: (error: any) => {
        toast.error(error?.message || "No se pudo actualizar.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !icon.trim()) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    
    if (label.trim().length > 40) {
      toast.error("El nombre no puede exceder 40 caracteres.");
      return;
    }

    updateMutation.mutate({
      id: category.id,
      data: {
        label: label.trim(),
        icon,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setLabel(category.label);
        setIcon(category.icon);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la categoría "{category.id}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`edit-label-${category.id}`}>Nombre (Label)</Label>
              <Input
                id={`edit-label-${category.id}`}
                value={label}
                maxLength={40}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ícono</Label>
              <IconSelector value={icon} onChange={setIcon} options={icons} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriasReflexionPage() {
  const qc = useQueryClient();
  const { data: catalog, isLoading, isError } = useListReflectionCategories({
    query: {
      queryKey: getListReflectionCategoriesQueryKey(),
    },
  });

  const updateMutation = useUpdateAdminReflectionCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Estado actualizado.");
        qc.invalidateQueries({ queryKey: getListReflectionCategoriesQueryKey() });
      },
      onError: () => {
        toast.error("No se pudo actualizar el estado.");
      },
    },
  });

  const reorderMutation = useReorderAdminReflectionCategories({
    mutation: {
      onSuccess: (updatedCatalog) => {
        // Optimistic update handled by invalidation or direct cache set
        qc.setQueryData(getListReflectionCategoriesQueryKey(), updatedCatalog);
      },
      onError: () => {
        toast.error("Error al reordenar.");
        qc.invalidateQueries({ queryKey: getListReflectionCategoriesQueryKey() });
      },
    },
  });

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({
      id,
      data: {
        active: !currentActive,
      },
    });
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    if (!catalog) return;
    const items = [...catalog.items];
    const currentIndex = items.findIndex((item) => item.id === id);
    
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === items.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    // Swap
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newIndex, 0, movedItem);

    // Update local cache optimistically
    qc.setQueryData(getListReflectionCategoriesQueryKey(), {
      ...catalog,
      items: items,
    });

    reorderMutation.mutate({
      data: {
        ids: items.map((item) => item.id),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !catalog) {
    return (
      <div className="p-8 text-center text-destructive flex flex-col items-center gap-3">
        <AlertCircle className="h-10 w-10" />
        <h2 className="text-lg font-semibold">Error al cargar categorías</h2>
        <p className="text-sm opacity-80">Por favor, intenta de nuevo más tarde.</p>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: getListReflectionCategoriesQueryKey() })}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { items, icons } = catalog;

  return (
    <div className="space-y-8 max-w-[900px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Categorías de Reflexión
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra las categorías que aparecen en la sección "Mi viaje interior".
          </p>
        </div>
        <CreateCategoryDialog icons={icons} />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Orden y visibilidad
          </CardTitle>
          <CardDescription>
            Usa las flechas para reordenar cómo aparecen las categorías en la app.
            Puedes desactivar categorías que no quieres que los usuarios vean actualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {items.map((category, index) => (
              <div
                key={category.id}
                className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/30 ${
                  !category.active ? "opacity-60 bg-muted/10" : "bg-card"
                }`}
              >
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => handleReorder(category.id, "up")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={index === items.length - 1 || reorderMutation.isPending}
                    onClick={() => handleReorder(category.id, "down")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: category.color || "hsl(var(--primary))" }}
                >
                  <IconRenderer name={category.icon} className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {category.label}
                    </h3>
                    {!category.active && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {category.id} • Ícono: {category.icon} ({category.iconFamily})
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <EditCategoryDialog category={category} icons={icons} />
                  
                  <div className="flex items-center gap-2 ml-2 pl-4 border-l border-border/50">
                    <Label htmlFor={`active-${category.id}`} className="text-xs font-medium cursor-pointer">
                      {category.active ? "Visible" : "Oculto"}
                    </Label>
                    <Switch
                      id={`active-${category.id}`}
                      checked={category.active}
                      onCheckedChange={() => handleToggleActive(category.id, category.active)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No hay categorías configuradas aún.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
