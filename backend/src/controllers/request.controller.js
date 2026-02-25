import { createRequest } from "../services/request.service.js";

export const submitRequest = async (req, res, next) => {
  try {
    const result = await createRequest(req.body, req.user);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

import { getRequests } from "../services/request.service.js";

export const fetchRequests = async (req, res, next) => {
  try {
    const requests = await getRequests(req.user);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    next(error);
  }
};