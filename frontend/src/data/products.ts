export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
}

export const products: Product[] = [
  { id: "PRD-001", name: "Eggs", sku: "EGG-001", category: "Dairy & Poultry" },
  { id: "PRD-002", name: "Whole Milk", sku: "MLK-001", category: "Dairy & Poultry" },
  { id: "PRD-003", name: "Paneer", sku: "PNR-001", category: "Dairy & Poultry" },
  { id: "PRD-004", name: "Butter", sku: "BTR-001", category: "Dairy & Poultry" },
  { id: "PRD-005", name: "Chicken", sku: "CHK-001", category: "Meat & Poultry" },
  { id: "PRD-006", name: "Rice", sku: "RCE-001", category: "Grains & Cereals" },
  { id: "PRD-007", name: "Wheat", sku: "WHT-001", category: "Grains & Cereals" },
  { id: "PRD-008", name: "Maize", sku: "MZE-001", category: "Grains & Cereals" },
  { id: "PRD-009", name: "Barley", sku: "BRL-001", category: "Grains & Cereals" },
  { id: "PRD-010", name: "Tomato", sku: "TMT-001", category: "Fruits & Vegetables" },
  { id: "PRD-011", name: "Onion", sku: "ONI-001", category: "Fruits & Vegetables" },
  { id: "PRD-012", name: "Potato", sku: "PTT-001", category: "Fruits & Vegetables" },
  { id: "PRD-013", name: "Apple", sku: "APL-001", category: "Fruits & Vegetables" },
  { id: "PRD-014", name: "Banana", sku: "BNA-001", category: "Fruits & Vegetables" },
  { id: "PRD-015", name: "Orange", sku: "ORG-001", category: "Fruits & Vegetables" },
  { id: "PRD-016", name: "LED TV", sku: "LTV-001", category: "Electronics" },
  { id: "PRD-017", name: "Refrigerator", sku: "RFG-001", category: "Electronics" },
  { id: "PRD-018", name: "Laptop", sku: "LPT-001", category: "Electronics" },
  { id: "PRD-019", name: "Cement", sku: "CMT-001", category: "Construction" },
  { id: "PRD-020", name: "Steel Rods", sku: "STR-001", category: "Construction" },
  { id: "PRD-021", name: "Office Chair", sku: "OCH-001", category: "Furniture" },
  { id: "PRD-022", name: "Wooden Table", sku: "WTB-001", category: "Furniture" },
];

export const productNames = products.map(p => p.name);
