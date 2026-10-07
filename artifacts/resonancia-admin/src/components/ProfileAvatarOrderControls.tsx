import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  count: number;
  total: number;
  position: string;
  error: string | null;
  disabled: boolean;
  onPositionChange: (value: string) => void;
  onClear: () => void;
  onMove: () => void;
};

export function ProfileAvatarOrderControls({
  count, total, position, error, disabled, onPositionChange, onClear, onMove,
}: Props) {
  return (
    <div className="mb-4 space-y-2 rounded-lg border bg-secondary/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm" aria-live="polite">
          {count ? `${count} ${count === 1 ? "avatar seleccionado" : "avatares seleccionados"}` : "Selecciona avatares para moverlos juntos."}
        </p>
        {count > 0 && (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
              Limpiar selección
            </Button>
            <form className="flex flex-wrap items-center gap-2" onSubmit={event => {
              event.preventDefault();
              if (!disabled) onMove();
            }}>
              <label htmlFor="profile-avatar-position" className="text-sm">Mover a posición</label>
              <Input
                id="profile-avatar-position"
                inputMode="numeric"
                value={position}
                onChange={event => onPositionChange(event.target.value)}
                disabled={disabled}
                placeholder={`1–${total - count + 1}`}
                className="h-9 w-24"
                aria-invalid={!!error}
                aria-describedby={error ? "profile-avatar-position-error" : "profile-avatar-position-help"}
              />
              <Button type="submit" size="sm" disabled={disabled}>Mover</Button>
            </form>
            <p id="profile-avatar-position-help" className="w-full text-xs text-muted-foreground">
              Posición final del primer avatar: 1–{total - count + 1}. El bloque conserva el orden actual de la lista.
            </p>
          </>
        )}
      </div>
      {error && <p id="profile-avatar-position-error" role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
