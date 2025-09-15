// convex/seed.ts
import { mutation } from "./_generated/server";

export const upsertDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    type Cat = "arepas" | "jugos" | "cafes" | "gaseosas";

    const products: Array<{
      name: string;
      category: Cat;
      price: number;
    }> = [
      // AREPAS (from image 1)
      { name: "La Tóxica", category: "arepas", price: 13000 },
      { name: "La Caprichosa", category: "arepas", price: 13000 },
      { name: "La Patrona", category: "arepas", price: 13000 },
      { name: "La Sexy", category: "arepas", price: 13000 },

      // Express - $8.000
      { name: "La Fácil", category: "arepas", price: 8000 },
      { name: "La Sencilla", category: "arepas", price: 8000 },
      { name: "La Consentida", category: "arepas", price: 8000 },

      // Ahumadas - $10.000
      { name: "La Picante", category: "arepas", price: 10000 },
      { name: "La Difícil", category: "arepas", price: 10000 },
      { name: "La Soltera", category: "arepas", price: 10000 },

      // Clásicas - $10.000
      { name: "La Creída", category: "arepas", price: 10000 },
      { name: "La Gomela", category: "arepas", price: 10000 },
      { name: "La Churra", category: "arepas", price: 10000 },
      { name: "La Sumisa", category: "arepas", price: 10000 },

      // Gourmet - $10.000
      { name: "La Diva", category: "arepas", price: 10000 },
      { name: "La Compinche", category: "arepas", price: 10000 },
      { name: "La Infiel", category: "arepas", price: 10000 },
      { name: "La Coqueta", category: "arepas", price: 10000 },

      // JUGOS Y LICUADOS
      // Price: 7000 water, 8000 milk
      {
        name: "El Chicanero (Agua)",
        category: "jugos",
        price: 7000,
      },
      {
        name: "El Chicanero (Leche)",
        category: "jugos",
        price: 8000,
      },
      { name: "El Intenso (Agua)", category: "jugos", price: 7000 },
      { name: "El Intenso (Leche)", category: "jugos", price: 8000 },
      {
        name: "El Charlatán (Agua)",
        category: "jugos",
        price: 7000,
      },
      {
        name: "El Charlatán (Leche)",
        category: "jugos",
        price: 8000,
      },
      { name: "El Tacaño (Agua)", category: "jugos", price: 7000 },
      { name: "El Tacaño (Leche)", category: "jugos", price: 8000 },
      { name: "El Machista (Agua)", category: "jugos", price: 7000 },
      {
        name: "El Machista (Leche)",
        category: "jugos",
        price: 8000,
      },
      { name: "El Solapao (Agua)", category: "jugos", price: 7000 },
      { name: "El Solapao (Leche)", category: "jugos", price: 8000 },
      {
        name: "El Orgulloso (Agua)",
        category: "jugos",
        price: 7000,
      },
      {
        name: "El Orgulloso (Leche)",
        category: "jugos",
        price: 8000,
      },
      { name: "El Sencillo (Agua)", category: "jugos", price: 7000 },
      {
        name: "El Sencillo (Leche)",
        category: "jugos",
        price: 8000,
      },
      { name: "El Celoso (Agua)", category: "jugos", price: 7000 },
      { name: "El Celoso (Leche)", category: "jugos", price: 8000 },

      // GASEOSAS
      // 4000: gaseosa normal y agua
      // 5000: Fuze Tea
      { name: "Gaseosa 400ml", category: "gaseosas", price: 4000 },
      { name: "Agua", category: "gaseosas", price: 4000 },
      { name: "Fuze Tea 400ml", category: "gaseosas", price: 5000 },

      // CAFÉS
      // Capuchino y Latte 6000, Tinto y Aromática 3000, Milo 8000
      { name: "Capuchino", category: "cafes", price: 6000 },
      { name: "Latte", category: "cafes", price: 6000 },
      { name: "Tinto", category: "cafes", price: 3000 },
      { name: "Aromática", category: "cafes", price: 3000 },
      { name: "Milo", category: "cafes", price: 8000 },
    ];

    // Idempotent upsert by (name, category)
    for (const p of products) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();

      const match = existing.find(
        (e) =>
          e.category === p.category &&
          e.name.trim().toLowerCase() === p.name.trim().toLowerCase(),
      );

      if (!match) {
        await ctx.db.insert("products", {
          name: p.name,
          category: p.category,
          price: p.price,
          active: true,
        });
      } else if (match.price !== p.price) {
        // keep names in sync and update price if changed
        await ctx.db.patch(match._id, {
          price: p.price,
          active: true,
        });
      }
    }

    return { ok: true, count: products.length };
  },
});
