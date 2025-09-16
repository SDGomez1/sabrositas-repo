import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("arepas"),
      v.literal("jugos"),
      v.literal("cafes"),
      v.literal("gaseosas"),
    ),
    price: v.number(), // store prices in cents
    active: v.boolean(),
  })
    .index("by_category", ["category", "active"])
    .index("by_active", ["active"]),

  sales: defineTable({
    createdAt: v.number(), // Date.now()
    anonymous: v.boolean(),
    userPhone: v.optional(v.string()), // optional if anonymous
    lineItems: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        unitPriceCents: v.number(),
        subtotalCents: v.number(),
      }),
    ),
    totalCents: v.number(),
    promotionId: v.optional(v.id("promotions")),
    promotionName: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),
  promotions: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("free_arepa"),
      v.literal("free_drink"),
      v.literal("discount_percent"),
    ),
    discountPercent: v.optional(v.number()), // used if type=discount_percent
    active: v.boolean(),
  }).index("by_active", ["active"]),
});
