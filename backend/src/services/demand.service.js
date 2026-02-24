import { Demand } from "../models/demand.model.js";

export const createDemand = async (data) => {
  return await Demand.create(data);
};

export const getDemands = async (filters) => {

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;

  const skip = (page - 1) * limit;

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

  const sortField = filters.sortBy || "date";
  const sortOrder = filters.order === "asc" ? 1 : -1;

  const allowedSortFields = ["date", "quantity", "region", "category"];

  const finalSortField = allowedSortFields.includes(sortField)
    ? sortField
    : "date";

  const demands = await Demand.find(query)

  .sort({ [finalSortField]: sortOrder })
  .skip(skip)
  .limit(limit);

  const total = await Demand.countDocuments(query);

  return {
    total,
    page,
    limit,
    demands
  };
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