import { createDemand, getDemands, getZoneSummary  } from "../services/demand.service.js";

export const addDemand = async (req, res, next) => {
    console.log("BODY:", req.body);
  try {
    const demand = await createDemand(req.body);
    res.status(201).json({
  success: true,
  message: "Demand recorded successfully",
  data: demand
});
  
  } catch (error) {
    next(error);
  }
};

export const fetchDemands = async (req, res, next) => {
  try {
    const demands = await getDemands(req.query);

    res.status(200).json({
      success: true,
      count: demands.length,
      data: demands
    });
  } catch (error) {
    next(error);
  }
};



export const fetchZoneSummary = async (req, res, next) => {
  try {
    const summary = await getZoneSummary();

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};