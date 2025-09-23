"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingCart, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import CategoryCombobox from "@/components/form/CategoryCombobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CatKey = "arepas" | "jugos" | "cafes" | "gaseosas";

function centsToMoney(cents: number) {
  return cents;
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
  const promos = useQuery(api.promotions.listActive, {});
  const lastSale = useQuery(api.salesHistory.lastSale, {});
  const [selectedPromo, setSelectedPromo] = useState<string | undefined>(
    undefined,
  );
  const [anonymous, setAnonymous] = useState(false);
  const [phone, setPhone] = useState("");

  console.log(promos);
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
        0,
      ),
    [cart],
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
        promotionId: (selectedPromo as Id<"promotions">) ?? undefined,
      });
      alert(`¡Venta creada! Total: $${centsToMoney((res as any).totalCents)}`);

      // reset whole form
      setCart({});
      setPhone("");
      setAnonymous(false);
      // bump key so all CategoryCombobox components reset their internal state
      setFormResetKey((k) => k + 1);
      setSelectedPromo(undefined);
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
      {promos && promos?.length > 0 && (
        <div className="space-y-1">
          <Label>Promoción</Label>
          <Select
            value={selectedPromo ?? "none"}
            onValueChange={(v) => {
              setSelectedPromo(v === "none" ? undefined : v);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin promoción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin promoción</SelectItem>
              {(promos || []).map((p) => (
                <SelectItem key={p._id} value={p._id as any}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>{" "}
        </div>
      )}

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
      {lastSale && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Última venta registrada</CardTitle>
            <div className="text-sm text-muted-foreground">
              {new Date(lastSale.createdAt).toLocaleString()}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              {lastSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {it.name} x {it.quantity}
                  </span>
                  <span>${centsToMoney(it.subtotalCents)}</span>
                </div>
              ))}
            </div>
            {lastSale.promotionName && (
              <div className="text-green-600 text-sm">
                Promo aplicada: {lastSale.promotionName}
              </div>
            )}
            <div className="font-bold text-right">
              Total: ${centsToMoney(lastSale.totalCents)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
