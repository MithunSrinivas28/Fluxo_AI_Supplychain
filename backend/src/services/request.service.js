import { DemandRequest } from "../models/demandRequest.model.js";

export const createRequest = async (data, user) => {

  // Simulated prediction logic (replace with ML later)
  const predictedKPI = data.quantity * 0.12;  

  const requestPayload = {
    product: data.product,
    fromZone: data.fromZone,
    toZone: data.toZone,
    quantity: data.quantity,
    predictedKPI,
    status: data.status || "temporary",
    retailer: user._id,
    targetWarehouseZone: data.toZone
  };

  // If temporary → do not save to DB
  if (requestPayload.status === "temporary") {
    return requestPayload;
  }

  // If saved → persist
  const savedRequest = await DemandRequest.create(requestPayload);

  return savedRequest;
};


export const getRequests = async (user) => {

  let filter = {};

  if (user.role === "retailer") {
    filter = { retailer: user._id, status: "saved" };
  }

  if (user.role === "warehouse") {
    filter = { targetWarehouseZone: user.zone, status: "saved" };
  }

  // Admin sees all
  const requests = await DemandRequest.find(filter)
    .populate("retailer", "name email role");

  return requests;
};