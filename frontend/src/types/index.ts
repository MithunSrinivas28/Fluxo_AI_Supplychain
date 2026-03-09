export type UserRole = "admin" | "retailer" | "warehouse";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface MetricData {
  label: string;
  value: string;
  trend: number; // percentage change
  trendLabel: string;
}

export interface ChartDataPoint {
  date: string;
  orders: number;
  revenue: number;
  inventory: number;
}

export interface ActivityItem {
  id: string;
  activity: string;
  date: string;
  status: "completed" | "pending" | "failed" | "processing";
}

export interface SupplyRequest {
  id: string;
  product: string;
  quantity: number;
  retailer: string;
  status: "pending" | "approved" | "shipped" | "delivered" | "rejected";
  date: string;
  priority: "low" | "medium" | "high";
}

export interface InventoryTransaction {
  id: string;
  date: string;
  type: "inbound" | "outbound" | "adjustment";
  source: string;
  quantity: number;
  updatedBy: string;
}

export interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  category: string;
  zone: string;
  warehouse: string;
  stock: number;
  minStock: number;
  status: "healthy" | "low" | "critical" | "new";
  lastUpdated: string;
  addedDate: string;
  transactions: InventoryTransaction[];
}

export interface SystemStatus {
  label: string;
  status: "online" | "warning" | "offline";
  detail: string;
}
