import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminDailyQuotes,
  getListAdminDailyQuotesQueryKey,
  useCreateAdminDailyQuote,
  useGetAdminCurrentDailyQuote,
  getGetAdminCurrentDailyQuoteQueryKey,
  useGetAdminDailyQuoteHistory,
  getGetAdminDailyQuoteHistoryQueryKey,
  useUpdateAdminDailyQuote,
  useDeleteAdminDailyQuote,
  useToggleAdminDailyQuote,
  useGetAdminDailyQuoteSettings,
  getGetAdminDailyQuoteSettingsQueryKey,
  useUpdateAdminDailyQuoteSettings,
  AdminDailyQuote,
  DailyQuoteDecoration,
  DailyQuotePalette,
} from "@workspace/api-client-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Quote as QuoteIcon,
  Calendar,
  History,
  Palette,
  Shapes,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  text: z.string().trim().min(1, "El texto no puede estar vacío").max(1000, "Máximo 1000 caracteres"),
  author: z.string().trim().min(1, "El autor no puede estar vacío").max(120, "Máximo 120 caracteres"),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const DAILY_QUOTE_PALETTES: Array<{
  id: DailyQuotePalette;
  name: string;
  description: string;
  colors: [string, string];
}> = [
  { id: "jade", name: "Jade dorado", description: "Verde profundo y oro cálido", colors: ["#073C3B", "#987044"] },
  { id: "violet", name: "Violeta nocturno", description: "Índigo oscuro y amatista", colors: ["#17132D", "#65417E"] },
  { id: "ocean", name: "Océano premium", description: "Azul medianoche y petróleo", colors: ["#061A32", "#236174"] },
  { id: "ruby", name: "Rubí sereno", description: "Vino oscuro y rosa mineral", colors: ["#280711", "#81425B"] },
  { id: "amber", name: "Ámbar profundo", description: "Chocolate oscuro y cobre", colors: ["#271307", "#94642E"] },
  { id: "original", name: "Original", description: "Violeta y coral del fondo anterior", colors: ["#4A285F", "#A85F62"] },
];

const DAILY_QUOTE_DECORATIONS: Array<{
  id: DailyQuoteDecoration;
  name: string;
  description: string;
}> = [
  { id: "circles", name: "Círculos", description: "Composición original" },
  { id: "vesica", name: "Vesica Piscis", description: "Dos círculos entrelazados" },
  { id: "seed", name: "Semilla de la Vida", description: "Siete círculos armónicos" },
  { id: "flower", name: "Flor de la Vida", description: "Trama sagrada ligera" },
  { id: "metatron", name: "Cubo de Metatrón", description: "Red geométrica simplificada" },
];

const HEX_POINTS = [
  [80, 18], [124, 43], [124, 93], [80, 118], [36, 93], [36, 43],
] as const;

function DecorationPreview({ id }: { id: DailyQuoteDecoration }) {
  const common = { fill: "none", stroke: "rgba(255,255,255,0.42)", strokeWidth: 1.2 };
  const seedCenters = [
    [80, 68], [80, 42], [102, 55], [102, 81], [80, 94], [58, 81], [58, 55],
  ] as const;
  const flowerCenters = [
    ...seedCenters,
    [80, 16], [124, 42], [124, 94], [80, 120], [36, 94], [36, 42],
  ] as const;

  const motifs: Record<
    Exclude<DailyQuoteDecoration, "circles">,
    readonly [
      Exclude<DailyQuoteDecoration, "circles">,
      Exclude<DailyQuoteDecoration, "circles">,
      Exclude<DailyQuoteDecoration, "circles">,
    ]
  > = {
    vesica: ["vesica", "metatron", "seed"],
    seed: ["seed", "metatron", "vesica"],
    flower: ["flower", "metatron", "vesica"],
    metatron: ["metatron", "seed", "vesica"],
  };

  const renderMotif = (
    motif: Exclude<DailyQuoteDecoration, "circles">,
    key: string,
    transform: string,
    opacity: number,
  ) => (
    <g key={key} transform={transform} opacity={opacity} {...common}>
      {motif === "vesica" && (
        <>
          <circle cx="68" cy="66" r="42" />
          <circle cx="94" cy="66" r="42" />
          <circle cx="81" cy="66" r="55" opacity="0.42" />
        </>
      )}
      {motif === "seed" && seedCenters.map(([cx, cy]) => (
        <circle key={`${key}-${cx}-${cy}`} cx={cx} cy={cy} r="26" />
      ))}
      {motif === "flower" && flowerCenters.map(([cx, cy]) => (
        <circle key={`${key}-${cx}-${cy}`} cx={cx} cy={cy} r="26" />
      ))}
      {motif === "metatron" && (
        <>
          <circle cx="80" cy="68" r="9" />
          {HEX_POINTS.map(([x, y], index) => (
            <g key={`${key}-${x}-${y}`}>
              <circle cx={x} cy={y} r="9" />
              <line x1="80" y1="68" x2={x} y2={y} />
              <line x1={x} y1={y} x2={HEX_POINTS[(index + 2) % HEX_POINTS.length][0]} y2={HEX_POINTS[(index + 2) % HEX_POINTS.length][1]} />
            </g>
          ))}
          <circle cx="80" cy="68" r="51" opacity="0.55" />
        </>
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 160 136" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {id === "circles" && (
        <>
          <circle cx="126" cy="16" r="59" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" />
          <circle cx="101" cy="117" r="28" fill="rgba(255,220,218,0.09)" />
          <circle cx="8" cy="126" r="40" fill="rgba(245,225,255,0.06)" />
        </>
      )}
      {id !== "circles" && (
        <>
          {renderMotif(motifs[id][0], "large", "translate(70 -54) scale(0.86)", 0.88)}
          {renderMotif(motifs[id][1], "small", "translate(54 63) scale(0.42)", 0.72)}
          {renderMotif(motifs[id][2], "soft", "translate(-50 56) scale(0.58)", 0.56)}
        </>
      )}
    </svg>
  );
}

export default function FraseDelDiaPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<AdminDailyQuote | null>(null);

  // Queries
  const { data: currentQuote, isLoading: isLoadingCurrent, isError: isErrorCurrent } = useGetAdminCurrentDailyQuote({
    query: {
      queryKey: getGetAdminCurrentDailyQuoteQueryKey(),
    },
  });

  const { data: history, isLoading: isLoadingHistory, isError: isErrorHistory } = useGetAdminDailyQuoteHistory(
    { limit: 7 },
    {
      query: {
        queryKey: getGetAdminDailyQuoteHistoryQueryKey({ limit: 7 }),
      },
    }
  );
  const {
    data: quoteSettings,
    isLoading: isLoadingSettings,
    isError: isErrorSettings,
  } = useGetAdminDailyQuoteSettings({
    query: {
      queryKey: getGetAdminDailyQuoteSettingsQueryKey(),
    },
  });

  const { data: poolData, isLoading: isLoadingPool, isError: isErrorPool } = useListAdminDailyQuotes(
    {}, // Fetch all items to apply filters client-side
    {
      query: {
        queryKey: getListAdminDailyQuotesQueryKey({}),
        placeholderData: (prev) => prev,
      },
    }
  );

  const filteredQuotes = poolData?.quotes.filter(quote => {
    // 1. Text/Author search
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = !lowerSearch || quote.text.toLowerCase().includes(lowerSearch) || quote.author.toLowerCase().includes(lowerSearch);
    
    // 2. Author filter
    const matchesAuthor = authorFilter === "all" || quote.author === authorFilter;

    // 3. Active filter
    const matchesActive = activeFilter === "all" || 
                          (activeFilter === "active" && quote.active) || 
                          (activeFilter === "inactive" && !quote.active);

    return matchesSearch && matchesAuthor && matchesActive;
  });

  const uniqueAuthors = poolData 
    ? Array.from(new Set(poolData.quotes.map(q => q.author))).sort()
    : [];

  // Mutations
  const createQuote = useCreateAdminDailyQuote();
  const updateQuote = useUpdateAdminDailyQuote();
  const deleteQuote = useDeleteAdminDailyQuote();
  const toggleQuote = useToggleAdminDailyQuote();
  const updateQuoteSettings = useUpdateAdminDailyQuoteSettings();

  const createForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      author: "",
      active: true,
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      author: "",
      active: true,
    },
  });

  const openEdit = (quote: AdminDailyQuote) => {
    setSelectedQuote(quote);
    editForm.reset({
      text: quote.text,
      author: quote.author,
      active: quote.active,
    });
    setIsEditOpen(true);
  };

  const openDelete = (quote: AdminDailyQuote) => {
    setSelectedQuote(quote);
    setIsDeleteOpen(true);
  };

  const onCreateSubmit = (values: FormValues) => {
    createQuote.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success("Frase creada exitosamente");
          setIsCreateOpen(false);
          createForm.reset();
          queryClient.invalidateQueries({ queryKey: getListAdminDailyQuotesQueryKey() });
        },
        onError: () => toast.error("Error al crear la frase"),
      }
    );
  };

  const onEditSubmit = (values: FormValues) => {
    if (!selectedQuote) return;
    updateQuote.mutate(
      { id: selectedQuote.id, data: values },
      {
        onSuccess: () => {
          toast.success("Frase actualizada exitosamente");
          setIsEditOpen(false);
          setSelectedQuote(null);
          queryClient.invalidateQueries({ queryKey: getListAdminDailyQuotesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminCurrentDailyQuoteQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminDailyQuoteHistoryQueryKey() });
        },
        onError: () => toast.error("Error al actualizar la frase"),
      }
    );
  };

  const onDeleteConfirm = () => {
    if (!selectedQuote) return;
    deleteQuote.mutate(
      { id: selectedQuote.id },
      {
        onSuccess: () => {
          toast.success("Frase eliminada exitosamente");
          setIsDeleteOpen(false);
          setSelectedQuote(null);
          queryClient.invalidateQueries({ queryKey: getListAdminDailyQuotesQueryKey() });
        },
        onError: () => toast.error("Error al eliminar la frase"),
      }
    );
  };

  const handleToggle = (quote: AdminDailyQuote) => {
    toggleQuote.mutate(
      { id: quote.id },
      {
        onSuccess: (data) => {
          toast.success(`Frase ${data.active ? "activada" : "desactivada"}`);
          queryClient.invalidateQueries({ queryKey: getListAdminDailyQuotesQueryKey() });
        },
        onError: () => toast.error("Error al cambiar el estado de la frase"),
      }
    );
  };

  const handlePaletteChange = (paletteId: DailyQuotePalette) => {
    if (paletteId === quoteSettings?.paletteId || updateQuoteSettings.isPending) return;
    updateQuoteSettings.mutate(
      { data: { paletteId } },
      {
        onSuccess: (settings) => {
          queryClient.setQueryData(getGetAdminDailyQuoteSettingsQueryKey(), settings);
          toast.success("Fondo de la Frase del día actualizado");
        },
        onError: () => toast.error("No se pudo actualizar el fondo"),
      },
    );
  };

  const handleDecorationChange = (decorationId: DailyQuoteDecoration) => {
    if (decorationId === quoteSettings?.decorationId || updateQuoteSettings.isPending) return;
    updateQuoteSettings.mutate(
      { data: { decorationId } },
      {
        onSuccess: (settings) => {
          queryClient.setQueryData(getGetAdminDailyQuoteSettingsQueryKey(), settings);
          toast.success("Geometría de la Frase del día actualizada");
        },
        onError: () => toast.error("No se pudo actualizar la geometría"),
      },
    );
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Frase del día</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra el pool de frases de reflexión diaria y revisa el historial de publicaciones.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/20 bg-card/50">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Fondo de la Frase del día</CardTitle>
          </div>
          <CardDescription>
            Selecciona el degradado premium que se mostrará detrás de la frase en la app.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingSettings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {DAILY_QUOTE_PALETTES.map((palette) => (
                <div key={palette.id} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : isErrorSettings ? (
            <p className="text-sm text-destructive">No se pudieron cargar las paletas.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {DAILY_QUOTE_PALETTES.map((palette) => {
                const selected = quoteSettings?.paletteId === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => handlePaletteChange(palette.id)}
                    disabled={updateQuoteSettings.isPending}
                    aria-pressed={selected}
                    className={`relative overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      selected
                        ? "border-primary ring-2 ring-primary/35"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    data-testid={`palette-${palette.id}`}
                  >
                    <div
                      className="h-20 px-3 py-3 flex items-end"
                      style={{ backgroundImage: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})` }}
                    >
                      {selected && (
                        <Badge className="bg-white/90 text-slate-950 hover:bg-white/90">
                          Seleccionado
                        </Badge>
                      )}
                    </div>
                    <div className="bg-card px-3 py-2.5">
                      <p className="text-sm font-semibold text-foreground">{palette.name}</p>
                      <p className="text-[11px] leading-4 text-muted-foreground">{palette.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/20 bg-card/50">
          <div className="flex items-center gap-2">
            <Shapes className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Geometría de la Frase del día</CardTitle>
          </div>
          <CardDescription>
            Selecciona la decoración sutil que aparecerá sobre el degradado en la app.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingSettings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {DAILY_QUOTE_DECORATIONS.map((decoration) => (
                <div key={decoration.id} className="h-36 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : isErrorSettings ? (
            <p className="text-sm text-destructive">No se pudieron cargar las geometrías.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {DAILY_QUOTE_DECORATIONS.map((decoration) => {
                const selected = quoteSettings?.decorationId === decoration.id;
                const palette = DAILY_QUOTE_PALETTES.find((item) => item.id === quoteSettings?.paletteId)
                  ?? DAILY_QUOTE_PALETTES[0];
                return (
                  <button
                    key={decoration.id}
                    type="button"
                    onClick={() => handleDecorationChange(decoration.id)}
                    disabled={updateQuoteSettings.isPending}
                    aria-pressed={selected}
                    className={`overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      selected
                        ? "border-primary ring-2 ring-primary/35"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    data-testid={`decoration-${decoration.id}`}
                  >
                    <div
                      className="relative h-24 overflow-hidden"
                      style={{ backgroundImage: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})` }}
                    >
                      <DecorationPreview id={decoration.id} />
                      {selected && (
                        <Badge className="absolute left-2 top-2 bg-white/90 text-slate-950 hover:bg-white/90">
                          Seleccionado
                        </Badge>
                      )}
                    </div>
                    <div className="bg-card px-3 py-2.5">
                      <p className="text-sm font-semibold text-foreground">{decoration.name}</p>
                      <p className="text-[11px] leading-4 text-muted-foreground">{decoration.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Quote */}
        <Card className="flex flex-col border-border/50 hover-elevate shadow-sm">
          <CardHeader className="pb-3 border-b border-border/20 bg-card/50">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Calendar className="w-5 h-5" />
              <CardTitle className="text-base">Frase actual</CardTitle>
            </div>
            <CardDescription>
              {currentQuote ? (
                <span>Ciclo actual: {currentQuote.cycle}</span>
              ) : (
                "Ninguna frase asignada para hoy"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-center">
            {isLoadingCurrent ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : isErrorCurrent ? (
              <div className="text-destructive text-sm text-center">
                Error al cargar la frase actual.
              </div>
            ) : currentQuote ? (
              <div className="space-y-4">
                <blockquote className="border-l-4 border-primary/50 pl-4 italic text-foreground text-lg">
                  "{currentQuote.text}"
                </blockquote>
                <p className="text-sm text-muted-foreground font-medium flex items-center justify-end">
                  — {currentQuote.author}
                </p>
                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/20 text-right">
                  Asignada el {format(parseISO(currentQuote.assignedAt), "d 'de' MMMM", { locale: es })}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm text-center italic">
                El sistema no tiene una frase publicada para hoy. Verifica que haya frases activas en el pool.
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card className="flex flex-col border-border/50 hover-elevate shadow-sm">
          <CardHeader className="pb-3 border-b border-border/20 bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-secondary-foreground font-medium">
                <History className="w-5 h-5" />
                <CardTitle className="text-base">Historial reciente</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 p-0">
            {isLoadingHistory ? (
              <div className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              </div>
            ) : isErrorHistory ? (
              <div className="p-6 text-center text-sm text-destructive">
                Error al cargar el historial.
              </div>
            ) : history && history.length > 0 ? (
              <div className="divide-y divide-border/20">
                {history.map((h, i) => (
                  <div key={`${h.date}-${i}`} className="p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(parseISO(h.date), "dd/MM/yyyy")}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground/60 border border-border/40 px-1.5 py-0.5 rounded-sm">
                        Ciclo {h.cycle}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 text-foreground mb-1">"{h.text}"</p>
                    <p className="text-xs text-muted-foreground">— {h.author}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground italic">
                No hay historial reciente.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pool Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <QuoteIcon className="w-5 h-5 text-primary" />
                Pool de Frases
              </CardTitle>
              <CardDescription>
                {poolData ? (
                  <>
                    <span className="font-medium text-foreground">{poolData.activeCount} activas</span> de {poolData.total} en total
                    {filteredQuotes && filteredQuotes.length !== poolData.total && (
                       <span className="ml-1 text-muted-foreground">({filteredQuotes.length} resultados)</span>
                    )}
                  </>
                ) : (
                  "Cargando..."
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full md:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por texto o autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-quotes"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger className="h-9" data-testid="select-author">
                    <SelectValue placeholder="Todos los autores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los autores</SelectItem>
                    {uniqueAuthors.map(author => (
                      <SelectItem key={author} value={author}>{author}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-40">
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="h-9" data-testid="select-active-status">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="inactive">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className="h-9 whitespace-nowrap"
                data-testid="button-create-quote"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva frase
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/20 text-muted-foreground border-y border-border/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Frase</th>
                  <th className="px-6 py-3 font-medium">Autor</th>
                  <th className="px-6 py-3 font-medium">Actualizada</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoadingPool ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-card">
                      <td className="px-6 py-4"><div className="w-8 h-4 bg-muted rounded"></div></td>
                      <td className="px-6 py-4"><div className="w-48 h-4 bg-muted rounded"></div></td>
                      <td className="px-6 py-4"><div className="w-24 h-4 bg-muted rounded"></div></td>
                      <td className="px-6 py-4"><div className="w-20 h-4 bg-muted rounded"></div></td>
                      <td className="px-6 py-4"><div className="w-16 h-6 bg-muted rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : isErrorPool ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-destructive">
                      Error al cargar las frases. Por favor, intenta nuevamente.
                    </td>
                  </tr>
                ) : filteredQuotes && filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="bg-card hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={quote.active}
                            onCheckedChange={() => handleToggle(quote)}
                            disabled={toggleQuote.isPending && toggleQuote.variables?.id === quote.id}
                            className="scale-90"
                            data-testid={`switch-active-${quote.id}`}
                          />
                          {quote.active ? (
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Activa</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground border-border/40">Inactiva</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="line-clamp-2 text-foreground">"{quote.text}"</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground font-medium">{quote.author}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(quote.updatedAt), "dd/MM/yy HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => openEdit(quote)}
                            data-testid={`button-edit-${quote.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => openDelete(quote)}
                            data-testid={`button-delete-${quote.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron frases.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nueva Frase</DialogTitle>
            <DialogDescription>
              Añade una nueva frase al pool. Puede estar inactiva si no quieres que aparezca aún.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
              <FormField
                control={createForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de la frase</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. El que mucho abarca, poco aprieta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Refrán popular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activa</FormLabel>
                      <CardDescription>
                        Si está activa, el sistema puede seleccionarla para la rotación diaria.
                      </CardDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createQuote.isPending} data-testid="button-submit-create">
                  {createQuote.isPending ? "Guardando..." : "Crear frase"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Frase</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la frase. Rev {selectedQuote?.revision}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
              <FormField
                control={editForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de la frase</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. El que mucho abarca, poco aprieta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Refrán popular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activa</FormLabel>
                      <CardDescription>
                        Si está activa, el sistema puede seleccionarla para la rotación diaria.
                      </CardDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateQuote.isPending} data-testid="button-submit-edit">
                  {updateQuote.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar frase?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La frase se borrará del pool permanentemente. Si fue utilizada en el pasado, su historial se mantendrá intacto pero la frase en sí desaparecerá de esta lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 border rounded-md bg-muted/20">
            <p className="text-sm italic">"{selectedQuote?.text}"</p>
            <p className="text-xs text-muted-foreground mt-1">— {selectedQuote?.author}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                onDeleteConfirm();
              }}
              disabled={deleteQuote.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteQuote.isPending ? "Eliminando..." : "Eliminar frase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
