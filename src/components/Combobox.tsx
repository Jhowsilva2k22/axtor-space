import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  presets: string[];
  placeholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
  className?: string;
  /** Texto curto pro grupo "Personalizado" (ex: "Usar badge personalizada"). */
  customLabel?: string;
  /** Se true, aplica slugify (lowercase, sem acento, hifens) ao confirmar. */
  slugify?: boolean;
};

/**
 * Hybrid input: pick a preset with one click OR type a custom value.
 * Used to standardize fields like badges, UTM params and footer text.
 */
export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  presets,
  placeholder = "Selecione ou digite...",
  emptyText = "Nada encontrado.",
  allowCustom = true,
  className,
  customLabel,
  slugify: shouldSlugify = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

  const handleSelect = (val: string) => {
    onChange(shouldSlugify && val ? toSlug(val) : val);
    setOpen(false);
    setQuery("");
  };

  const trimmed = query.trim();
  const showCustomOption =
    allowCustom &&
    trimmed.length > 0 &&
    !presets.some((p) => p.toLowerCase() === trimmed.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between rounded-sm border-gold bg-input font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate text-left">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter>
          <CommandInput
            placeholder={allowCustom ? "Buscar ou digitar novo..." : "Buscar..."}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {value && !presets.includes(value) && (
              <CommandGroup heading="Atual">
                <CommandItem value={value} onSelect={() => handleSelect(value)}>
                  <Check className="mr-2 h-4 w-4 opacity-100" />
                  <span className="truncate">{value}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    custom
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Sugestões">
              {presets.map((p) => (
                <CommandItem key={p} value={p} onSelect={() => handleSelect(p)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{p}</span>
                </CommandItem>
              ))}
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => handleSelect("")}
                  className="text-muted-foreground"
                >
                  <span className="ml-6 text-[11px] uppercase tracking-[0.2em]">
                    Limpar
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
            {showCustomOption && (
              <CommandGroup heading={customLabel ?? "Personalizado"}>
                <CommandItem value={`__custom__${trimmed}`} onSelect={() => handleSelect(trimmed)}>
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Usar "<span className="font-medium">{trimmed}</span>"
                  {shouldSlugify && toSlug(trimmed) !== trimmed && (
                    <span className="ml-auto text-[10px] text-amber-500">→ {toSlug(trimmed)}</span>
                  )}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;