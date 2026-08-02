"use client";
import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  search?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  disabled = false,
  className,
  triggerClassName,
  clearable = false,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined);

  React.useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const lower = query.trim().toLowerCase();
  const filtered = lower
    ? options.filter((o) => {
        const haystack = (o.search ?? o.label).toLowerCase();
        return haystack.includes(lower);
      })
    : options;

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onValueChange("");
              }}
              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </span>
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md"
            style={{ width: triggerWidth ? `${triggerWidth}px` : "100%" }}
          >
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
                    {filtered.map((o) => (
                      <CommandItem
                        key={o.value}
                        value={o.value}
                        disabled={o.disabled}
                        onSelect={() => {
                          onValueChange(o.value);
                          setOpen(false);
                        }}
                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {o.value === value && <Check className="h-4 w-4" />}
                        </span>
                        <span className="truncate">{o.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        </>
      )}
    </div>
  );
}
