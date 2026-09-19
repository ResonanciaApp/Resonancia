import React, { useState, useMemo, useEffect } from "react";
import { useGetAdminInspirationWeek, getGetAdminInspirationWeekQueryKey } from "@workspace/api-client-react";
import { format, addWeeks, subWeeks, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarHeart, Settings, ChevronLeft, ChevronRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InspirationEditor } from "@/components/inspiracion/InspirationEditor";
import { InspirationSettingsDialog } from "@/components/inspiracion/InspirationSettingsDialog";
import { AdminInspirationWeek } from "@/components/inspiracion/types";
import { HeroOverrideEditor } from "@/components/inspiracion/HeroOverrideEditor";
import { HeroSessionSlidesEditor } from "@/components/inspiracion/HeroSessionSlidesEditor";

export default function InspiracionDiariaPage() {
  const [currentDate, setCurrentDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [isHeroOverrideDirty, setIsHeroOverrideDirty] = useState(false);
  const [isHeroSlidesDirty, setIsHeroSlidesDirty] = useState(false);
  const hasDateScopedDirty = isEditorDirty || isHeroOverrideDirty;
  const hasDirtyChanges = isEditorDirty || isHeroOverrideDirty || isHeroSlidesDirty;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasDirtyChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasDirtyChanges]);

  // Capturar clicks en enlaces (ej. sidebar)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasDirtyChanges) return;
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && !target.hasAttribute('target')) {
        if (target.pathname === window.location.pathname) return;
        if (!window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir?")) {
          e.preventDefault();
        } else {
          setIsEditorDirty(false);
          setIsHeroOverrideDirty(false);
          setIsHeroSlidesDirty(false);
        }
      }
    };
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [hasDirtyChanges]);

  const { data, isLoading, isError } = useGetAdminInspirationWeek(
    { date: currentDate },
    {
      query: {
        queryKey: getGetAdminInspirationWeekQueryKey({ date: currentDate }),
      }
    }
  );

  const weekData = data as unknown as AdminInspirationWeek | undefined;

  const handleNavigate = (newDateStr: string, action: () => void) => {
    if (hasDateScopedDirty) {
      if (!window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir?")) {
        return;
      }
    }
    action();
    setIsEditorDirty(false);
    setIsHeroOverrideDirty(false);
  };

  const handlePrevWeek = () => {
    handleNavigate(currentDate, () => {
      const d = parseISO(currentDate);
      setCurrentDate(format(subWeeks(d, 1), "yyyy-MM-dd"));
    });
  };

  const handleNextWeek = () => {
    handleNavigate(currentDate, () => {
      const d = parseISO(currentDate);
      setCurrentDate(format(addWeeks(d, 1), "yyyy-MM-dd"));
    });
  };

  const handleToday = () => {
    handleNavigate(currentDate, () => {
      const today = format(new Date(), "yyyy-MM-dd");
      setCurrentDate(today);
      setSelectedDate(today);
    });
  };

  const selectedDayData = useMemo(() => {
    return weekData?.days?.find(d => d.date === selectedDate);
  }, [weekData, selectedDate]);

  const onSelectDate = (dateStr: string) => {
    if (dateStr === selectedDate) return;
    handleNavigate(dateStr, () => {
      setSelectedDate(dateStr);
    });
  };

  if (isLoading && !weekData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Error al cargar la semana</h2>
        <Button onClick={() => window.location.reload()}>Recargar página</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarHeart className="w-6 h-6 text-primary" />
            Sabiduría Diaria
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las frases, reflexiones e imágenes diarias.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Ajustes de sección
        </Button>
      </div>

      <div className="flex flex-col gap-6 min-h-0 overflow-auto">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        
        {/* Selector de Semana */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Semana
                </div>
                <div className="font-semibold text-foreground">
                  {weekData?.weekStart ? format(parseISO(weekData.weekStart), "d MMM yyyy", { locale: es }) : "..."}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            
            <Button variant="secondary" size="sm" onClick={handleToday} className="w-full">
              Volver a hoy
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {weekData?.days?.map((day) => {
                const isSelected = day.date === selectedDate;
                const dateObj = parseISO(day.date);
                const isToday = isSameDay(dateObj, new Date());
                const isPublished = day.inspiration?.published != null;
                const hasDraft = day.inspiration?.draft != null;

                return (
                  <button
                    key={day.date}
                    onClick={() => onSelectDate(day.date)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span className="capitalize">{format(dateObj, "EEEE d", { locale: es })}</span>
                        {isToday && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${isSelected ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"}`}>
                            Hoy
                          </span>
                        )}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {!hasDraft ? "Sin contenido" : isPublished ? "Publicado" : "Borrador"}
                      </div>
                    </div>
                    <div>
                      {isPublished ? (
                        <CheckCircle2 className={`w-5 h-5 ${isSelected ? "text-primary-foreground" : "text-emerald-500"}`} />
                      ) : hasDraft ? (
                        <Circle className={`w-5 h-5 ${isSelected ? "text-primary-foreground/50" : "text-amber-500"}`} />
                      ) : (
                        <Circle className={`w-5 h-5 ${isSelected ? "text-primary-foreground/30" : "text-muted-foreground/30"}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden min-h-[600px] lg:min-h-0">
          <InspirationEditor 
            key={selectedDate} // Force remount on date change to easily reset form
            date={selectedDate} 
            inspiration={selectedDayData?.inspiration || null}
            weekData={weekData}
            onDirtyChange={setIsEditorDirty}
            onSaved={(savedDate) => {
              if (savedDate !== selectedDate) {
                setSelectedDate(savedDate);
                setCurrentDate(savedDate);
              }
              setIsEditorDirty(false);
            }}
          />
        </div>
        </div>

        <HeroOverrideEditor
          key={`hero-${selectedDate}`}
          date={selectedDate}
          weekData={weekData}
          onDirtyChange={setIsHeroOverrideDirty}
        />
        <HeroSessionSlidesEditor onDirtyChange={setIsHeroSlidesDirty} />
      </div>

      {showSettings && weekData?.settings && (
        <InspirationSettingsDialog 
          open={showSettings} 
          onOpenChange={setShowSettings}
          currentSettings={weekData.settings}
          currentWeekStart={weekData.weekStart}
        />
      )}
    </div>
  );
}
