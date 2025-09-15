// app/page.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Minus,
  ShoppingCart,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type CatKey = "arepas" | "jugos" | "cafes" | "gaseosas";

function centsToMoney(cents: number) {
  return cents 
}

const categories: { key: CatKey; label: string }[] = [
  { key: "arepas", label: "Arepas" },
  { key: "jugos", label: "Jugos" },
  { key: "cafes", label: "Cafés" },
  { key: "gaseosas", label: "Gaseosas" },
];

export default function Home() {
  const products = useQuery(api.products.listActiveByCategory, {});
  const createSale = useMutation(api.sales.createSale);

  const [anonymous, setAnonymous] = useState(false);
  const [phone, setPhone] = useState("");

  // cart: productId -> { name, priceCents, quantity }
  const [cart, setCart] = useState<
    Record<
      string,
      { id: string; name: string; priceCents: number; quantity: number }
    >
  >({});

  // used to reset all child comboboxes after submit
  const [formResetKey, setFormResetKey] = useState(0);

  const totalCents = useMemo(
    () =>
      Object.values(cart).reduce(
        (acc, it) => acc + it.priceCents * it.quantity,
        0
      ),
    [cart]
  );

  function addToCart(item: {
    id: string;
    name: string;
    priceCents: number;
    quantity?: number;
  }) {
    setCart((prev) => {
      const cur = prev[item.id];
      const quantity = (cur?.quantity ?? 0) + (item.quantity ?? 1);
      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          priceCents: item.priceCents,
          quantity,
        },
      };
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  async function submitSale() {
    if (!products) return;
    if (!anonymous && phone.trim() === "") {
      alert("Por favor ingresa teléfono o marca venta anónima.");
      return;
    }
    const items = Object.values(cart).map((it) => ({
      productId: it.id as any,
      quantity: it.quantity,
    }));
    if (items.length === 0) {
      alert("Agrega al menos un producto.");
      return;
    }
    try {
      const res = await createSale({
        anonymous,
        userPhone: anonymous ? undefined : phone.trim(),
        items,
      });
      alert(`¡Venta creada! Total: $${centsToMoney((res as any).totalCents)}`);

      // reset whole form
      setCart({});
      setPhone("");
      setAnonymous(false);
      // bump key so all CategoryCombobox components reset their internal state
      setFormResetKey((k) => k + 1);
    } catch (e: any) {
      alert(e.message || "Error creando la venta");
    }
  }

  if (!products) {
    return <div className="p-4">Cargando productos…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Registrar Venta</h1>

      <div className="flex gap-3 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Venta anónima
        </label>
        <Input
          type="tel"
          placeholder="Teléfono del cliente"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={anonymous}
        />
      </div>

      <Separator />

      <div className="flex gap-6 flex-col">
        {categories.map((c) => (
          <CategoryCombobox
            key={`${c.key}-${formResetKey}`}
            title={c.label}
            items={products[c.key]}
            onAdd={(p, qty) =>
              addToCart({
                id: p._id as unknown as string,
                name: p.name,
                priceCents: p.priceCents,
                quantity: qty,
              })
            }
          />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h3 className="text-lg font-medium">Resumen</h3>
          <Badge variant="secondary">{Object.keys(cart).length} items</Badge>
        </div>
        {Object.values(cart).length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Sin productos seleccionados.
          </div>
        ) : (
          <div className="space-y-2">
            {Object.values(cart).map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{it.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {it.quantity} x ${centsToMoney(it.priceCents)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(it.id)}
                  title="Quitar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="text-right font-semibold">
          Total: ${centsToMoney(totalCents)}
        </div>
      </div>

      <Button className="w-full md:w-auto" onClick={submitSale}>
        Registrar Venta
      </Button>
    </div>
  );
}

function CategoryCombobox({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: Array<{ _id: string; name: string; priceCents: number }>;
  onAdd: (
    item: { _id: string; name: string; priceCents: number },
    qty: number
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
                          selected?._id === p._id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex w-full items-center justify-between">
                        <span className="truncate">{p.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ${centsToMoney(p.priceCents)}
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
