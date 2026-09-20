import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminGreeting,
  getGetAdminGreetingQueryKey,
  useUpdateAdminGreeting,
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
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Clock, MessageSquare, AlertCircle } from "lucide-react";

const formSchema = z.object({
  enabled: z.boolean(),
  text: z.string().max(160, "El texto no puede exceder los 160 caracteres").optional(),
}).superRefine((value, context) => {
  if (value.enabled && !value.text?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["text"],
      message: "Escribe un saludo antes de activarlo",
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function SaludoInicioPage() {
  const queryClient = useQueryClient();

  const { data: greeting, isLoading, isError } = useGetAdminGreeting({
    query: {
      queryKey: getGetAdminGreetingQueryKey(),
    },
  });

  const updateGreeting = useUpdateAdminGreeting();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: false,
      text: "",
    },
  });

  const initializedRevision = useRef<number | null>(null);

  useEffect(() => {
    if (greeting && initializedRevision.current !== greeting.revision) {
      initializedRevision.current = greeting.revision;
      form.reset({
        enabled: greeting.enabled,
        text: greeting.text || "",
      });
    }
  }, [greeting, form]);

  const onSubmit = (values: FormValues) => {
    if (!greeting) return;

    updateGreeting.mutate(
      {
        data: {
          enabled: values.enabled,
          text: values.text?.trim() || null,
          revision: greeting.revision,
        },
      },
      {
        onSuccess: (updatedData) => {
          toast.success("Saludo actualizado exitosamente");
          // Update cache locally instead of invalidating to prevent refetch cascades
          queryClient.setQueryData(getGetAdminGreetingQueryKey(), updatedData);
          initializedRevision.current = updatedData.revision;
          form.reset({
            enabled: updatedData.enabled,
            text: updatedData.text || "",
          });
        },
        onError: (error: unknown) => {
          const status = typeof error === "object" && error !== null && "status" in error
            ? (error as { status?: unknown }).status
            : undefined;
          if (status === 409) {
            toast.error("Conflicto de versiones. Alguien más modificó el saludo. Recargando...");
            queryClient.invalidateQueries({ queryKey: getGetAdminGreetingQueryKey() });
          } else {
            toast.error("Error al actualizar el saludo");
          }
        },
      }
    );
  };

  const currentText = form.watch("text") || "";
  const isEnabled = form.watch("enabled");

  return (
    <div className="space-y-8 max-w-[800px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Saludo inicial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura el saludo de bienvenida que ven los usuarios al abrir la aplicación.
          </p>
        </div>
      </div>

      <Card className="border-border/50 bg-muted/10 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            Saludo automático por hora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Si el saludo personalizado está inactivo o vacío, la aplicación mostrará automáticamente un saludo basado en la hora local del dispositivo del usuario:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <li className="bg-card border border-border/50 rounded-md p-3 flex flex-col items-center text-center">
              <span className="font-semibold text-foreground mb-1">Buenos días</span>
              <span className="text-muted-foreground text-xs">06:00 - 11:59</span>
            </li>
            <li className="bg-card border border-border/50 rounded-md p-3 flex flex-col items-center text-center">
              <span className="font-semibold text-foreground mb-1">Buenas tardes</span>
              <span className="text-muted-foreground text-xs">12:00 - 18:59</span>
            </li>
            <li className="bg-card border border-border/50 rounded-md p-3 flex flex-col items-center text-center">
              <span className="font-semibold text-foreground mb-1">Buenas noches</span>
              <span className="text-muted-foreground text-xs">19:00 - 05:59</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Saludo personalizado (global)
          </CardTitle>
          <CardDescription>
            Actívalo para sobrescribir el saludo automático con un mensaje fijo para todos los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-24 bg-muted/50 rounded-lg w-full"></div>
              <div className="h-20 bg-muted/50 rounded-lg w-full"></div>
            </div>
          ) : isError ? (
            <div className="p-4 text-sm text-destructive flex items-start gap-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium">Ocurrió un error</p>
                <p className="mt-1 opacity-90">No se pudo cargar la configuración actual del saludo. Por favor, intenta de nuevo.</p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4 transition-colors ${field.value ? 'bg-primary/5 border-primary/20' : 'bg-card border-border/50'}`}>
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-foreground cursor-pointer">Activar saludo personalizado</FormLabel>
                        <CardDescription>
                          Si está activo, reemplazará los saludos de "Buenos días", "Buenas tardes" y "Buenas noches".
                        </CardDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Activar saludo personalizado"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className={`transition-opacity ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <FormLabel className="text-foreground">Texto del saludo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Bienvenido a tu espacio de calma"
                          {...field}
                          value={field.value || ""}
                          disabled={!isEnabled || updateGreeting.isPending}
                          className="bg-card h-12 text-base"
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1.5">
                        <FormMessage />
                        <span className={`text-xs transition-colors ${currentText.length > 160 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {currentText.length} / 160
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateGreeting.isPending || !form.formState.isDirty}
                    className="min-w-[140px]"
                  >
                    {updateGreeting.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
