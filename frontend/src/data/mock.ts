import type { MetricData, ChartDataPoint, ActivityItem, SupplyRequest, InventoryItem, SystemStatus } from "@/types";
import { products } from "@/data/products";

export const metrics: MetricData[] = [
  { label: "Total Orders", value: "12,847", trend: 12.5, trendLabel: "vs last month" },
  { label: "Revenue", value: "$2.4M", trend: 8.2, trendLabel: "vs last month" },
  { label: "Inventory Health", value: "94.2%", trend: -1.3, trendLabel: "vs last week" },
  { label: "AI Accuracy", value: "97.8%", trend: 2.1, trendLabel: "vs last quarter" },
];

export const chartData7D: ChartDataPoint[] = [
  { date: "Mon", orders: 420, revenue: 84000, inventory: 92 },
  { date: "Tue", orders: 380, revenue: 76000, inventory: 91 },
  { date: "Wed", orders: 510, revenue: 102000, inventory: 93 },
  { date: "Thu", orders: 460, revenue: 92000, inventory: 94 },
  { date: "Fri", orders: 530, revenue: 106000, inventory: 95 },
  { date: "Sat", orders: 340, revenue: 68000, inventory: 94 },
  { date: "Sun", orders: 290, revenue: 58000, inventory: 93 },
];

export const chartData30D: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  orders: 300 + Math.floor(Math.random() * 300),
  revenue: 60000 + Math.floor(Math.random() * 60000),
  inventory: 88 + Math.floor(Math.random() * 10),
}));

export const chartData90D: ChartDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
  date: `Week ${i + 1}`,
  orders: 2800 + Math.floor(Math.random() * 1200),
  revenue: 560000 + Math.floor(Math.random() * 240000),
  inventory: 89 + Math.floor(Math.random() * 8),
}));

export const activities: ActivityItem[] = [
  { id: "1", activity: "Warehouse Zone A restocked", date: "2026-02-27", status: "completed" },
  { id: "2", activity: "AI demand forecast generated", date: "2026-02-27", status: "completed" },
  { id: "3", activity: "Supply request #4821 processing", date: "2026-02-27", status: "processing" },
  { id: "4", activity: "Retailer order batch submitted", date: "2026-02-26", status: "pending" },
  { id: "5", activity: "Inventory alert: Zone C low stock", date: "2026-02-26", status: "failed" },
  { id: "6", activity: "ML model retrained successfully", date: "2026-02-25", status: "completed" },
];

export const supplyRequests: SupplyRequest[] = [
  { id: "REQ-4821", product: "Eggs", quantity: 2400, retailer: "FreshMart", status: "pending", date: "2026-02-27", priority: "high" },
  { id: "REQ-4820", product: "Rice", quantity: 10000, retailer: "BuildCo", status: "approved", date: "2026-02-27", priority: "medium" },
  { id: "REQ-4819", product: "Chicken", quantity: 500, retailer: "WearHub", status: "shipped", date: "2026-02-26", priority: "low" },
  { id: "REQ-4818", product: "LED TV", quantity: 3000, retailer: "LightWorld", status: "delivered", date: "2026-02-25", priority: "medium" },
  { id: "REQ-4817", product: "Whole Milk", quantity: 800, retailer: "FreshMart", status: "rejected", date: "2026-02-25", priority: "high" },
  { id: "REQ-4816", product: "Laptop", quantity: 5000, retailer: "TechZone", status: "approved", date: "2026-02-24", priority: "low" },
];

export const warehousesByZone: Record<string, string[]> = {
  "Zone A": ["Warehouse A1", "Warehouse A2"],
  "Zone B": ["Warehouse B1"],
  "Zone C": ["Warehouse C1", "Warehouse C2"],
  "Zone D": ["Warehouse D1"],
};

const p = (id: string) => products.find(pr => pr.id === id)!;

export const inventoryItems: InventoryItem[] = [
  {
    id: "INV-001", product: p("PRD-001").name, sku: p("PRD-001").sku, category: p("PRD-001").category,
    zone: "Zone A", warehouse: "Warehouse A1", stock: 1200, minStock: 500, status: "healthy",
    lastUpdated: "2026-03-01T14:22:00Z", addedDate: "2025-11-10T08:00:00Z",
    transactions: [
      { id: "TX-001", date: "2026-03-01T14:22:00Z", type: "inbound", source: "Request Approval (REQ-4820)", quantity: 400, updatedBy: "System" },
      { id: "TX-002", date: "2026-02-27T09:10:00Z", type: "outbound", source: "Sale Order #SO-881", quantity: -200, updatedBy: "M. Khan" },
    ]
  },
  {
    id: "INV-002", product: p("PRD-006").name, sku: p("PRD-006").sku, category: p("PRD-006").category,
    zone: "Zone B", warehouse: "Warehouse B1", stock: 45000, minStock: 10000, status: "healthy",
    lastUpdated: "2026-02-28T11:05:00Z", addedDate: "2025-06-01T08:00:00Z",
    transactions: [
      { id: "TX-003", date: "2026-02-28T11:05:00Z", type: "inbound", source: "Request Approval (REQ-4819)", quantity: 10000, updatedBy: "System" },
    ]
  },
  {
    id: "INV-003", product: p("PRD-005").name, sku: p("PRD-005").sku, category: p("PRD-005").category,
    zone: "Zone A", warehouse: "Warehouse A2", stock: 80, minStock: 200, status: "critical",
    lastUpdated: "2026-02-26T16:30:00Z", addedDate: "2025-09-15T08:00:00Z",
    transactions: [
      { id: "TX-004", date: "2026-02-26T16:30:00Z", type: "outbound", source: "Sale Order #SO-877", quantity: -120, updatedBy: "S. Patel" },
    ]
  },
  {
    id: "INV-004", product: p("PRD-016").name, sku: p("PRD-016").sku, category: p("PRD-016").category,
    zone: "Zone C", warehouse: "Warehouse C1", stock: 320, minStock: 300, status: "low",
    lastUpdated: "2026-02-25T10:45:00Z", addedDate: "2025-08-20T08:00:00Z",
    transactions: [
      { id: "TX-005", date: "2026-02-25T10:45:00Z", type: "adjustment", source: "Manual Count Correction", quantity: -30, updatedBy: "R. Silva" },
    ]
  },
  {
    id: "INV-005", product: p("PRD-002").name, sku: p("PRD-002").sku, category: p("PRD-002").category,
    zone: "Zone A", warehouse: "Warehouse A1", stock: 2100, minStock: 400, status: "healthy",
    lastUpdated: "2026-02-24T08:15:00Z", addedDate: "2025-07-01T08:00:00Z",
    transactions: [
      { id: "TX-006", date: "2026-02-24T08:15:00Z", type: "inbound", source: "Request Approval (REQ-4815)", quantity: 300, updatedBy: "System" },
    ]
  },
  {
    id: "INV-006", product: p("PRD-018").name, sku: p("PRD-018").sku, category: p("PRD-018").category,
    zone: "Zone D", warehouse: "Warehouse D1", stock: 150, minStock: 500, status: "critical",
    lastUpdated: "2026-02-23T13:00:00Z", addedDate: "2026-02-25T08:00:00Z",
    transactions: [
      { id: "TX-007", date: "2026-02-25T08:00:00Z", type: "inbound", source: "Request Approval (REQ-4816)", quantity: 150, updatedBy: "System" },
    ]
  },
  {
    id: "INV-007", product: p("PRD-010").name, sku: p("PRD-010").sku, category: p("PRD-010").category,
    zone: "Zone A", warehouse: "Warehouse A1", stock: 3500, minStock: 800, status: "healthy",
    lastUpdated: "2026-03-02T09:00:00Z", addedDate: "2025-10-01T08:00:00Z",
    transactions: [
      { id: "TX-008", date: "2026-03-02T09:00:00Z", type: "inbound", source: "Supplier Delivery", quantity: 1000, updatedBy: "System" },
    ]
  },
  {
    id: "INV-008", product: p("PRD-011").name, sku: p("PRD-011").sku, category: p("PRD-011").category,
    zone: "Zone B", warehouse: "Warehouse B1", stock: 4200, minStock: 1000, status: "healthy",
    lastUpdated: "2026-03-01T07:30:00Z", addedDate: "2025-09-20T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-009", product: p("PRD-012").name, sku: p("PRD-012").sku, category: p("PRD-012").category,
    zone: "Zone C", warehouse: "Warehouse C2", stock: 6000, minStock: 1500, status: "healthy",
    lastUpdated: "2026-02-28T15:00:00Z", addedDate: "2025-08-15T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-010", product: p("PRD-019").name, sku: p("PRD-019").sku, category: p("PRD-019").category,
    zone: "Zone D", warehouse: "Warehouse D1", stock: 900, minStock: 500, status: "healthy",
    lastUpdated: "2026-03-01T12:00:00Z", addedDate: "2025-12-01T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-011", product: p("PRD-020").name, sku: p("PRD-020").sku, category: p("PRD-020").category,
    zone: "Zone D", warehouse: "Warehouse D1", stock: 250, minStock: 300, status: "low",
    lastUpdated: "2026-02-27T10:00:00Z", addedDate: "2025-11-15T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-012", product: p("PRD-003").name, sku: p("PRD-003").sku, category: p("PRD-003").category,
    zone: "Zone A", warehouse: "Warehouse A2", stock: 600, minStock: 200, status: "healthy",
    lastUpdated: "2026-03-01T11:00:00Z", addedDate: "2025-10-10T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-013", product: p("PRD-004").name, sku: p("PRD-004").sku, category: p("PRD-004").category,
    zone: "Zone A", warehouse: "Warehouse A1", stock: 1800, minStock: 500, status: "healthy",
    lastUpdated: "2026-02-28T14:00:00Z", addedDate: "2025-07-20T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-014", product: p("PRD-007").name, sku: p("PRD-007").sku, category: p("PRD-007").category,
    zone: "Zone B", warehouse: "Warehouse B1", stock: 30000, minStock: 8000, status: "healthy",
    lastUpdated: "2026-03-02T08:00:00Z", addedDate: "2025-06-15T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-015", product: p("PRD-008").name, sku: p("PRD-008").sku, category: p("PRD-008").category,
    zone: "Zone C", warehouse: "Warehouse C1", stock: 12000, minStock: 3000, status: "healthy",
    lastUpdated: "2026-02-26T09:00:00Z", addedDate: "2025-08-01T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-016", product: p("PRD-009").name, sku: p("PRD-009").sku, category: p("PRD-009").category,
    zone: "Zone C", warehouse: "Warehouse C2", stock: 8000, minStock: 2000, status: "healthy",
    lastUpdated: "2026-02-25T16:00:00Z", addedDate: "2025-09-01T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-017", product: p("PRD-013").name, sku: p("PRD-013").sku, category: p("PRD-013").category,
    zone: "Zone A", warehouse: "Warehouse A2", stock: 2000, minStock: 600, status: "healthy",
    lastUpdated: "2026-03-01T10:00:00Z", addedDate: "2025-10-20T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-018", product: p("PRD-014").name, sku: p("PRD-014").sku, category: p("PRD-014").category,
    zone: "Zone A", warehouse: "Warehouse A1", stock: 5000, minStock: 1000, status: "healthy",
    lastUpdated: "2026-02-28T13:00:00Z", addedDate: "2025-08-10T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-019", product: p("PRD-015").name, sku: p("PRD-015").sku, category: p("PRD-015").category,
    zone: "Zone B", warehouse: "Warehouse B1", stock: 3000, minStock: 700, status: "healthy",
    lastUpdated: "2026-02-27T14:00:00Z", addedDate: "2025-09-05T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-020", product: p("PRD-017").name, sku: p("PRD-017").sku, category: p("PRD-017").category,
    zone: "Zone C", warehouse: "Warehouse C1", stock: 180, minStock: 100, status: "healthy",
    lastUpdated: "2026-02-26T11:00:00Z", addedDate: "2025-11-01T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-021", product: p("PRD-021").name, sku: p("PRD-021").sku, category: p("PRD-021").category,
    zone: "Zone D", warehouse: "Warehouse D1", stock: 400, minStock: 150, status: "healthy",
    lastUpdated: "2026-03-01T15:00:00Z", addedDate: "2025-12-10T08:00:00Z",
    transactions: []
  },
  {
    id: "INV-022", product: p("PRD-022").name, sku: p("PRD-022").sku, category: p("PRD-022").category,
    zone: "Zone D", warehouse: "Warehouse D1", stock: 75, minStock: 100, status: "low",
    lastUpdated: "2026-02-25T12:00:00Z", addedDate: "2025-11-20T08:00:00Z",
    transactions: []
  },
];

export const systemStatuses: SystemStatus[] = [
  { label: "System Health", status: "online", detail: "All systems operational" },
  { label: "AI Model Status", status: "online", detail: "v3.2.1 — 97.8% accuracy" },
  { label: "Inventory Alerts", status: "warning", detail: "2 zones below threshold" },
  { label: "Zone Stability", status: "online", detail: "All zones stable" },
];
