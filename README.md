# 🚀 Fluxo v2 – AI-Powered Supply Chain Decision Platform 

Fluxo v2 is a decision-support system designed to model and analyze demand–supply mismatches across regions using synthetic data and machine learning.

This backend is built using the MERN stack principles and is structured to support:

- Multi-user authentication (JWT-based)
- Role-based access control (Admin, Retailer, Warehouse)
- Demand request simulation & persistence
- Inventory management
- ML-ready prediction pipeline
- Scalable SaaS-style architecture

---

# 🧠 Project Vision

Fluxo v2 is not just an inventory system.

It is a **global forecasting engine** trained on synthetic supply chain data that:

- Learns inter-zone demand patterns
- Predicts KPIs for new retailer requests
- Allows warehouse-side inventory visibility
- Separates training data from live inference data

The system is designed for future integration with:
- ML model training pipelines
- RAG / LLM-based analytics
- Advanced workflow engines

---


## Layers

- **Routes** – Define API endpoints
- **Controllers** – Handle HTTP logic
- **Services** – Contain business logic
- **Models** – Mongoose schemas
- **Middlewares** – Authentication, authorization, error handling

---

# 🔐 Authentication & Authorization

## JWT Authentication

- Token-based authentication
- Token sent via `Authorization: Bearer <token>` header
- Middleware verifies token and attaches user to `req.user`

## Role-Based Access Control

Supported roles:

| Role       | Capabilities |
|------------|--------------|
| Admin      | Insert synthetic data, train model, full access |
| Retailer   | Submit demand requests, view predictions |
| Warehouse  | Manage inventory, view requests affecting zone |

Middleware:
- `protect` → verifies JWT
- `authorize` → checks allowed roles

---

# 📦 Data Models

## 1️⃣ User

- name
- email
- password (hashed with bcrypt)
- role (admin / retailer / warehouse)

---

## 2️⃣ Demand (Training Data)

Used for synthetic historical data and ML training.

- region
- category
- quantity
- date
- sku

---

## 3️⃣ DemandRequest (Live Retailer Inference)

Represents retailer intent and prediction results.

- product
- fromZone
- toZone
- quantity
- predictedKPI
- status (`temporary` / `saved`)
- retailer (User reference)
- targetWarehouseZone

Temporary requests are not stored.
Saved requests are persisted.

---

## 4️⃣ Inventory

Warehouse-managed stock levels.

- warehouseZone
- product
- stockLevel
- updatedBy (User reference)

Uses `upsert` logic for efficient updates.

---

# 📡 API Endpoints

## 🔑 Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login & receive JWT |

---

## 📊 Demand (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/demand` | Insert synthetic training data |
| GET | `/demand` | Retrieve filtered demand data |

---

## 🧾 Demand Requests

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/requests` | Retailer |
| GET | `/requests` | Retailer / Warehouse / Admin |

Behavior:
- `temporary` → prediction only
- `saved` → stored in database

---

## 📦 Inventory

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/inventory` | Warehouse |
| GET | `/inventory` | Warehouse / Admin |

---
## 🧠 Design Decisions

- Separation of training data and live inference
- Single global ML model (no per-user training)
- Role-based access to business logic
- Lean MVP workflow (no approval engine yet)
- Frontend-ready structured API


## 🚀 Future Enhancements

- Real ML model integration
- Approval workflow for requests
- Dashboard analytics
- RAG / LLM analytics explanation layer
- Multi-tenant support
- Model retraining triggers


## 📌 Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt
- Clean service-layer architecture


## 👨‍💻 Author

Built as part of a final-year engineering project focused on:

- System design  
- Backend architecture  
- AI + supply chain modeling  
- Scalable SaaS design patterns  
