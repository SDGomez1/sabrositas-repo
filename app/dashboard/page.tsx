"use client";

import { useMemo, useState } from "react";
import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { useQuery } from "convex/react";
import { PieChart, Pie, Cell, Legend, Tooltip as ReTooltip } from "recharts";
import { api } from "@/convex/_generated/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn, formatAsMoney } from "@/lib/utils";

function toMs(d: Date) {
  return d.getTime();
}

export default function DashboardPage() {
  const COLORS = [
    "#111827",
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#7c3aed",
    "#0ea5e9",
    "#10b981",
    "#f97316",
    "#e11d48",
    "#6b7280",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#84cc16",
  ];

  const tzOffsetMinutes = new Date().getTimezoneOffset(); // e.g., 300 for GMT-5 (note: positive east of UTC negative west)
  // timeframe state
  const [preset, setPreset] = useState<"today" | "yesterday" | "7d" | "custom">(
    "today",
  );
  const [range, setRange] = useState<{
    from: Date;
    to: Date;
  }>(() => ({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  }));

  // derive start/end based on preset
  const { startMs, endMs } = useMemo(() => {
    if (preset === "today") {
      const from = startOfDay(new Date());
      const to = endOfDay(new Date());
      return { startMs: toMs(from), endMs: toMs(to) + 1 };
    }
    if (preset === "yesterday") {
      const yFrom = startOfDay(subDays(new Date(), 1));
      const yTo = endOfDay(subDays(new Date(), 1));
      return { startMs: toMs(yFrom), endMs: toMs(yTo) + 1 };
    }
    if (preset === "7d") {
      const from = startOfDay(subDays(new Date(), 6));
      const to = endOfDay(new Date());
      return { startMs: toMs(from), endMs: toMs(to) + 1 };
    }
    // custom
    const from = startOfDay(range.from);
    const to = endOfDay(range.to);
    return { startMs: toMs(from), endMs: toMs(to) + 1 };
  }, [preset, range]);

  const data = useQuery(api.analytics.salesPerHour, {
    startMs,
    endMs,
    tzOffsetMinutes,
  });
  const breakdown = useQuery(api.analytics.productBreakdown, {
    startMs,
    endMs,
  });

  const totalCents = useMemo(
    () => (data || []).reduce((sum, b) => sum + b.totalCents, 0),
    [data],
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard de Ventas</h1>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Ventas por hora (8:00–20:00)</CardTitle>
            <div className="text-sm text-muted-foreground">
              Total: ${formatAsMoney(totalCents)}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label>Rango</Label>
              <Select value={preset} onValueChange={(v: any) => setPreset(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                "space-y-1",
                preset !== "custom" && "opacity-50 pointer-events-none",
              )}
            >
              <Label>Personalizado</Label>
              <DateRangePicker value={range} onChange={(r) => setRange(r)} />
            </div>

            <div className="self-end">
              <Badge variant="secondary">
                Zona horaria local UTC{formatOffset(tzOffsetMinutes)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data || []}
                margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={64}
                />
                <Tooltip
                  formatter={(v: any) => [`$${formatAsMoney(v)}`, "Total"]}
                  labelFormatter={(l) => `Hora ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="totalCents"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Detalle por hora</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Ticket Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data || []).map((r) => {
                  const avg = r.count ? r.totalCents / r.count : 0;
                  return (
                    <TableRow key={r.hour}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right">
                        ${formatAsMoney(r.totalCents)}
                      </TableCell>
                      <TableCell className="text-right">{r.count}</TableCell>
                      <TableCell className="text-right">
                        ${formatAsMoney(avg)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Productos vendidos (unidades)</CardTitle>
          <div className="text-sm text-muted-foreground">
            Muestra el total de unidades vendidas por producto en el rango
            seleccionado.
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown || []}
                  dataKey="units"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                >
                  {(breakdown || []).map((entry, index) => (
                    <Cell
                      key={entry.productId as any}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <ReTooltip
                  formatter={(v: any, name, props) => {
                    const row = props.payload as any;
                    return [
                      `${v} unids • $${formatAsMoney(row.revenueCents)}`,
                      row.name,
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdown || []).map((r, i) => (
                  <TableRow key={(r.productId as any) ?? i}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {r.name}
                    </TableCell>
                    <TableCell className="text-right">{r.units}</TableCell>
                    <TableCell className="text-right">
                      ${formatAsMoney(r.revenueCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatOffset(mins: number) {
  // mins e.g. 300 for UTC-5
  const sign = mins > 0 ? "-" : "+";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60)
    .toString()
    .padStart(2, "0");
  const m = (abs % 60).toString().padStart(2, "0");
  return `${sign}${h}:${m}`;
}

function DateRangePicker({
  value,
  onChange,
}: {
  value: { from: Date; to: Date };
  onChange: (v: { from: Date; to: Date }) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-56 justify-start text-left font-normal"
        >
          {value
            ? `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`
            : "Selecciona rango"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Calendar
            mode="single"
            selected={value.from}
            onSelect={(d) => d && onChange({ from: d, to: value.to })}
          />
        </div>
        <Separator />
        <div className="p-2">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Calendar
            mode="single"
            selected={value.to}
            onSelect={(d) => d && onChange({ from: value.from, to: d })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
