# Technical Documentation: Stroke Prediction Using Machine Learning

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup and Installation](#setup-and-installation)
6. [Backend API Documentation](#backend-api-documentation)
7. [Frontend Architecture](#frontend-architecture)
8. [Machine Learning Models](#machine-learning-models)
9. [Database Schema](#database-schema)
10. [Deployment](#deployment)
11. [Security Features](#security-features)

---

## Project Overview

**Stroke Prediction Using Machine Learning** is a comprehensive healthcare application that leverages both Machine Learning (ML) and Deep Learning (DL) models to predict the risk of stroke in patients. The system provides medical professionals with:

- Patient management and history tracking
- ML and DL-based stroke prediction
- Patient trend analysis
- Medical imaging support (CT, MRI, X-ray)
- PDF report generation
- User authentication and authorization
- Real-time performance monitoring

**Target Users:** Healthcare professionals (doctors, medical staff)  
**Primary Function:** Early detection and risk assessment for stroke prediction

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│         (Dashboard, Patient Management, Predictions)         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ REST API
┌────────────────────▼────────────────────────────────────────┐
│             Backend (Flask Python)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Authentication & Authorization (JWT)                 │   │
│  │ Rate Limiting & Security                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ML Model Pipeline         │ DL Model Pipeline        │   │
│  │ - Random Forest          │ - TensorFlow/Keras       │   │
│  │ - Feature Scaling        │ - Neural Network         │   │
│  │ - Prediction Engine      │ - Image Analysis         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Data Processing & Report Generation                  │   │
│  │ - PDF Generation (ReportLab)                         │   │
│  │ - Image Handling                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────┬──────────────────────────┬──────────────────────────┘
       │                          │
┌──────▼────────────────┐ ┌──────▼────────────────┐
│   SQLite/MySQL DB     │ │  Model Storage        │
│  - Users              │ │  - stroke_dl_model.h5│
│  - Patients           │ │  - ML Model Files    │
│  - Predictions        │ │  - Upload Directory  │
└───────────────────────┘ └──────────────────────┘
```

---

## Technology Stack

### Backend

- **Framework:** Flask 3.0.0
- **Database:** SQLAlchemy (supports SQLite, MySQL, PostgreSQL)
- **Authentication:** Flask-JWT-Extended, Flask-Bcrypt
- **API Utilities:** Flask-CORS, Flask-Limiter
- **ML Engine:** scikit-learn, TensorFlow/Keras
- **Data Processing:** pandas, numpy
- **Visualization:** matplotlib, seaborn
- **Report Generation:** ReportLab
- **Task Queue:** Celery, Redis (optional)
- **Environment:** python-dotenv, 3.11+

### Frontend

- **Framework:** React 18.2.0 with Vite
- **Routing:** react-router-dom 6.20.0
- **HTTP Client:** axios 1.6.2
- **UI Components:** Recharts (charts), Lucide React (icons)
- **Styling:** Tailwind CSS 3.4.0
- **Build Tool:** Vite 7.2.1

### Deployment

- **Containerization:** Docker & Docker Compose
- **Base Images:** node:18-alpine (frontend), python:3.11-slim (backend)
- **Reverse Proxy:** (Nginx recommended)

---

## Project Structure

```
stroke-prediction/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── models.py              # Database models (User, Patient, Prediction)
│   ├── ml_model.py            # ML model training & inference
│   ├── dl_model.py            # Deep Learning model pipeline
│   ├── pdf_generator.py       # PDF report generation
│   ├── train_models.py        # Model training scripts
│   ├── check_data.py          # Data validation utilities
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # Trained model files
│   │   └── stroke_dl_model.h5 # DL model (HDF5 format)
│   ├── uploads/               # Patient image uploads
│   │   ├── Normal/
│   │   └── Stroke/
│   └── instance/              # Flask instance folder
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Root component
│   │   ├── index.css          # Global styles
│   │   ├── api.js             # Axios API service
│   │   ├── AuthContext.jsx    # Authentication context
│   │   ├── components/
│   │   │   └── Navbar.jsx     # Navigation component
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Patients.jsx
│   │       ├── PatientDetails.jsx
│   │       ├── PatientHistory.jsx
│   │       ├── PatientTrends.jsx
│   │       ├── PredictionForm.jsx
│   │       └── ModelPerformance.jsx
│   ├── public/                # Static assets
│   ├── package.json           # npm dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── postcss.config.js      # PostCSS config
│
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose configuration
├── start.bat                  # Windows startup script
└── TECHNICAL_DOCUMENTATION.md # This file
```

---

## Setup and Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- Git

### Local Development Setup

#### 1. Clone and Navigate

```bash
cd "C:\Users\krish\projects\Stroke Prediction Using Machine Learning"
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy and configure:
# SECRET_KEY=your-secret-key
# JWT_SECRET_KEY=your-jwt-secret
# DATABASE_URL=sqlite:///stroke_prediction.db
# UPLOAD_FOLDER=uploads
# MAX_CONTENT_LENGTH=16777216
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### 4. Run Application

```bash
# Terminal 1: Backend
cd backend
. venv/Scripts/activate  # or source venv/bin/activate on Unix
python app.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Access Points:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Docker Deployment

```bash
# Build and run using Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:80
# Backend: http://localhost:5000
```

---

## Backend API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User

```
POST /auth/register
Content-Type: application/json

{
  "username": "doctor_name",
  "email": "doctor@hospital.com",
  "password": "securepassword",
  "role": "doctor"  // or "admin"
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "doctor_name",
    "email": "doctor@hospital.com",
    "role": "doctor",
    "created_at": "2026-02-20T10:00:00"
  }
}
```

#### Login

```
POST /auth/login
Content-Type: application/json
Rate Limit: 5 per minute

{
  "username": "doctor_name",
  "password": "securepassword"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "doctor_name",
    "email": "doctor@hospital.com",
    "role": "doctor",
    "created_at": "2026-02-20T10:00:00"
  }
}
```

#### Get Current User

```
GET /auth/me
Authorization: Bearer {access_token}

Response (200):
{
  "id": 1,
  "username": "doctor_name",
  "email": "doctor@hospital.com",
  "role": "doctor",
  "created_at": "2026-02-20T10:00:00"
}
```

### Patient Management Endpoints

#### Get All Patients

```
GET /patients
Authorization: Bearer {access_token}

Response (200):
[
  {
    "id": 1,
    "name": "John Doe",
    "age": 65,
    "gender": "M",
    "email": "john@example.com",
    "phone": "+1-555-0100",
    "created_at": "2026-02-20T10:00:00",
    "updated_at": "2026-02-20T10:00:00"
  },
  ...
]
```

#### Get Patient by ID

```
GET /patients/{patient_id}
Authorization: Bearer {access_token}

Response (200):
{
  "id": 1,
  "name": "John Doe",
  "age": 65,
  "gender": "M",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "created_at": "2026-02-20T10:00:00",
  "updated_at": "2026-02-20T10:00:00",
  "predictions": [
    {
      "id": 1,
      "patient_id": 1,
      "heart_rate": 72.5,
      "blood_pressure_systolic": 130,
      "blood_pressure_diastolic": 85,
      "blood_sugar": 110.5,
      "cholesterol": 200.0,
      "bmi": 28.5,
      "is_smoker": false,
      "is_alcoholic": false,
      "ml_prediction": 0.35,
      "dl_prediction": 0.42,
      "ensemble_prediction": 0.38,
      "risk_level": "medium",
      "created_at": "2026-02-20T10:00:00"
    }
  ]
}
```

#### Create Patient

```
POST /patients
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "age": 58,
  "gender": "F",
  "email": "jane@example.com",
  "phone": "+1-555-0101"
}

Response (201):
{
  "message": "Patient created successfully",
  "patient": {
    "id": 2,
    "name": "Jane Smith",
    "age": 58,
    "gender": "F",
    "email": "jane@example.com",
    "phone": "+1-555-0101",
    "created_at": "2026-02-20T10:30:00",
    "updated_at": "2026-02-20T10:30:00"
  }
}
```

#### Update Patient

```
PUT /patients/{patient_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "age": 59,
  "phone": "+1-555-0102"
}

Response (200):
{
  "message": "Patient updated successfully",
  "patient": {
    "id": 2,
    "name": "Jane Smith",
    "age": 59,
    "gender": "F",
    "email": "jane@example.com",
    "phone": "+1-555-0102",
    "updated_at": "2026-02-20T10:35:00"
  }
}
```

### Prediction Endpoints

#### Make Prediction

```
POST /predict/ml
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "patient_id": 1,
  "heart_rate": 72.5,
  "blood_pressure_systolic": 130,
  "blood_pressure_diastolic": 85,
  "blood_sugar": 110.5,
  "cholesterol": 200.0,
  "bmi": 28.5,
  "is_smoker": false,
  "is_alcoholic": false
}

Response (200):
{
  "prediction": 0.35,
  "risk_level": "medium",
  "confidence": 0.92,
  "message": "Prediction saved",
  "prediction_id": 5
}
```

#### Deep Learning Prediction (with Image)

```
POST /predict/dl
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

patient_id: 1
image: <binary_file>  // Medical imaging file (PNG, JPG, DICOM, NII)
heart_rate: 72.5
blood_pressure_systolic: 130
blood_pressure_diastolic: 85
blood_sugar: 110.5
cholesterol: 200.0
bmi: 28.5
is_smoker: false
is_alcoholic: false

Response (200):
{
  "dl_prediction": 0.42,
  "ml_prediction": 0.35,
  "ensemble_prediction": 0.38,
  "risk_level": "medium",
  "confidence": 0.89,
  "image_analysis": "Normal brain activity detected",
  "prediction_id": 6
}
```

#### Ensemble Prediction

```
POST /predict/ensemble
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "patient_id": 1,
  "heart_rate": 72.5,
  "blood_pressure_systolic": 130,
  "blood_pressure_diastolic": 85,
  "blood_sugar": 110.5,
  "cholesterol": 200.0,
  "bmi": 28.5,
  "is_smoker": false,
  "is_alcoholic": false,
  "use_image": false
}

Response (200):
{
  "ml_prediction": 0.35,
  "dl_prediction": 0.42,
  "ensemble_prediction": 0.38,
  "risk_level": "medium",
  "overall_confidence": 0.90,
  "prediction_id": 7
}
```

#### Get Prediction History

```
GET /patients/{patient_id}/predictions
Authorization: Bearer {access_token}

Response (200):
[
  {
    "id": 1,
    "patient_id": 1,
    "heart_rate": 72.5,
    "blood_pressure_systolic": 130,
    "blood_pressure_diastolic": 85,
    "blood_sugar": 110.5,
    "cholesterol": 200.0,
    "bmi": 28.5,
    "is_smoker": false,
    "is_alcoholic": false,
    "ml_prediction": 0.35,
    "dl_prediction": 0.42,
    "ensemble_prediction": 0.38,
    "risk_level": "medium",
    "created_at": "2026-02-20T10:00:00"
  }
]
```

### Report Generation Endpoints

#### Generate PDF Report

```
GET /report/patient/{patient_id}
Authorization: Bearer {access_token}

Response (200):
<PDF binary file>
Content-Type: application/pdf
Content-Disposition: attachment; filename="patient_report.pdf"
```

#### Generate Prediction Report

```
POST /report/prediction/{prediction_id}
Authorization: Bearer {access_token}

Response (200):
<PDF binary file with prediction details>
```

### Model Information Endpoints

#### Get Model Performance Metrics

```
GET /models/performance
Authorization: Bearer {access_token}

Response (200):
{
  "ml_model": {
    "accuracy": 0.87,
    "precision": 0.85,
    "recall": 0.89,
    "f1_score": 0.87,
    "roc_auc": 0.91,
    "trained_at": "2026-02-15T12:30:00",
    "model_type": "Random Forest"
  },
  "dl_model": {
    "accuracy": 0.89,
    "loss": 0.25,
    "val_accuracy": 0.87,
    "trained_at": "2026-02-18T14:45:00",
    "model_type": "Convolutional Neural Network"
  }
}
```

#### Get Feature Importance

```
GET /models/feature-importance
Authorization: Bearer {access_token}

Response (200):
{
  "features": [
    {"name": "blood_pressure_systolic", "importance": 0.25},
    {"name": "cholesterol", "importance": 0.18},
    {"name": "age", "importance": 0.15},
    {"name": "bmi", "importance": 0.12},
    {"name": "blood_sugar", "importance": 0.11},
    {"name": "heart_rate", "importance": 0.10},
    {"name": "is_smoker", "importance": 0.07},
    {"name": "is_alcoholic", "importance": 0.02}
  ]
}
```

### Error Responses

```
400 Bad Request
{
  "error": "Missing required fields"
}

401 Unauthorized
{
  "error": "Invalid or expired token"
}

404 Not Found
{
  "error": "Resource not found"
}

429 Too Many Requests
{
  "error": "Rate limit exceeded"
}

500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthContext (Provider)
├── Navbar
├── Routes
│   ├── Home
│   ├── Login
│   ├── Dashboard
│   ├── Patients
│   ├── PatientDetails
│   ├── PatientHistory
│   ├── PatientTrends
│   ├── PredictionForm
│   └── ModelPerformance
```

### Key Components

**AuthContext.jsx**

- Manages global authentication state
- Stores JWT token in localStorage
- Provides user identity across app

**api.js**

- Centralizes all HTTP requests
- Handles Authorization headers
- Token refresh logic

**Navbar.jsx**

- Navigation links
- User logout
- Role-based visibility

**Pages:**

- **Home.jsx** - Landing page with system overview
- **Login.jsx** - User authentication form
- **Dashboard.jsx** - Main application dashboard with statistics
- **Patients.jsx** - Patient list and search
- **PatientDetails.jsx** - Individual patient information
- **PatientHistory.jsx** - Patient prediction history
- **PatientTrends.jsx** - Trend analysis with charts
- **PredictionForm.jsx** - New prediction input form
- **ModelPerformance.jsx** - ML/DL model metrics

### State Management

- React Context API (Authentication)
- Component-level state with useState hook
- API state with useEffect hook

### Data Flow

```
Frontend Request
     ↓
axios (api.js)
     ↓
Check/Add JWT Token
     ↓
Backend Flask API
     ↓
Database Query / ML Prediction
     ↓
JSON Response
     ↓
React Component Update
     ↓
UI Re-render
```

---

## Machine Learning Models

### 1. ML Model (Machine Learning)

**File:** `backend/ml_model.py`

**Algorithm:** Random Forest Ensemble

- **Estimators:** 100 decision trees
- **Features:** 8 medical parameters
- **Output:** Probability of stroke (0-1)

**Input Features:**

1. Heart Rate (bpm)
2. Blood Pressure Systolic (mmHg)
3. Blood Pressure Diastolic (mmHg)
4. Blood Sugar (mg/dL)
5. Cholesterol (mg/dL)
6. BMI (kg/m²)
7. Is Smoker (binary)
8. Is Alcoholic (binary)

**Preprocessing:**

- StandardScaler for normalization
- Missing value handling
- Outlier detection

**Training Data:**

- Loaded from healthcare datasets
- 70-30 train-test split
- Cross-validation for hyperparameter tuning

**Performance Metrics:**

- Accuracy: ~87%
- Precision: ~85%
- Recall: ~89%
- ROC-AUC: ~0.91

### 2. DL Model (Deep Learning)

**File:** `backend/dl_model.py`

**Architecture:** Convolutional Neural Network (CNN)

- **Input Layer:** Image (224×224×3) + Medical features
- **Conv Layers:** 3-4 layers with ReLU activation
- **Pooling:** MaxPooling2D
- **Dense Layers:** Fully connected with dropout
- **Output Layer:** Sigmoid (binary classification)

**Supported Image Formats:**

- PNG, JPG, JPEG (2D medical images)
- DICOM (CT, MRI scans)
- NII (Brain imaging)

**Framework:** TensorFlow/Keras

**Training:**

- Epochs: 5-50 (configurable)
- Batch Size: 32
- Optimizer: Adam
- Loss: Binary Crossentropy

**Performance:**

- Accuracy: ~89%
- Validation Accuracy: ~87%
- Loss: ~0.25

### 3. Ensemble Prediction

**Strategy:** Weighted Average

```
ensemble_score = 0.5 × ML_score + 0.5 × DL_score
risk_level = classify(ensemble_score)
```

**Risk Classification:**

- Low: 0.0 - 0.33
- Medium: 0.34 - 0.66
- High: 0.67 - 1.0

### Model Training

**Training Script:** `backend/train_models.py`

```bash
python train_models.py --ml-data path/to/data.csv --epochs 20 --batch-size 32
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'doctor',  -- 'doctor' or 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Patients Table

```sql
CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Predictions Table

```sql
CREATE TABLE predictions (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL FOREIGN KEY,

    -- Medical Parameters
    heart_rate FLOAT NOT NULL,
    blood_pressure_systolic FLOAT NOT NULL,
    blood_pressure_diastolic FLOAT NOT NULL,
    blood_sugar FLOAT NOT NULL,
    cholesterol FLOAT NOT NULL,
    bmi FLOAT NOT NULL,
    is_smoker BOOLEAN DEFAULT FALSE,
    is_alcoholic BOOLEAN DEFAULT FALSE,

    -- Image Data
    scan_image_path VARCHAR(255),

    -- Predictions
    ml_prediction FLOAT,
    dl_prediction FLOAT,
    ensemble_prediction FLOAT,

    -- Risk Assessment
    risk_level VARCHAR(20),  -- 'low', 'medium', 'high'
    confidence FLOAT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

### Relationships

```
User 1 ← → M Predictions (indirectly via Patient)
Patient 1 ← → M Predictions
```

---

## Deployment

### Docker Deployment

**Dockerfile Structure:**

1. **Frontend Build Stage**
   - Linux Alpine Node.js 18
   - npm install and build
   - Output: optimized static files

2. **Backend Stage**
   - Python 3.11 Slim
   - System dependencies (gcc, g++, libgomp1)
   - Python packages installation
   - Model loading

### Docker Compose

```yaml
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=sqlite:///stroke_prediction.db
      - SECRET_KEY=your-secret-key
      - JWT_SECRET_KEY=your-jwt-secret
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: .
    ports:
      - "80:3000"
    depends_on:
      - backend
```

### Environment Variables

**Backend (.env)**

```
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///stroke_prediction.db
# Or for MySQL:
# DATABASE_URL=mysql+pymysql://user:password@localhost/stroke_db
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

### Production Recommendations

1. **Use proper database** (MySQL/PostgreSQL instead of SQLite)
2. **Configure Nginx reverse proxy** for static file serving
3. **Enable HTTPS/SSL** with Let's Encrypt
4. **Set strong SECRET_KEY** values
5. **Implement logging** with ELK stack or Datadog
6. **Add monitoring** with Prometheus/Grafana
7. **Use environment-specific configs**
8. **Enable Redis** for caching and Celery task queue
9. **Implement backup strategy** for database and uploads
10. **Use CI/CD pipeline** (GitHub Actions, GitLab CI)

### Azure Deployment

### AWS Deployment

### Kubernetes Deployment

---

## Security Features

### Authentication & Authorization

- **JWT Tokens** with 24-hour expiration
- **Password Hashing** using bcrypt
- **Role-Based Access Control** (doctor, admin)
- **Rate Limiting** (200 requests/day, 50/hour per IP)

### Data Protection

- **CORS** enabled for safe cross-origin requests
- **CSRF Protection** via Flask configuration
- **Secure file upload** with validation
  - Allowed extensions: png, jpg, jpeg, dcm, nii
  - Max file size: 16MB configurable
- **Input validation** on all endpoints

### Best Practices

1. Never commit `.env` files to version control
2. Use environment variables for sensitive data
3. Implement HTTPS in production
4. Validate and sanitize all user inputs
5. Use parameterized queries to prevent SQL injection
6. Implement logging and monitoring
7. Regular security updates to dependencies
8. Backup data regularly
9. Implement API versioning (/api/v1/)
10. Add request signing for critical operations

### Compliance Considerations

- **HIPAA** (US health data privacy)
- **GDPR** (EU data protection)
- **CCPA** (California privacy rights)
- Patient data encryption at rest and in transit
- Audit logging for sensitive operations
- Data retention policies

---

## API Rate Limits

| Endpoint            | Limit | Window     |
| ------------------- | ----- | ---------- |
| `/auth/login`       | 5     | per minute |
| All other endpoints | 50    | per hour   |
| General limit       | 200   | per day    |

---

## Common Issues & Troubleshooting

### Backend Issues

**Issue:** TensorFlow/CUDA compatibility

```bash
# Solution: Use CPU-only version
pip install tensorflow-cpu
```

**Issue:** Database locked error

```bash
# Solution: Delete database and restart
rm stroke_prediction.db
python app.py
```

**Issue:** Port already in use

```bash
# Solution: Change Flask port
export FLASK_ENV=production
flask run --port 5001
```

### Frontend Issues

**Issue:** CORS errors

```
# Solution: Check backend CORS configuration
# Ensure CORS(app) is called in app.py
```

**Issue:** Node modules size

```bash
# Solution: Use npm ci instead of npm install
npm ci
```

### Docker Issues

**Issue:** Build fails with permission denied

```bash
# Solution: Run with sudo
sudo docker-compose up --build
```

---

## Performance Optimization

### Backend

- Enable caching with Redis
- Use connection pooling for database
- Batch image processing with Celery
- Implement pagination for patient lists
- Use lazy loading for relationships

### Frontend

- Code splitting with React.lazy()
- Image optimization and lazy loading
- Browser caching with Service Workers
- Minify and gzip assets
- CDN for static files

---

## Testing

### Backend Unit Tests

```bash
python -m pytest tests/
```

### Frontend Component Tests

```bash
npm test
```

### Integration Tests

```bash
pytest tests/integration/
```

---

## Support & Contact

For technical issues or questions:

- Check documentation first
- Review error logs in `logs/` directory
- Check database integrity with `check_data.py`
- Contact development team

---

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Maintained By:** Development Team
