# 🏗️ Cleanity - Complete Tech Stack Documentation

## Project Overview
**Daqeeq** is an AI-Powered Cleaning Supply Forecasting Platform for B2B applications with integrated feedback system, draft management, and service provider ratings.

---

## 📱 Frontend Stack

### Framework & Build
- **React**: 18.2.0 - UI component library
- **TypeScript**: Type-safe development
- **Vite**: Modern build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS transformation tool

### State Management & Context
- **React Context API**: Global state management
- **React Hooks**: useState, useContext, useEffect

### Routing & Navigation
- **React Router DOM**: 6.8.0 - Client-side routing

### HTTP Client
- **Axios**: 1.3.0 - HTTP requests to backend

### UI Components & Utilities
- **React Icons**: 4.7.1 - Icon library
- **React Toastify**: 9.1.1 - Notifications/toast messages
- **React Hook Form**: 7.43.0 - Form state management
- **StarRating**: Custom component for 5-star ratings

### Development Tools
- **ESLint**: Code quality and standards
- **TypeScript Config**: Strict type checking

### Environment Management
- **.env.example** & **.env** - Configuration management

---

## 🔧 Backend Stack

### Framework & Runtime
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework (implied from structure)
- **JavaScript (ES6+)**: Primary language

### Authentication & Security
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing (standard for Node.js auth)
- **CORS**: Cross-origin resource sharing

### Database
- **PostgreSQL/Supabase**: Relational database
- **SQL**: Schema design and migrations

### HTTP & API
- **Axios** (frontend) / Fetch (backend) - HTTP requests

### Key Packages & Utilities
- **dotenv**: Environment variable management (.env)
- **uuid**: Unique identifier generation

### API Endpoints

#### Authentication Routes
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Token verification

#### Predictions Routes
- `POST /api/predictions/create` - Generate AI predictions
- `GET /api/predictions` - Retrieve user predictions
- `GET /api/predictions/:id` - Get specific prediction

#### Quotation Routes
- `POST /api/quotations/save-draft` - Save predictions as draft
- `GET /api/quotations/drafts` - List user's drafts
- `POST /api/quotations/continue-draft/:id` - Resume draft
- `DELETE /api/quotations/drafts/:id` - Delete draft
- `POST /api/quotations/request` - Send quotation request to provider
- `GET /api/quotations/requests` - View quotation requests

#### Feedback Routes
- `GET /api/feedback/prediction-history` - Get quotation requests for feedback
- `POST /api/feedback/submit` - Submit supply feedback
- `POST /api/feedback/provider-rating` - Rate service provider
- `GET /api/feedback/provider/:provider_id/ratings` - View provider ratings
- `GET /api/feedback/analytics` - Feedback analytics

#### Analytics Routes
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/accuracy` - Prediction accuracy metrics
- `GET /api/analytics/feedback-summary` - Feedback aggregation

#### Model Training Routes
- `GET /api/model-training/jobs` - View training jobs
- `POST /api/model-training/trigger` - Trigger model retraining
- `GET /api/model-training/status` - Training job status

#### Health Check
- `GET /health` - API health status

---

## 🤖 AI/ML Stack

### Framework & Libraries
- **Python**: 3.8+ - Primary ML language
- **scikit-learn**: Machine learning algorithms
  - ExtraTreesRegressor (ET) - Prediction model
  - StandardScaler - Feature preprocessing
  
- **pandas**: 1.x - Data manipulation and analysis
- **numpy**: Numerical computations
- **joblib**: Model serialization/deserialization

### Database Connectivity
- **psycopg2-binary**: PostgreSQL Python adapter

### Model Management
- **Pre-trained Models**: 8 serialized .joblib files
  - `et_model_air_freshener_mL.joblib`
  - `et_model_disinfectant_L.joblib`
  - `et_model_glass_cleaner_mL.joblib`
  - `et_model_hand_soap_mL.joblib`
  - `et_model_nonbathroom_tissue_sheets.joblib`
  - `et_model_number_of_workers.joblib`
  - `et_model_toilet_paper_sheets.joblib`
  - `et_model_trash_bags_8gallon.joblib`
  - `preprocessor.joblib` - Feature preprocessor

### Data Pipeline
- **Model Training**: Fine-tuning on feedback data
- **Feature Engineering**: Facility size, people count, bathrooms, cleaning frequency
- **Prediction Pipeline**: Input → Preprocessing → Model → Output

### Flask/API
- **Flask**: Python web framework (implied from app.py structure)
- **Routing**: API endpoints for predictions and training

---

## 📊 Database Schema

### Core Tables
1. **companies** - Organization data
2. **users** - User accounts and roles
3. **products** - Cleaning supplies catalog
4. **product_categories** - Product classification

### Prediction & Quotation Flow
5. **predictions** - AI model outputs
   - Fields: facility_size_sqm, number_of_people, number_of_bathrooms, cleaning_frequency, predictions (JSONB), **status** (draft/completed)
   - Index: (company_id, status, created_at DESC)

6. **quotation_requests** - Business transaction records
   - Fields: request_number, provider_id, prediction_id, status, quoted_amount, dates
   - Relationships: Links predictions → service_providers

7. **quotation_request_items** - Individual items in quotation
   - Fields: item_name, quantity, unit, unit_price, total_price

8. **service_providers** - Supplier information
   - Fields: company_name, email, phone, specialization[], capacity_level, rating
   - New fields: quality_rating_avg, delivery_rating_avg, price_rating_avg, total_ratings_count

### Feedback & Rating System
9. **supply_feedback** - User feedback on predictions
   - Fields: prediction_id, actual_quantity, days_until_reorder, accuracy_status, variance_percent

10. **provider_ratings** - Service provider ratings
    - Fields: provider_id, quotation_request_id, quality_rating, delivery_rating, price_rating, notes (1-5 scale)
    - Relationships: Links to service_providers, quotation_requests

11. **provider_reviews** - Extended provider reviews
    - Fields: rating, quality_rating, delivery_rating, price_rating, service_rating

### System Tables
12. **inventory** - Current stock levels
13. **usage_patterns** - Historical usage data
14. **demand_forecasts** - Forecast records
15. **alerts** - System notifications
16. **audit_log** - Change tracking
17. **model_training_jobs** - ML training job tracking

### Features
- **Timestamps**: created_at, updated_at on all core tables
- **Foreign Keys**: Referential integrity with CASCADE delete
- **Indexes**: Performance optimization on frequently queried columns
- **Triggers**: Auto-update updated_at timestamps

---

## 🔄 Data Flow Architecture

```
User Input (Facility Details)
    ↓
AI Model (Python - scikit-learn)
    ↓
Predictions (Store in DB with status='draft' or 'completed')
    ↓
[Option 1: Save as Draft] → Draft List → Continue Later
[Option 2: Send Quotation] → Quotation Request → Service Provider
    ↓
Provider Response → Quotation Response
    ↓
Feedback Submission
    ├─ Supply Usage Feedback (accuracy calc)
    ├─ Worker Satisfaction Rating
    └─ Provider Rating (Quality, Delivery, Price)
    ↓
Auto-aggregated Provider Ratings → Displayed on Selection
    ↓
30+ Feedbacks → Auto-trigger Model Retraining
    ↓
Improved Predictions
```

---

## 🗄️ Database Migrations

1. **001_quotation_system.sql** - Creates quotation workflow tables
   - service_providers
   - predictions
   - quotation_requests
   - quotation_request_items
   - provider_reviews

2. **add_prediction_status.sql** - Draft system support
   - Adds `status` column to predictions
   - Creates compound index for draft queries

3. **add_provider_ratings.sql** - Provider rating system
   - Creates provider_ratings table
   - Adds aggregate rating columns to service_providers

4. Other migrations:
   - create_supply_feedback_table.sql
   - create_model_training_jobs_table.sql
   - add_company_name_and_job_title.sql
   - add_organization_type.sql

---

## 🎨 Frontend Components

### Pages
- **Dashboard** - Main interface hub
- **AIPredictor** - Prediction generation
- **SupplyFeedback** - Feedback submission interface
  - Grouped by quotation requests
  - Three feedback sections (supplies, workers, provider rating)
- **Analytics** - Dashboard analytics and metrics

### Core Components
- **StarRating** - 5-star rating component
- **Sidebar** - Navigation menu
- **Auth Forms** - Login/signup
- **Prediction Form** - Input collection

### Services
- **authService** - Authentication logic
- **analyticsService** - Analytics data fetching (FIXED import)
- **feedbackService** - Feedback submission and retrieval
- **quotationService** - Draft and quotation management
- **predictionService** - AI prediction calls

### Context
- **AuthContext** - User authentication state
- **CompanyContext** - Company information state

---

## 🚀 Deployment & Infrastructure

### Local Development
- Frontend: http://localhost:5173 (Vite)
- Backend: http://localhost:5000 (Express)
- Database: Supabase (PostgreSQL)
- AI Model: http://localhost:5000/api (integrated)

### Production Deployment
- **Frontend**: Build with Vite → Serve static assets
- **Backend**: Node.js server with Express
- **Database**: Supabase PostgreSQL
- **AI Model**: Python Flask API integrated with backend

---

## 📦 Key Features by Tech

### Real-time Feedback System
- **Frontend**: React hooks + Toastify notifications
- **Backend**: Express endpoints + database updates
- **Database**: supply_feedback, provider_ratings tables
- **ML**: Auto-triggers retraining when count reaches 30

### Draft Management
- **Frontend**: Form state + local storage
- **Backend**: /save-draft, /drafts endpoints
- **Database**: predictions table with status column + index
- **Query**: (company_id, status, created_at DESC) for efficiency

### Provider Rating System
- **Frontend**: StarRating components
- **Backend**: /provider-rating endpoint
- **Database**: provider_ratings table + aggregate columns
- **Auto-aggregation**: DECIMAL(3,2) averages on insert

### Analytics Dashboard
- **Frontend**: React components + charts (implied)
- **Backend**: /analytics endpoints
- **Database**: Aggregation queries on supply_feedback, provider_ratings
- **Service**: analyticsService.ts with proper imports

---

## 📋 Environment Variables

### Backend (.env)
- DATABASE_URL - PostgreSQL connection
- JWT_SECRET - Token signing key
- PYTHON_API_URL - AI model endpoint
- NODE_ENV - development/production

### Frontend (.env)
- VITE_API_URL - Backend API endpoint (typically http://localhost:5000)

### AI Model (.env)
- DATABASE_URL - PostgreSQL connection
- API_PORT - Flask server port

---

## 🔒 Security Features

- **JWT Authentication** - Token-based API security
- **Password Hashing** - bcrypt for user passwords
- **CORS** - Cross-origin protection
- **SQL Injection Prevention** - Parameterized queries
- **User Isolation** - company_id-based data filtering
- **Audit Logging** - audit_log table for compliance

---

## 📊 Performance Optimizations

### Database Indexes
- Compound indexes on (company_id, status, created_at)
- Single indexes on frequently queried foreign keys
- Partial indexes on active/verified status

### Caching Opportunities
- Provider ratings aggregates cached in service_providers table
- Predictions can be cached at frontend level
- Model serialization reduces inference time

### Query Optimization
- JSONB columns for flexible data
- Materialized views for analytics (future)
- Connection pooling at database layer

---

## 🧪 Testing

- **Frontend**: Jest + React Testing Library (via react-scripts)
- **Backend**: Implied testing structure in /tests directory
- **API**: Manual testing with curl or Postman
- **ML**: Model validation scripts (train_with_feedback.py, test_api.py)

---

## 📚 Documentation Files

### Active Documentation
- **README.md** - Project overview
- **START_HERE.md** - Quick start guide
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **MODEL_TRAINING_SYSTEM.md** - ML training documentation
- **TECH_STACK.md** - This file (complete tech reference)

---

## Version History

### Current Version
- **Frontend**: React 18.2.0 with TypeScript + Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL 13+
- **Python**: 3.8+
- **scikit-learn**: Latest stable

### Key Implementations
1. ✅ AI Prediction System
2. ✅ Draft Management (Save predictions)
3. ✅ Quotation Request System
4. ✅ Supply Feedback Collection
5. ✅ Provider Rating System (Quality, Delivery, Price)
6. ✅ Auto-aggregating Ratings
7. ✅ Analytics Dashboard
8. ✅ Model Auto-retraining (30+ feedbacks)

---

## 🎯 Key Metrics

- **Prediction Accuracy**: Tracked in confidence_score (0-1 scale)
- **Model Performance**: R² scores in model_training_jobs
- **Provider Quality**: Aggregated from provider_ratings (1-5 scale)
- **System Usage**: Tracked in audit_log for all changes

---

**Last Updated**: 2024  
**Project Status**: Active Development  
**Deployment Ready**: Yes (pending DB migrations)