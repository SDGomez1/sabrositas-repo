import { query } from "./_generated/server";

export const lastSale = query({
  args: {},
  handler: async (ctx) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt", (q) => q) // index by time
      .order("desc")
      .take(1);

    if (sales.length === 0) return null;

    const sale = sales[0];

    // hydrate products for readability
    const items = [];
    for (const li of sale.lineItems) {
      const p = await ctx.db.get(li.productId);
      if (p) {
        items.push({
          name: p.name,
          quantity: li.quantity,
          subtotalCents: li.subtotalCents,
        });
      }
    }

    return {
      _id: sale._id,
      createdAt: sale.createdAt,
      totalCents: sale.totalCents,
      promotionName: sale.promotionName,
      items,
    };
  },
});
