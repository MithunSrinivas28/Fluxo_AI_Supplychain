import { Demand } from "../../models/demand.model.js";

export const calculateReorder = async (region, category) => {

  const result = await Demand.aggregate([
    {
      $match: { region, category }
    },
    {
      $group: {
        _id: null,
        avgDemand: { $avg: "$quantity" }
      }
    }
  ]);

  if (!result.length) {
    return null;
  }

  const avgDemand = result[0].avgDemand;
  const safetyFactor = 1.2;

  const suggestedReorder = Math.ceil(avgDemand * safetyFactor);

  return {
    region,
    category,
    avgDemand,
    suggestedReorder,
    reason: "Based on historical average demand with safety buffer"
  };
};