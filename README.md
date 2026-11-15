<div align="center">

# Daqeeq · دقيق

**AI-powered cleaning-supply forecasting and procurement platform**

Graduation project · B.Sc. Computer Science · Imam Mohammad Ibn Saud Islamic University (2026)

![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikitlearn&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_(PostgreSQL)-3FCF8E?style=flat&logo=supabase&logoColor=white)

</div>

---

## Overview

Daqeeq helps organizations such as hotels, hospitals, schools, offices and malls plan their cleaning-supply needs. They enter a facility profile, and Daqeeq predicts how much of each supply they will use over a chosen period. The platform then connects them with suppliers and service providers to request quotations and manage the procurement process.

The system has three services:

- a **React + TypeScript** web app, bilingual in English and Arabic with full RTL support;
- a **Node.js / Express** REST API;
- a **Python / Flask** machine-learning service that serves the forecasting models.

## Features

**For client organizations**
- **AI demand prediction.** Forecasts eight supply targets from facility size, number of people, number of bathrooms, organization type, cleaning frequency and period length.
- **Dashboard and analytics.** Shows an overview of predictions, requests and usage.
- **Quotation requests.** Send supply requests to suppliers and service providers, and track their status.
- **Supplier management.** Lists and manages the suppliers an organization works with.
- **Supply feedback.** Report actual consumption so it can be compared with the predictions.
- **Notifications** and **profile/settings**.

**For service providers**
- Onboarding and a provider profile
- Incoming request management, analytics and communication with clients

**For administrators**
- Reviewing the feedback submitted by clients
- Admin communications

**Platform**
- **Feedback-driven retraining.** Collected feedback can be exported in training format (`/api/model-training`). `ai-model/train_with_feedback.py` retrains the models on it.
- **Bilingual UI.** English/Arabic through i18next, with RTL layout and light/dark themes.
- **Role-based access.** Four roles: `client`, `supplier`, `service_provider` and `admin`. Authentication uses JWT, and passwords are hashed with bcrypt.
- **API hardening.** Helmet, CORS, rate limiting and request validation.

## Forecast targets

| # | Target | Unit |
|---|---|---|
| 1 | Toilet paper | sheets |
| 2 | Hand soap | mL |
| 3 | Disinfectant | L |
| 4 | Air freshener | mL |
| 5 | Glass cleaner | mL |
| 6 | Trash bags (8 gallon) | bags |
| 7 | Tissues | sheets |
| 8 | Cleaning workers needed | workers |

Supported organization types: Airports, Banks, Colleges, Companies, Gyms, Hospitals, Hotels, Libraries, Restaurants, Retail Stores, Schools, Shopping Malls, Storage Facilities and Warehouses.

### Model

Each target has its own **ExtraTreesRegressor** model (scikit-learn), plus a shared preprocessor. Reported validation results:

| Target | R² | MAE |
|---|---|---|
| Toilet paper | 0.9993 | 60,483 sheets |
| Hand soap | 0.9994 | 8,416 mL |
| Disinfectant | 0.9970 | 3,815 L |
| Air freshener | 1.0000 | 607 mL |
| Glass cleaner | 0.9989 | 5,226 mL |
| Trash bags | 0.9978 | 1,293 bags |
| Tissues | 0.9999 | 1,672 sheets |
| Workers needed | 0.9998 | 0.33 workers |

> The trained model files (`ai-model/models/*.joblib`) are excluded from version control by `.gitignore`. Place them in `ai-model/models/` before starting the ML service.

## Architecture

```
┌────────────────────┐   REST    ┌────────────────────┐   HTTP    ┌────────────────────┐
│  React + TS (Vite) │ ────────▶ │   Express API      │ ────────▶ │  Flask ML service  │
│  EN / AR · RTL     │           │   JWT · RBAC       │           │  ExtraTrees models │
└────────────────────┘           └─────────┬──────────┘           └────────────────────┘
                                           │
                                           ▼
                                 ┌────────────────────┐
                                 │ Supabase / Postgres│
                                 └────────────────────┘
```

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, i18next, ApexCharts, Framer Motion, Axios |
| Backend | Node.js 18+, Express, Supabase JS client, `pg`, JWT, bcrypt, express-validator, Helmet, express-rate-limit, Morgan |
| ML service | Python, Flask, scikit-learn, pandas, NumPy, joblib |
| Database | PostgreSQL through Supabase (`backend/database/schema.sql`). An alternative Railway schema is in `schema-railway.sql`, and incremental migrations are in `backend/database/migrations/` |

## Project structure

```
├── frontend-new/            # React + TypeScript web app (Vite)
│   └── src/
│       ├── pages/           # Landing, Auth, Dashboard (client · provider · admin), SupplierContact
│       ├── components/      # Shared UI (ProtectedRoute, LanguageSwitcher, …)
│       ├── layouts/         # Dashboard layout, header, sidebar
│       ├── services/        # API clients (predictions, quotations, feedback, …)
│       ├── contexts/        # Auth and theme contexts
│       └── i18n/            # English and Arabic translations
├── backend/                 # Express REST API
│   ├── app/routes/          # auth, predictions, quotations, suppliers, contracts, feedback, …
│   ├── config/              # Database clients
│   ├── database/            # Schemas and SQL migrations
│   └── server.js
└── ai-model/                # Flask ML service
    ├── app.py               # /health, /predict, /predict/<target>, /models/info
    └── train_with_feedback.py
```

## Getting started

**Prerequisites:** Node.js 18+, Python 3.8+, and a Supabase (PostgreSQL) project.

```bash
# 1. ML service (port 5001)
cd ai-model
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python app.py

# 2. Backend API (port 5000)
cd backend
npm install
cp .env.example .env        # add your Supabase URL/keys and JWT secret
npm run dev

# 3. Frontend (port 5173)
cd frontend-new
npm install
npm run dev
```

Run `backend/database/schema.sql`, and then the files in `backend/database/migrations/`, against your database before first use.

### Example prediction request

```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "facility_size_sqm": 1000,
    "number_of_people": 50,
    "number_of_bathrooms": 10,
    "organization_type": "Hotels",
    "cleaning_frequency": "Medium",
    "days_count": 30
  }'
```

See [`ai-model/README.md`](ai-model/README.md) for the full ML API reference.

## Maintainer

**Saed Alsafadi** · [LinkedIn](https://www.linkedin.com/in/saedalsafadi) · [GitHub](https://github.com/SaedAlsafadi)
