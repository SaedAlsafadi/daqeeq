# Daqeeq ML Prediction Service

This is the machine learning API service for Daqeeq that provides AI-powered predictions for cleaning supply consumption.

## Overview

The ML service uses **ExtraTreesRegressor** models trained on historical data to predict 8 different cleaning supply needs:

1. **Total Toilet Paper Sheets**
2. **Hand Soap (mL)**
3. **Disinfectant (L)**
4. **Air Freshener (mL)**
5. **Glass Cleaner (mL)**
6. **Trash Bags (8 gallon)**
7. **Total Tissues (sheets)**
8. **Number of Workers**

## Model Performance

The models achieve exceptional accuracy with:
- **Average R² Score**: 0.997-1.000
- **Low Mean Absolute Error** across all predictions
- Trained on diverse facility types and usage patterns

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. **Navigate to the ai-model directory:**
   ```bash
   cd ai-model
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env if needed (defaults should work for local development)
   ```

## Running the Service

Start the ML API server:

```bash
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```
Check if the ML service is running and models are loaded.

### Models Info
```
GET /models/info
```
Get information about available models, organization types, and input requirements.

### Make Prediction (All Supplies)
```
POST /predict
```

**Request Body:**
```json
{
  "facility_size_sqm": 1000,
  "number_of_people": 50,
  "number_of_bathrooms": 10,
  "days_count": 30,
  "cleaning_frequency": "Medium",
  "organization_type": "Hotels"
}
```

**Cleaning Frequency Values:**
- `"High"` - High frequency cleaning (encoded as 2)
- `"Medium"` - Medium frequency cleaning (encoded as 1)
- `"Low"` - Low frequency cleaning (encoded as 0)

**Response:**
```json
{
  "success": true,
  "predictions": {
    "Total_Toilet_Paper_Sheets": 12345.67,
    "Hand soap (mL)": 1234.56,
    "Disinfectant (L)": 123.45,
    "Air freshener (mL)": 234.56,
    "Glass cleaner (mL)": 345.67,
    "Trash_Bags (8 gallon)": 45.67,
    "Total_Tissues": 6789.01,
    "Number_of_Workers": 3.45
  },
  "input_features": { ... }
}
```

### Make Prediction (Single Target)
```
POST /predict/{target}
```
Predict a single supply type (e.g., `/predict/toilet_paper_sheets`)

## Input Parameters

### Required Fields
- `facility_size_sqm` (number): Size of the facility in square meters
- `number_of_people` (number): Number of people using the facility
- `number_of_bathrooms` (number): Number of bathrooms in the facility
- `organization_type` (string): Type of organization (see below)

### Optional Fields
- `days_count` (number): Prediction period in days (default: 30)
- `cleaning_frequency` (string): `"Low"`, `"Medium"` or `"High"` (default: `"Medium"`)

### Organization Types
- Airports
- Banks
- Gyms
- Hospitals
- Hotels
- Libraries
- Restaurants
- Retail Stores
- Schools
- Shopping Malls
- Storage Facilities
- Warehouses
- college
- company

### Cleaning Frequencies
- `Low` (encoded as 0)
- `Medium` (encoded as 1, default)
- `High` (encoded as 2)

## Model Files

Models are loaded from the `models/` directory (the `.joblib` files are not committed to this repository):
- `preprocessor.joblib` - Feature scaler and preprocessor
- `et_model_*.joblib` - Individual ExtraTreesRegressor models for each target

## Testing the API

You can test the API using curl:

```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "facility_size_sqm": 1000,
    "number_of_people": 50,
    "number_of_bathrooms": 10,
    "organization_type": "Hotels"
  }'
```

## Troubleshooting

### Models not loading
- Ensure all `.joblib` files are in the `models/` directory
- Check file permissions
- Verify scikit-learn version compatibility

### Port already in use
- Change the port in `.env` file:
  ```
  PORT=5002
  ```

### CORS errors
- The service is configured to allow all origins by default
- For production, configure CORS properly in `app.py`

## Development

To modify or retrain models:
1. Update the preprocessing notebook
2. Train new models
3. Export models to `models/` directory
4. Restart the service

## Production Deployment

For production deployment:
1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5001 app:app
   ```
3. Configure proper CORS settings
4. Set up monitoring and logging
5. Use environment variables for sensitive configuration

## Dependencies

- Flask: Web framework
- scikit-learn: Machine learning library
- pandas: Data manipulation
- numpy: Numerical computing
- joblib: Model serialization
- flask-cors: CORS handling
