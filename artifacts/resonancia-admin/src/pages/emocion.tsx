import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminEmotionalPhrases,
  getGetAdminEmotionalPhrasesQueryKey,
  useUpdateAdminEmotionalPhrases,
  AdminEmotionalPhraseSet,
  EmotionalPhraseMoodId,
} from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AlertCircle, RefreshCw, Save, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

// Canonical order of emotions
const CANONICAL_MOODS: EmotionalPhraseMoodId[] = [
  "estresado",
  "ansioso",
  "cansado",
  "inepto",
  "triste",
  "solo",
  "deprimido",
  "desmotivado",
  "enojado",
  "adolorido",
  "agradecido",
  "emocionado",
  "lleno-de-amor",
  "feliz",
  "en-paz",
  "esperanzado",
  "contento",
  "presente",
];

const MOOD_EMOJIS: Record<EmotionalPhraseMoodId, string> = {
  estresado: "🥵",
  ansioso: "😬",
  cansado: "😪",
  inepto: "😑",
  triste: "😭",
  solo: "🥺",
  deprimido: "😔",
  desmotivado: "😪",
  enojado: "😤",
  adolorido: "😣",
  agradecido: "🙏",
  emocionado: "🤩",
  "lleno-de-amor": "🥰",
  feliz: "😊",
  "en-paz": "😌",
  esperanzado: "😇",
  contento: "🙂",
  presente: "🧘",
};

const phraseSchema = z.object({
  slot: z.number().min(1).max(7),
  text: z.string().trim().min(1, "La frase no puede estar vacía").max(500, "Máximo 500 caracteres"),
});

const formSchema = z.object({
  phrases: z.array(phraseSchema).length(7, "Deben ser exactamente 7 frases"),
});

type FormValues = z.infer<typeof formSchema>;

function getInitialPhrases(phrases: { slot: number; text: string }[] | undefined): { slot: number; text: string }[] {
  const result = [];
  for (let i = 1; i <= 7; i++) {
    const existing = phrases?.find((p) => p.slot === i);
    result.push({ slot: i, text: existing ? existing.text : "" });
  }
  return result;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}

function MoodCard({
  moodId,
  moodSet,
}: {
  moodId: EmotionalPhraseMoodId;
  moodSet?: AdminEmotionalPhraseSet;
}) {
  const queryClient = useQueryClient();
  const updatePhrases = useUpdateAdminEmotionalPhrases();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phrases: getInitialPhrases(moodSet?.phrases),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "phrases",
  });

  const currentRevision = useRef(moodSet?.revision ?? 0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  // Preserve edits: only reset if the revision from server is newer AND we are not dirty
  useEffect(() => {
    const newRevision = moodSet?.revision ?? 0;
    if (newRevision !== currentRevision.current) {
      if (!form.formState.isDirty) {
        form.reset({ phrases: getInitialPhrases(moodSet?.phrases) });
        currentRevision.current = newRevision;
        setServerError(null);
        setIsConflict(false);
      } else if (newRevision > currentRevision.current) {
        // The server has a newer revision, but we have dirty edits.
        // We'll let the user know they are editing a stale version if they try to save,
        // or we could show a warning right now. The prompt says "display validation and server errors including 409".
      }
    }
  }, [moodSet, form]);

  const mutateFnRef = useRef(updatePhrases.mutate);
  mutateFnRef.current = updatePhrases.mutate;

  const onSubmit = useCallback(
    (values: FormValues) => {
      setServerError(null);
      setIsConflict(false);

      const revision = currentRevision.current;

      mutateFnRef.current(
        {
          moodId,
          data: {
            revision,
            phrases: values.phrases.map((p, i) => ({ slot: i + 1, text: p.text })),
          },
        },
        {
          onSuccess: (data) => {
            toast.success(`Frases guardadas para ${capitalize(moodId)}`);
            // Reset form to clear dirty state with the newly saved data
            form.reset({ phrases: getInitialPhrases(data.phrases) });
            currentRevision.current = data.revision;
            
            // Invalidate to refetch all (preserves other dirty cards due to the useEffect logic)
            queryClient.invalidateQueries({
              queryKey: getGetAdminEmotionalPhrasesQueryKey(),
            });
          },
          onError: (err) => {
            const apiError = err as { status?: number; data?: unknown };
            const status = apiError.status;
            const errorData = apiError.data as { error?: string } | undefined;
            if (status === 409) {
              setIsConflict(true);
              setServerError("Alguien más actualizó estas frases. Recarga los datos para ver los cambios.");
              void queryClient.invalidateQueries({
                queryKey: getGetAdminEmotionalPhrasesQueryKey(),
              });
            } else {
              setServerError(errorData?.error || "Error al guardar las frases");
            }
          },
        }
      );
    },
    [moodId, form, queryClient]
  );

  const handleReload = () => {
    form.reset({ phrases: getInitialPhrases(moodSet?.phrases) });
    currentRevision.current = moodSet?.revision ?? 0;
    setServerError(null);
    setIsConflict(false);
  };

  const isPending = updatePhrases.isPending;

  return (
    <Card className="flex flex-col border-border/50 transition-all hover-elevate shadow-sm" data-testid={`card-mood-${moodId}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-serif text-primary" data-testid={`title-mood-${moodId}`}>
            <span aria-hidden="true">{MOOD_EMOJIS[moodId]}</span>
            <span>{capitalize(moodId)}</span>
          </CardTitle>
          <div className="text-xs text-muted-foreground/60 font-mono">
            Rev {moodSet?.revision ?? 0}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 items-start">
              <span>{serverError}</span>
              {isConflict && (
                <Button variant="outline" size="sm" onClick={handleReload} type="button" className="mt-1" data-testid={`button-reload-${moodId}`}>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Sobrescribir local con datos del servidor
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`form-${moodId}`}>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`phrases.${index}.text`}
                render={({ field: inputField }) => (
                  <FormItem className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground/40 w-4 text-right select-none">
                        {index + 1}.
                      </span>
                      <FormControl>
                        <Input 
                          {...inputField} 
                          placeholder={`Frase para la respiración ${index + 1}...`} 
                          disabled={isPending}
                          className="bg-background/50"
                          data-testid={`input-phrase-${moodId}-${index + 1}`}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-6 text-[10px]" />
                  </FormItem>
                )}
              />
            ))}
          </form>
        </Form>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border/20 bg-muted/10">
        <div className="flex w-full items-center justify-between">
          <div className="text-[10px] text-muted-foreground">
            {moodSet?.updatedAt ? (
              <>Última edición: {new Date(moodSet.updatedAt).toLocaleString("es")}</>
            ) : (
              <>Sin ediciones previas</>
            )}
          </div>
          <Button 
            type="submit" 
            form={`form-${moodId}`} 
            disabled={isPending || !form.formState.isDirty || isConflict}
            size="sm"
            className="w-24"
            data-testid={`button-save-${moodId}`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function EmocionPage() {
  const { data, isLoading, isError, refetch } = useGetAdminEmotionalPhrases({
    query: {
      queryKey: getGetAdminEmotionalPhrasesQueryKey(),
    },
  });

  const moodsMap = new Map<EmotionalPhraseMoodId, AdminEmotionalPhraseSet>();
  if (data?.moods) {
    for (const mood of data.moods) {
      moodsMap.set(mood.moodId, mood);
    }
  }

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Emoción</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las 7 frases de completitud para cada emoción de la brújula.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isLoading}
          data-testid="button-refetch-all"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Recargar todo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="loading-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-muted/20" />
              <CardContent className="h-[360px] bg-muted/10" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" data-testid="alert-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 items-start">
            No se pudieron cargar las frases emocionales.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {CANONICAL_MOODS.map((moodId) => (
            <MoodCard 
              key={moodId} 
              moodId={moodId} 
              moodSet={moodsMap.get(moodId)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
