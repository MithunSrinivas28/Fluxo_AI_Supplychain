# 🚀 Fluxo v2 – ML-Powered Supply Chain Decision Engine

**Fluxo v2** is a production-grade, microservice-integrated backend system designed to solve the critical **demand-supply mismatch** in modern supply chains. Unlike a standard CRUD inventory app, Fluxo is a **Decision-Support System** that transforms raw historical data into actionable business intelligence using XGBoost-driven forecasting.

---

## 🧠 System Core Logic

When a retailer submits a demand request, Fluxo executes a high-fidelity inference pipeline:

1. **Identity & Access**: JWT validation and RBAC (Role-Based Access Control).
2. **Feature Extraction**: Hydrates the request with product metadata and **WeeklySales** lag features.
3. **Vectorization**: Constructs a strictly ordered **22-feature vector**.
4. **ML Inference**: Async call to a FastAPI microservice running triple XGBoost models.
5. **Risk Classification**: Business logic maps forecast intervals to stock risk levels.
6. **Persistence**: Stores the "Explainable Prediction" for future auditing.

---

## 🏗 Architecture Overview

* **Client**: UI/UX & Data Visualization (React Planned)
* **API Gateway**: Auth, Validation, & Feature Engineering (**Node.js + Express**)
* **Inference Engine**: ML Model Serving & Interval Computing (**FastAPI + XGBoost**)
* **Database**: Metadata & Prediction Persistence (**MongoDB**)

### Tech Stack Comparison

| Component | Technology | Role |
| --- | --- | --- |
| **Backend** | Node.js, Express | API Gateway & Feature Logic |
| **Database** | MongoDB, Mongoose | Persistence & History |
| **ML Service** | FastAPI, Python | XGBoost Model Serving |
| **Security** | JWT, Bcrypt | Auth & Role Security |

---

## 📁 Project Structure

### 🟢 Backend (Express)

* `src/config/`: Database & Env configuration
* `src/controllers/`: Auth & Request logic handlers
* `src/middlewares/`: JWT protection & Role-based authorization
* `src/models/`: Mongoose Schemas (User, Product, WeeklySales, DemandRequest)
* `src/routes/`: Express Router definitions
* `src/services/`: Core Business & ML Microservice communication

### 🟡 ML Microservice (FastAPI)

* `models/`: Serialized XGBoost (.pkl) - (Median, Lower, and Upper bounds)
* `app.py`: Inference API Endpoints
* `requirements.txt`: Python dependencies (XGBoost, FastAPI, Joblib)

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Permissions | Use Case |
| --- | --- | --- |
| **Admin** 👑 | Full system visibility | Supply chain oversight & auditing |
| **Retailer** 🛒 | Create requests, view own predictions | Daily ordering & procurement |
| **Warehouse** 📦 | View inventory & regional requests | Fulfillment & logistics planning |

---

## 📊 ML Feature Engineering

The system reconstructs the training environment by generating **22 features** in real-time to ensure model accuracy:

* **Core Numerical (9):** `current_price`, `base_price`, `discount_percent`, `year_growth`, `month`, `is_festival`, `product_id`, `lag_1`, `lag_2`.
* **One-Hot Encoded Zone (3):** South, West, East (North as baseline).
* **One-Hot Encoded Warehouse (2):** B, C (A as baseline).
* **One-Hot Encoded Category (8):** Dairy, Poultry, Grains, Vegetables, Fruits, Electronics, Raw Materials, Furniture.

---

## ⚡ Risk Engine Logic

Fluxo translates probabilistic intervals into concrete business decisions using the following decision logic:

> **Business Rule Classification:**
> * If `requested_quantity` > `upper_bound` → **High Overstock Risk** 🚩
> * If `requested_quantity` < `lower_bound` → **Understock Risk** ⚠️
> * Otherwise → **Balanced** ✅
> 
> 

---

## 🔌 API Documentation

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | New user onboarding |
| `POST` | `/auth/login` | Public | JWT generation & Role assignment |
| `POST` | `/requests` | Bearer JWT | Submit SKU for ML Analysis & Risk Check |
| `GET` | `/requests` | Bearer JWT | Fetch history based on role permissions |

---

## 🚀 Getting Started

### 1. Launch ML Service

```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000

```

### 2. Launch Backend

```bash
cd backend
npm install
npm run dev

```

---

## 👨‍💻 Author

**Mithun S**
*Aspiring Software Engineer*
*Final Year Engineering Project | System Design & AI Integration*

---

**Status:** Backend Stable | ML Integration Complete | Ready for Frontend + RAG Layer

---

**Would you like me to generate the `docker-compose.yml` file to run both the Node.js and FastAPI services simultaneously?**
