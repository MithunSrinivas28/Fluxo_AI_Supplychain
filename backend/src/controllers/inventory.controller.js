import { updateInventory, getInventory } from "../services/inventory.service.js";

export const setInventory = async (req, res, next) => {
  try {
    const inventory = await updateInventory(req.body, req.user);

    res.status(200).json({
      success: true,
      data: inventory
    });

  } catch (error) {
    next(error);
  }
};

export const fetchInventory = async (req, res, next) => {
  try {
    const inventory = await getInventory();

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });

  } catch (error) {
    next(error);
  }
};