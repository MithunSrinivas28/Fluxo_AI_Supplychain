import { Inventory } from "../models/inventory.model.js";

export const updateInventory = async (data, user) => {

  const updateFields = {
    stockLevel: data.stockLevel,
    updatedBy: user._id
  };

  // Ensure required fields are set on upsert (new record creation)
  if (data.sku) updateFields.sku = data.sku;
  if (data.product_id) updateFields.product_id = data.product_id;
  if (data.category) updateFields.category = data.category;
  if (data.product) updateFields.product = data.product;

  const inventory = await Inventory.findOneAndUpdate(
    { zone: data.zone, warehouse: data.warehouse, product: data.product },
    { $set: updateFields },
    { new: true, upsert: true }
  );

  return inventory;
};

export const getInventory = async () => {
  return await Inventory.find().populate("updatedBy", "name role");
};