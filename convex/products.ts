import { query } from "./_generated/server";

export const listActiveByCategory = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    // group by category
    const grouped: Record<
      "arepas" | "jugos" | "cafes" | "gaseosas",
      Array<{ _id: string; name: string; priceCents: number }>
    > = { arepas: [], jugos: [], cafes: [], gaseosas: [] };

    for (const p of active) {
      grouped[p.category].push({
        _id: p._id as unknown as string,
        name: p.name,
        priceCents: p.price,
      });
    }
    return grouped;
  },
});
