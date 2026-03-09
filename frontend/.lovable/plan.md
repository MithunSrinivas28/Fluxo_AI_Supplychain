

# Fluxo AI — Supply Chain Intelligence Platform

A clean, professional, light-themed frontend for an AI-powered supply chain intelligence platform. Frontend-only with mock data, ready for future backend integration.

## Design Direction
- **Light theme only** — soft warm neutral background, no pure white
- **Deep cobalt blue** primary accent, teal for AI signals, amber for alerts
- **No black, no neon, no gradients** — clean, intelligent, structured aesthetic
- Subtle animations with Framer Motion
- Soft shadows for elevation

## Pages & Features

### 1. Authentication (Mock)
- **Login page** — clean form with email/password, role selection
- **Register page** — matching registration form
- Mock AuthContext with roles: admin, retailer, warehouse
- Role-based rendering throughout the app

### 2. Layout System
- **Sidebar** (240px) — light surface, thin right border, clean icons + labels, subtle active indicator (thin left blue line), smooth hover
- **Topbar** — page title left, search input center, notifications + profile avatar right
- Routes: Dashboard, Requests, Inventory, Admin, Profile

### 3. Dashboard
- Title with short description and system status indicator
- **4 KPI MetricCards** — large numeric value, label, subtle trend indicator (e.g., Total Orders, Revenue, Inventory Health, AI Accuracy)
- **Primary Analytics Section** — large LineChart with time filters (7D / 30D / 90D)
- **Activity Table** — clean table with soft row hover (Activity, Date, Status)
- **Status Panel** — System Health, AI Model Status, Inventory Alerts, Zone Stability with StatusDot components

### 4. Requests Page
- Retailer demand simulation view
- List/table of supply requests with status badges

### 5. Inventory Page
- Warehouse inventory management view
- Stock levels, alerts, zone breakdown

### 6. Admin Page
- Admin analytics overview
- ML-based decision insights display

### 7. Profile Page
- User profile display and settings

## Reusable UI Components
- Card, Badge, Button, StatusDot, MetricCard
- LineChart and BarChart (Recharts — clean, subtle grid, muted colors, clean tooltips)

## Technical Approach
- Clean folder structure with organized components, pages, services, hooks, and context
- Strict TypeScript types throughout
- Structured mock data (no real API calls yet)
- Axios instance placeholder for future backend wiring
- Recharts for all data visualizations

