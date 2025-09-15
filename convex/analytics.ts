import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const salesPerHour = query({
  args: {
    startMs: v.number(), // inclusive
    endMs: v.number(), // exclusive
    tzOffsetMinutes: v.number(), // client local offset (e.g., -300 for GMT-5)
  },
  handler: async (ctx, { startMs, endMs, tzOffsetMinutes }) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt", (q) =>
        q.gte("createdAt", startMs).lt("createdAt", endMs)
      )
      .collect();

    const buckets: Record<
      string,
      { hour: number; label: string; totalCents: number; count: number }
    > = {};
    for (let h = 8; h <= 20; h++) {
      const key = h.toString().padStart(2, "0");
      buckets[key] = {
        hour: h,
        label: `${key}:00`,
        totalCents: 0,
        count: 0,
      };
    }

    for (const s of sales) {
      const localMs = s.createdAt - tzOffsetMinutes * 60 * 1000;
      const d = new Date(localMs);
      const h = d.getHours();
      if (h >= 8 && h <= 20) {
        const key = h.toString().padStart(2, "0");
        buckets[key].totalCents += s.totalCents;
        buckets[key].count += 1;
      }
    }

    // return in hour order
    return Object.keys(buckets)
      .sort()
      .map((k) => buckets[k]);
  },
});


export const productBreakdown = query({
  args: {
    startMs: v.number(), // inclusive
    endMs: v.number(),   // exclusive
  },
  handler: async (ctx, { startMs, endMs }) => {
    // fetch sales in range
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt", (q) =>
        q.gte("createdAt", startMs).lt("createdAt", endMs)
      )
      .collect();

    // aggregate by productId
    const map = new Map<
      string,
      { productId: Id<"products">; name: string; units: number; revenueCents: number }
    >();

    for (const s of sales) {
      for (const li of s.lineItems) {
        const pid = li.productId as Id<"products">;
        const prev = map.get(pid as unknown as string);
        if (prev) {
          prev.units += li.quantity;
          prev.revenueCents += li.subtotalCents;
        } else {
          // fetch product name lazily; you can batch for speed if needed
          const product = await ctx.db.get(pid);
          map.set(pid as unknown as string, {
            productId: pid,
            name: product?.name ?? "Producto",
            units: li.quantity,
            revenueCents: li.subtotalCents,
          });
        }
      }
    }

    // sort by units desc
    const rows = Array.from(map.values()).sort((a, b) => b.units - a.units);

    return rows;
  },
});
