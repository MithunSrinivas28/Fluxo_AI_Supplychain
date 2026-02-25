import { Inventory } from "../models/inventory.model.js";

export const updateInventory = async (data, user) => {

  const inventory = await Inventory.findOneAndUpdate(
    { warehouseZone: data.warehouseZone, product: data.product },
    {
      stockLevel: data.stockLevel,
      updatedBy: user._id
    },
    { new: true, upsert: true }
  );

  return inventory;
};

export const getInventory = async () => {
  return await Inventory.find().populate("updatedBy", "name role");
};