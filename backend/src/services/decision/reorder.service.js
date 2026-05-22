import { Inventory } from "../../models/inventory.model.js";
import { WeeklySales } from "../../models/weeklySales.model.js";

export const calculateReorder = async (region, category) => {
  // Build inventory query
  const invQuery = {};
  if (region && region !== "global") {
    invQuery.zone = region;
  }
  if (category && category !== "all") {
    invQuery.category = category;
  }

  const inventories = await Inventory.find(invQuery).lean();
  if (!inventories.length) return [];

  // Get latest year for demand averages
  const latestYearDoc = await WeeklySales.aggregate([
    { $sort: { year: -1 } },
    { $limit: 1 },
    { $project: { year: 1 } },
  ]);
  const maxYear = latestYearDoc[0]?.year || 2024;

  // Get average weekly demand per product×zone×warehouse for latest year
  const demandAgg = await WeeklySales.aggregate([
    { $match: { year: maxYear } },
    { $group: {
      _id: { product_id: "$product_id", zone: "$zone", warehouse: "$warehouse" },
      avgWeeklyDemand: { $avg: "$units_sold" },
    }},
  ]);

  const demandMap = {};
  for (const d of demandAgg) {
    demandMap[`${d._id.product_id}-${d._id.zone}-${d._id.warehouse}`] = d.avgWeeklyDemand;
  }

  // Compute reorder suggestions
  const suggestions = inventories
    .map(inv => {
      const key = `${inv.product_id}-${inv.zone}-${inv.warehouse}`;
      const avgDemand = demandMap[key] || 100;
      const weeksOfStock = avgDemand > 0 ? inv.stockLevel / avgDemand : 999;

      let status = "healthy";
      if (weeksOfStock < 1) status = "critical";
      else if (weeksOfStock < 2) status = "low";
      else if (weeksOfStock < 3) status = "moderate";

      return {
        id: inv._id,
        product: inv.product,
        sku: inv.sku,
        zone: inv.zone,
        warehouse: inv.warehouse,
        category: inv.category,
        stock: inv.stockLevel,
        avgWeeklyDemand: Math.round(avgDemand),
        weeksOfStock: Math.round(weeksOfStock * 10) / 10,
        suggestedReorder: Math.max(0, Math.round(avgDemand * 3 - inv.stockLevel)),
        status,
      };
    })
    .filter(s => s.status !== "healthy")
    .sort((a, b) => a.weeksOfStock - b.weeksOfStock);

  return suggestions;
};