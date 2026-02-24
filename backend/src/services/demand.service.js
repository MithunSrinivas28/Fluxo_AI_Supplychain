import { Demand } from "../models/demand.model.js";

export const createDemand = async (data) => {
  return await Demand.create(data);
};

export const getDemands = async (filters) => {
  const query = {};

  if (filters.region) {
    query.region = filters.region;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return await Demand.find(query);
};


export const getZoneSummary = async () => {
  return await Demand.aggregate([
    {
      $group: {
        _id: "$region",
        totalQuantity: { $sum: "$quantity" }
      }
    },
    {
      $project: {
        region: "$_id",
        totalQuantity: 1,
        _id: 0
      }
    }
  ]);
};