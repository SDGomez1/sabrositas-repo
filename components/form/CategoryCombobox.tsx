"use client";

import { useState } from "react";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown, Minus, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

export default function CategoryCombobox({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: Array<{ _id: string; name: string; priceCents: number }>;
  onAdd: (
    item: { _id: string; name: string; priceCents: number },
    qty: number,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    _id: string;
    name: string;
    priceCents: number;
  } | null>(null);
  const [qty, setQty] = useState(1);

  // when parent bumps key (unmount/mount), state resets automatically

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full max-w-80 justify-between"
            >
              {selected ? selected.name : `Buscar ${title.toLowerCase()}...`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                <CommandGroup heading={title}>
                  {items.map((p) => (
                    <CommandItem
                      key={p._id}
                      value={p.name}
                      keywords={[p.name]}
                      onSelect={() => {
                        setSelected(p);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected?._id === p._id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex w-full items-center justify-between">
                        <span className="truncate">{p.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ${p.priceCents}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            title="Menos"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            className="w-16 text-center"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          />
          <Button
            onClick={() => selected && onAdd(selected, qty)}
            disabled={!selected}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
