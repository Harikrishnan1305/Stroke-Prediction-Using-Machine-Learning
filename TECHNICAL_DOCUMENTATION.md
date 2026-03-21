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
10. [Security Features](#security-features)

---

## Project Overview

**Stroke Prediction Using Machine Learning** is a comprehensive healthcare application that leverages both Machine Learning (ML) and Deep Learning (DL) models to predict the risk of stroke in patients. The system combines structured tabular clinical data with unstructured medical imaging (MRI) into an ensemble prediction model.

**Target Users:** Doctors, Medical Staff, and Healthcare Researchers  
**Primary Function:** Early detection, risk assessment, and clinical decision support for stroke prediction with AI explainability.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (Single Page Application)          │
│        (HTML5, Vanilla JS, CSS3 Glassmorphism UI)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ REST API / JSON / Multipart
┌────────────────────▼────────────────────────────────────────┐
│             Backend (Flask Python)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Authentication & Authorization (JWT)                 │   │
│  │ Rate Limiting (Flask-Limiter)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ML Model (scikit-learn)   │ DL Model (Keras/TF)      │   │
│  │ - Random Forest           │ - EfficientNetB0         │   │
│  │ - 9 Clinical Parameters   │ - MRI Image Analysis     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Data Processing & Report Generation                  │   │
│  │ - Grad-CAM Generation (OpenCV)                       │   │
│  │ - PDF Report Generation (ReportLab)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────┬──────────────────────────┬──────────────────────────┘
       │                          │
┌──────▼────────────────┐ ┌──────▼────────────────┐
│   SQLite Database     │ │  File System Storage  │
│  - Users              │ │  - .pkl Models        │
│  - Patients           │ │  - .keras DL Models   │
│  - Predictions        │ │  - MRI Uploads        │
└───────────────────────┘ └───────────────────────┘
```

---

## Technology Stack

### Backend

- **Framework:** Python 3 & Flask
- **Database ORM:** Flask-SQLAlchemy (SQLite default)
- **Authentication:** Flask-JWT-Extended, Werkzeug Security
- **Security & Limits:** Flask-CORS, Flask-Limiter
- **Machine Learning:** scikit-learn, pandas, numpy
- **Deep Learning:** TensorFlow / Keras (EfficientNetB0)
- **Image Processing:** OpenCV (for Grad-CAM generation)
- **Report Generation:** ReportLab
- **Environment Management:** python-dotenv

### Frontend

- **Architecture:** Single Page Application (SPA)
- **Logic:** Vanilla JavaScript (ES6+), Fetch API
- **Styling:** Vanilla CSS3 (Custom Glassmorphism Design System)
- **Markup:** Semantic HTML5
- **Visuals:** HTML Canvas API for charts/animations

---

## Project Structure

```text
stroke-prediction/
├── backend/
│   ├── app.py                 # Main Flask REST API application
│   ├── models.py              # SQLAlchemy database ORM models
│   ├── ml_model.py            # Random Forest ML model pipeline & logic
│   ├── dl_model.py            # EfficientNetB0 DL pipeline & Grad-CAM
│   ├── pdf_generator.py       # PDF clinical report generation
│   ├── train_models.py        # ML training scripts
│   ├── train_dl.py            # DL model training scripts
│   ├── check_data.py          # Data validation utilities
│   ├── split_dataset.py       # Utility for splitting MRI datasets
│   ├── requirements.txt       # Python package dependencies
│   ├── models/                # Saved trained AI model binaries (.pkl, .keras)
│   ├── uploads/               # Temporary patient MRI uploads
│   └── instance/              # SQLite database file directory
│
├── frontend/
│   ├── index.html             # Main SPA entrypoint (Intro, Auth, Dashboard screens)
│   ├── style.css              # Custom styling, animations, responsive layouts
│   └── app.js                 # Frontend application logic and API integration
│
├── Dockerfile                 # Containerization configuration
├── docker-compose.yml         # Multi-container orchestration
├── start.bat                  # Local Windows startup script
└── README.md                  # Project overview and basic setup
```

*(Note: The `frontend/` directory may contain leftover React/Vite configuration files like `package.json` and `tailwind.config.js` from previous iterations, but the application currently operates entirely on the pure Vanilla JS/CSS stack found in `index.html`, `style.css`, and `app.js`.)*

---

## Setup and Installation

### Prerequisites

- Python 3.8+
- Modern Web Browser (Chrome, Firefox, Safari, Edge)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   # or source venv/bin/activate  # Mac/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup environment variables (create `.env` in `backend/`):
   ```env
   SECRET_KEY=your_secure_flask_secret_key
   JWT_SECRET_KEY=your_secure_jwt_secret_key
   DATABASE_URL=sqlite:///stroke_prediction.db
   UPLOAD_FOLDER=uploads
   MAX_CONTENT_LENGTH=16777216
   ```
5. Run the development server:
   ```bash
   python app.py
   ```
   *The server runs at `http://localhost:5000`. Models will automatically train/load on startup if missing.*

### Frontend Setup

Since the frontend is built using Vanilla technologies, no build step (like npm/webpack) is required.
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Serve the application:
   - Run a local static file server, for example: `python -m http.server 8000`
   - Or open `index.html` using the VS Code "Live Server" extension.

---

## Backend API Documentation

### Base URL
`http://localhost:5000/api`

*(Note: Most endpoints require a Bearer Token in the `Authorization` header)*

### Authentication Endpoints

- **`POST /api/auth/register`**: Register a new user (`doctor` or `admin`). 
  - *Payload:* `username`, `email`, `password`, `role`
- **`POST /api/auth/login`**: Authenticate and retrieve JWT token.
  - *Payload:* `username`, `password`
- **`GET /api/auth/me`**: Get current authenticated user details.
- **`POST /api/auth/forgot-password`**: Request a password reset link to be sent via email.
  - *Payload:* `email`
- **`POST /api/auth/reset-password`**: Verify token and set new password.
  - *Payload:* `token`, `password`

### Patient Endpoints

- **`GET /api/patients`**: Retrieve list of all patients (supports `?search=` query).
- **`POST /api/patients`**: Create a new patient record.
- **`GET /api/patients/<id>`**: Retrieve a specific patient alongside their prediction history.
- **`GET /api/patients/search`**: Search patients by name (`?q=name`).
- **`GET /api/patient/<id>/trends`**: Get historical trend data of patient vitals over time.

### Prediction Endpoints

- **`POST /api/predict`**: Main endpoint for stroke prediction. 
  - *Request Type:* `multipart/form-data`
  - *Fields Needed:* `patient_id` (optional), `name`, `age`, `gender`, `heart_rate`, `bp_systolic`, `bp_diastolic`, `blood_sugar`, `cholesterol`, `bmi`, `is_smoker`, `is_alcoholic`, and optionally `scan_image` (MRI file).
  - *Process:* Validates inputs, processes tabular data using Random Forest, runs EfficientNetB0 on MRI (if provided), combines predictions via weighted ensemble, generates clinical recommendations, and stores the record in the database.
- **`GET /api/predictions`**: Fetch paginated prediction history with filters (`risk`, `date`, `patient_id`, `stage`).
- **`GET /api/predictions/<id>`**: Retrieve explicit details of a single prediction.
- **`GET /api/predictions/<id>/gradcam`**: Generate and retrieve an AI explainability base64 PNG heatmap image representing the DL model's focus on the MRI scan.

### Reporting & Analytics

- **`GET /api/statistics`**: Returns comprehensive dashboard metrics (total patients, risk distributions, age demographics, etc.).
- **`GET /api/prediction/<id>/report`**: Generates and downloads a clinical PDF report containing patient vitals, prediction probabilities, and medical recommendations.
- **`GET /api/model/performance`**: Returns ML model performance metrics, accuracy, and feature importance rankings.
- **`GET /api/images/<filename>`**: Serve static uploaded MRI images.

---

## Frontend Architecture

The frontend is a bespoke Single Page Application (SPA) contained entirely within `frontend/app.js`, driven by pure JavaScript state management and DOM manipulation.

### Core Structure (`app.js`)

1. **State Management**: Centralized `state` object handles `user`, `token`, `patients`, `predictions`, `currentPrediction`, `activeTab`.
2. **API Client**: A customized wrapper around the Fetch API automatically intercepts requests to inject JWT access tokens and parse JSON responses.
3. **Screen Navigation**: Toggles visibility between `#intro-screen`, `#login-screen`, and `#app-screen` based on authentication state.
4. **Tab Routing**: The dashboard (`#app-screen`) implements client-side routing between "Predict", "History", "Dashboard", "Patients", and "Model Info" tabs.
5. **Real-time UX**: Dynamic UI updates including animated counters, fluid progress bars, live form validation, dynamic donut charts using HTML5 Canvas, and seamless DOM updates without full page reloads.

### Styling (`style.css`)
Leverages a Custom CSS Variables (`:root`) design system for consistency. It utilizes extensive glassmorphism (`backdrop-filter: blur`), CSS Grid/Flexbox layouts, and custom keyframe animations.

---

## Machine Learning Models

### 1. Tabular Machine Learning (ML) Model
**Algorithm**: `RandomForestClassifier` (scikit-learn)
- **Input Parameters (9)**: Age, Heart Rate, BP Systolic, BP Diastolic, Blood Sugar, Cholesterol, BMI, Smoking Status, Alcohol Status.
- **Preprocessing**: Feature scaling using `StandardScaler`. Categorical conversion for booleans.
- **Output**: Predicts stroke probability (Float `0.0` - `1.0`). Outputs risk levels (`Low`, `Medium`, `High`) and suggested Stroke Stages.
- **Explainability**: Capable of outputting global feature importance metrics extracted natively from the Random Forest tree splits.

### 2. Deep Learning (DL) Image Model
**Algorithm**: `EfficientNetB0` Convolutional Neural Network (Keras / TensorFlow)
- **Input Strategy**: Brain MRI scans scaled to 224x224 RGB images.
- **Architecture**: Transfer learning from ImageNet applied to the EfficientNetB0 backbone, followed by global average pooling and dense classification layers.
- **Output**: Binary classification probability (Normal vs. Stroke risk).
- **Explainability (Grad-CAM)**: Generates Gradient-weighted Class Activation Mapping heatmaps. It calculates the gradients of the target class with respect to the final convolutional feature map to highlight the region of the MRI scan heavily influencing the prediction.

### 3. Ensemble Logic
When *both* clinical tabular data and an MRI scan are provided, the backend computes an ensemble prediction:
`Ensemble Probability = (0.4 * ML_Probability) + (0.6 * DL_Probability)`
*(The DL model is given slightly higher weight when imaging is available)*

---

## Database Schema

Implemented using `Flask-SQLAlchemy` (SQLite default).

### 1. `users` Table
Handles authentication and authorization.
- `id` (PK), `username` (Unique), `email` (Unique), `password_hash`, `role` (doctor/admin), `created_at`.

### 2. `patients` Table
Stores unique patient profiles.
- `id` (PK), `name`, `age`, `gender`, `email`, `phone`, `created_at`, `updated_at`, `created_by` (FK) -> `users.id`.
- *Relationship*: One-to-Many with `predictions`.

### 3. `predictions` Table
Stores historical prediction records, inputs, and results.
- `id` (PK), `patient_id` (FK) -> `patients.id`.
- **Inputs**: `heart_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic`, `blood_sugar`, `cholesterol`, `bmi`, `is_smoker`, `is_alcoholic`, `scan_image_path`.
- **Outputs**: `stroke_risk`, `stroke_stage`, `risk_probability`, `ml_prediction`, `dl_prediction`, `recommendations`.
- **Metadata**: `created_at`, `created_by` (FK) -> `users.id`.

---

## Security Features

1. **Stateless JWT Authentication**: Sessions are managed securely via `Flask-JWT-Extended`.
2. **Password Hashing**: User passwords are encrypted using `werkzeug.security` (`generate_password_hash` with salting).
3. **Brute Force Protection**: Implementation of `Flask-Limiter` to restrict repeated attempts on the login (`/api/auth/login`) and predict endpoints.
4. **Input Sanitization**: Extensive validation rules inside `validate_predict_input` to ensure data boundaries and prevent injection or type-casting errors.
5. **Secure Uploads**: Utilises `secure_filename()` to store MRI uploads safely and allows only specific file extensions (`png`, `jpg`, `dcm`, `nii`).
