import { query } from "./_generated/server";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("promotions").withIndex("by_active", (q) => q.eq("active", true)).collect();
  },
});
