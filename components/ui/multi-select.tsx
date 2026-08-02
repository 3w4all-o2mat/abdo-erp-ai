"use client";
import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  search?: string;
  disabled?: boolean;
};

export function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  disabled = false,
  className,
  triggerClassName,
  maxDisplay = 2,
}: {
  value: string[];
  onValueChange: (v: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  maxDisplay?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selectedLabels = React.useMemo(
    () => value.map((v) => options.find((o) => o.value === v)?.label).filter((l): l is string => Boolean(l)),
    [value, options],
  );

  const lower = query.trim().toLowerCase();
  const filtered = lower
    ? options.filter((o) => {
        const haystack = (o.search ?? o.label).toLowerCase();
        return haystack.includes(lower);
      })
    : options;

  function toggle(val: string) {
    if (value.includes(val)) onValueChange(value.filter((v) => v !== val));
    else onValueChange([...value, val]);
  }

  function clearAll() {
    onValueChange([]);
  }

  const triggerText = (() => {
    if (value.length === 0) return placeholder;
    if (selectedLabels.length <= maxDisplay) return selectedLabels.join(", ");
    const shown = selectedLabels.slice(0, maxDisplay).join(", ");
    return `${shown} +${value.length - maxDisplay}`;
  })();

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            triggerClassName,
          )}
        >
          <span className={cn("truncate text-left", value.length === 0 && "text-muted-foreground")}>
            {triggerText}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", className)} align="start">
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            autoFocus
            className="h-9 border-0 border-b rounded-none bg-transparent pl-2.5 placeholder:opacity-50 focus:ring-0 focus:outline-none outline-none"
          />
          <CommandList className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((o) => {
                  const isSelected = value.includes(o.value);
                  return (
                    <CommandItem
                      key={o.value}
                      value={o.value}
                      disabled={o.disabled}
                      onSelect={() => toggle(o.value)}
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
          {value.length > 0 && (
            <div className="flex items-center justify-between border-t px-2 py-1.5">
              <span className="text-xs text-muted-foreground">
                {value.length} sélectionné{value.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Tout effacer
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
