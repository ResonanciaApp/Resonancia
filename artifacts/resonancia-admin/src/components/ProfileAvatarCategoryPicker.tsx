import { Tag } from "lucide-react";
import type { ProfileAvatarCategory } from "@workspace/api-client-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  label: string;
  categories: ProfileAvatarCategory[];
  categoryIds: string[];
  disabled: boolean;
  onToggle: (categoryId: string, add: boolean) => void;
};

export function ProfileAvatarCategoryPicker({ label, categories, categoryIds, disabled, onToggle }: Props) {
  const assigned = categories.filter(item => categoryIds.includes(item.id));
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled || categories.length === 0}
        aria-label={`Categorías de ${label}`}
        title={assigned.length ? assigned.map(item => item.name).join(", ") : "Sin categoría"}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Tag className="h-4 w-4" />
        {assigned.length > 0 && <span>{assigned.length}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="px-1 pb-2 text-xs text-muted-foreground">Categorías de {label}</p>
        {categories.map(category => {
          const checked = categoryIds.includes(category.id);
          return (
            <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-secondary/50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={checked}
                disabled={disabled}
                onChange={event => onToggle(category.id, event.target.checked)}
              />
              {category.name}
            </label>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
