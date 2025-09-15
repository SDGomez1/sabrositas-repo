// convex/sales.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSale = mutation({
  args: {
    anonymous: v.boolean(),
    userPhone: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!args.anonymous && (!args.userPhone || args.userPhone.trim() === "")) {
      throw new Error("userPhone required when not anonymous");
    }

    // Load products to get authoritative prices
    const products = await Promise.all(
      args.items.map((it) => ctx.db.get(it.productId))
    );

    const lineItems = args.items.map((it, i) => {
      const product = products[i];
      if (!product || !product.active) {
        throw new Error("Invalid or inactive product");
      }
      const unitPriceCents = product.price;
      const subtotalCents = unitPriceCents * it.quantity;
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPriceCents,
        subtotalCents,
      };
    });

    const totalCents = lineItems.reduce((sum, li) => sum + li.subtotalCents, 0);

    const saleId = await ctx.db.insert("sales", {
      createdAt: Date.now(),
      anonymous: args.anonymous,
      userPhone: args.anonymous ? undefined : args.userPhone,
      lineItems,
      totalCents,
    });

    return { saleId, totalCents };
  },
});
