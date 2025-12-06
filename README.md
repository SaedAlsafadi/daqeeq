# Cleanity - AI-Powered Cleaning Supply Forecasting Platform

<div align="center">

![Cleanity Logo](https://img.shields.io/badge/Cleanity-AI%20Powered-blue?style=for-the-badge)

**Smart Predictions • Cost Optimization • Real-Time Insights**

[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

</div>

---

## 🚀 Overview

Cleanity is a B2B SaaS platform that uses artificial intelligence to predict cleaning supply consumption for businesses. By analyzing facility specifications and historical usage patterns, Cleanity helps organizations:

- **Reduce Costs** by preventing over-ordering and understocking
- **Optimize Inventory** with accurate demand forecasting
- **Save Time** with automated supply predictions
- **Make Data-Driven Decisions** based on real usage patterns

## ✨ Key Features

### 🤖 AI-Powered Predictions
- Predict 8 different cleaning supply types
- 99.7%+ accuracy using ExtraTreesRegressor models
- Support for 14+ organization types
- Customizable prediction periods

### 📊 Smart Dashboard
- Real-time inventory monitoring
- Low stock alerts
- Order tracking
- Usage analytics and trends

### 🔮 Supply Types Predicted
1. Toilet Paper (sheets)
2. Hand Soap (mL)
3. Disinfectant (L)
4. Air Freshener (mL)
5. Glass Cleaner (mL)
6. Trash Bags (8 gallon)
7. Tissues (sheets)
8. Number of Workers Needed

### 🏢 Supported Organization Types
- Hotels & Hospitality
- Hospitals & Healthcare
- Schools & Universities
- Restaurants & Food Service
- Retail Stores
- Offices & Companies
- And 8+ more types

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│    React UI     │─────▶│  Express API    │─────▶│   Flask ML      │
│  (TypeScript)   │      │   (Node.js)     │      │   (Python)      │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────────────────────────────┐
│                                         │
│         Supabase (PostgreSQL)           │
│     Authentication & Database           │
│                                         │
└─────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Components**: Heroicons, React Toastify

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT + Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Security**: Helmet, CORS, Rate Limiting

### ML Service
- **Language**: Python 3.8+
- **Framework**: Flask
- **ML Library**: scikit-learn
- **Model**: ExtraTreesRegressor
- **Data Processing**: pandas, numpy
- **Model Serialization**: joblib

### Database & Auth
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (future)

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GP
   ```

2. **Start ML Service**
   ```bash
   cd ai-model
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   python app.py
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start Frontend**
   ```bash
   cd frontend-new
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:5001

📚 **For detailed setup instructions, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)**

## 🎯 Usage

### Making a Prediction

1. **Sign up** for a new account
2. **Log in** to your dashboard
3. Navigate to **AI Prediction** page
4. Enter your facility details:
   - Facility size (sqm)
   - Number of people
   - Number of bathrooms
   - Organization type
   - Cleaning frequency
   - Prediction period (days)
5. Click **Generate Prediction**
6. View detailed supply predictions

### Example API Request

```bash
curl -X POST http://localhost:5000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -d '{
    "facility_size_sqm": 1000,
    "number_of_people": 50,
    "number_of_bathrooms": 10,
    "organization_type": "Hotels",
    "cleaning_frequency": "Daily",
    "days_count": 30
  }'
```

## 📊 Model Performance

Our ML models achieve exceptional accuracy:

| Supply Type | R² Score | Avg MAE |
|------------|----------|---------|
| Toilet Paper | 0.9993 | 60,483 sheets |
| Hand Soap | 0.9994 | 8,416 mL |
| Disinfectant | 0.9970 | 3,815 L |
| Air Freshener | 1.0000 | 607 mL |
| Glass Cleaner | 0.9989 | 5,226 mL |
| Trash Bags | 0.9978 | 1,293 bags |
| Tissues | 0.9999 | 1,672 sheets |
| Workers Needed | 0.9998 | 0.33 workers |

## 📁 Project Structure

```
GP/
├── frontend-new/              # React TypeScript Frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard/    # Dashboard pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Prediction.tsx  # AI Prediction page
│   │   │   │   ├── Orders.tsx
│   │   │   │   └── ...
│   │   │   ├── Auth/         # Authentication pages
│   │   │   └── Landing/      # Landing page
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API services
│   │   │   └── predictionService.ts
│   │   ├── contexts/         # React contexts
│   │   └── layouts/          # Layout components
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Node.js Express Backend
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── predictions.js  # ML API proxy
│   │   │   ├── inventory.js
│   │   │   ├── orders.js
│   │   │   └── analytics.js
│   │   ├── models/           # Data models
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── server.js
│   └── package.json
│
├── ai-model/                  # Python ML Service
│   ├── models/               # Trained models
│   │   ├── preprocessor.joblib
│   │   └── et_model_*.joblib (8 models)
│   ├── app.py               # Flask API
│   ├── requirements.txt
│   └── README.md
│
├── docs/                      # Documentation
├── INTEGRATION_GUIDE.md       # Setup guide
├── START_SERVICES.md          # Quick start commands
└── README.md                  # This file
```

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ML_API_URL=http://localhost:5001
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### ML Service (.env)
```env
PORT=5001
FLASK_ENV=development
```

## 🧪 Testing

### Test ML Service
```bash
curl http://localhost:5001/health
```

### Test Backend
```bash
curl http://localhost:5000/health
```

### Test Prediction
```bash
curl -X POST http://localhost:5000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -d '{"facility_size_sqm":1000,"number_of_people":50,"number_of_bathrooms":10,"organization_type":"Hotels"}'
```

## 📈 Roadmap

### Current Features ✅
- [x] AI-powered supply predictions
- [x] User authentication
- [x] Dashboard overview
- [x] Prediction interface
- [x] ML model integration

### In Development 🚧
- [ ] Inventory management
- [ ] Order management
- [ ] Analytics dashboard
- [ ] Usage tracking

### Planned Features 🔮
- [ ] Multi-facility support
- [ ] Automated reordering
- [ ] Supplier integration
- [ ] Mobile app
- [ ] Export reports (PDF/Excel)
- [ ] Email notifications
- [ ] Cost optimization recommendations
- [ ] Blockchain integration for supply chain

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**Cleanity Development Team**

## 📧 Contact

For questions or support, please contact the development team.

---

<div align="center">

**Made with ❤️ by the Cleanity Team**

[Website](#) • [Documentation](INTEGRATION_GUIDE.md) • [API Docs](#) • [Support](#)

</div>