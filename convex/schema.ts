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
  }).index("by_createdAt", ["createdAt"]),
});
