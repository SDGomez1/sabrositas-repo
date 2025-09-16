// convex/sales.ts
import { Id } from "./_generated/dataModel";
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
      }),
    ),
    promotionId: v.optional(v.id("promotions")),
  },
  handler: async (ctx, args) => {
    if (!args.anonymous && (!args.userPhone || args.userPhone.trim() === "")) {
      throw new Error("userPhone required when not anonymous");
    }

    // Load products
    const products = await Promise.all(
      args.items.map((it) => ctx.db.get(it.productId)),
    );

    let lineItems = args.items.map((it, i) => {
      const product = products[i];
      if (!product || !product.active) throw new Error("Invalid product");
      const unitPriceCents = product.price;
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPriceCents,
        subtotalCents: unitPriceCents * it.quantity,
      };
    });

    let totalCents = lineItems.reduce((sum, l) => sum + l.subtotalCents, 0);

    let promoId: Id<"promotions"> | undefined;
    let promoName: string | undefined;

    if (args.promotionId) {
      const promo = await ctx.db.get(args.promotionId);
      if (promo?.active) {
        promoId = promo._id;
        promoName = promo.name;

        if (promo.type === "free_arepa") {
          const arepaItem = lineItems.find(
            (li, idx) => products[idx]?.category === "arepas",
          );
          if (arepaItem) {
            totalCents -= arepaItem.unitPriceCents;
          }
        }
        if (promo.type === "free_drink") {
          const drinkItem = lineItems.find((li, idx) =>
            ["jugos", "cafes", "gaseosas"].includes(
              products[idx]?.category ?? "",
            ),
          );
          if (drinkItem) {
            totalCents -= drinkItem.unitPriceCents;
          }
        }
        if (promo.type === "discount_percent" && promo.discountPercent) {
          totalCents = Math.floor(
            (totalCents * (100 - promo.discountPercent)) / 100,
          );
        }
      }
    }

    totalCents = Math.max(totalCents, 0);

    const saleId = await ctx.db.insert("sales", {
      createdAt: Date.now(),
      anonymous: args.anonymous,
      userPhone: args.anonymous ? undefined : args.userPhone,
      lineItems,
      totalCents,
      promotionId: promoId,
      promotionName: promoName,
    });

    return { saleId, totalCents, promotionName: promoName };
  },
});
