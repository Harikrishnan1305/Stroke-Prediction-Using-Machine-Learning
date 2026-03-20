# Brain Stroke Risk Prediction System

A full-stack web application that predicts stroke risk using an ensemble of Machine Learning (ML) and Deep Learning (DL) models.

![Stroke Prediction System](frontend/assets/preview.png)

## 🌟 Features
- **🧠 AI-powered prediction:** Uses Random Forest (ML) on patient tabular data and EfficientNetB0 (DL) on MRI scans.
- **🖼️ Explainable AI:** Interactive Grad-CAM heatmap visualization to show where the DL model focused its analysis on the MRI.
- **📊 Comprehensive Patient Management:** Searchable patient database tracking all prediction history.
- **📈 Real-time Dashboard:** Animated statistics, risk distribution charts, and live system monitoring.
- **💊 Personalized medical insights:** Generates specific health recommendations based on patient vitals.
- **🔒 Secure Authentication:** JWT-based login with role-based access control and password strength validation.
- **📱 Premium Responsive UI:** Smooth glassmorphism design, animated particle canvas, animated counters, and custom CSS styling without heavy frameworks.

## 🛠️ Tech Stack

**Frontend:**
- **Vanilla JavaScript (ES6+)**
- **Vanilla CSS3** (Custom Glassmorphism Design System)
- **HTML5** & Canvas API (Charts & Animations)

**Backend:**
- **Python 3** & **Flask** (API Server)
- **Flask-SQLAlchemy** (ORM) & **SQLite** (Database)
- **Flask-JWT-Extended** (Authentication)
- **scikit-learn** (Machine Learning Pipeline)
- **TensorFlow / Keras** (Deep Learning Image Classification)
- **OpenCV & NumPy** (Image Preprocessing & Grad-CAM)

## 🚀 Installation

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
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup environment variables (create a `.env` file in the backend folder):
   ```env
   SECRET_KEY=generate_a_secure_random_key_here
   JWT_SECRET_KEY=generate_another_secure_key_here
   ```
5. Run Data Preparation & Training (Optional if models exist):
   ```bash
   python ml_model.py
   python split_dataset.py --source /path/to/raw/MRI/dataset
   python dl_model.py
   ```
6. Run the Flask server:
   ```bash
   python app.py
   ```
   *The API will run on http://127.0.0.1:5000*

### Frontend Setup
Since the frontend uses standard web technologies, there is no build step required!
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Open the application:
   - **Option A:** Double-click `index.html` to open it in your default browser.
   - **Option B (Recommended):** Use a local development server like VS Code's "Live Server" extension on `index.html`.

## 📖 Usage

### 1. Authentication
- Register a new account by clicking the "Sign Up" tab on the login screen.
- Or use the default administrator credentials:
  - Username: `admin`
  - Password: `admin123`

### 2. Make a Prediction
- Go to the **New Prediction** tab.
- Enter patient vitals (Age, Heart Rate, BP, Sugar, Cholesterol, BMI). The system will automatically flag abnormal vitals in real-time.
- (Optional) Upload an MRI scan for deep learning analysis.
- Click **Predict Risk** to process the data through the AI ensemble.

### 3. View Results
- Review the combined risk score and probability gauge.
- View the specific ML and DL breakdown bars.
- Review the dynamically generated medical recommendations.
- **Grad-CAM:** If an MRI was uploaded, review the generated heatmap highlighting high-risk areas identified by the neural network.
- Click **Download PDF** to export the clinical report.

### 4. Patient Management & History
- Navigate to the **History** tab to filter and review past predictions.
- Navigate to the **Patients** tab to search specific patient profiles.
- Navigate to the **Dashboard** for aggregate system analytics and risk distribution donut charts.

## 🏗️ Project Structure
```text
├── backend/
│   ├── app.py              # Main Flask application & API routes
│   ├── models.py           # SQLAlchemy database schemas
│   ├── ml_model.py         # Tabular data training pipeline
│   ├── dl_model.py         # CNN/EfficientNet image training pipeline
│   ├── requirements.txt    # Python constraints
│   ├── .env                # Secrets (user-created)
│   ├── models/             # Saved .pkl and .keras binaries
│   └── uploads/            # Temporary storage for MRI processing
│
└── frontend/
    ├── index.html          # Main application structure (3-screen SPA)
    ├── style.css           # Custom CSS design system & animations
    └── app.js              # Vanilla JS frontend logic & API client
```

## 🧠 Model Information

### Machine Learning Model (Random Forest)
- Analyzes 10 clinical parameters (Age, Gender, Vitals, Lifestyle).
- Utilizes balanced class weighting and robust feature scaling.
- Generates precise feature importance rankings displayed in the UI.

### Deep Learning Model (CNN - EfficientNetB0)
- Transfer learning architecture trained on brain MRI scans.
- Performs binary classification (Stroke vs. Normal).
- Generates visual explainability via Gradient-weighted Class Activation Mapping (Grad-CAM), overlaying a thermal map on the original scan.

### Combined Ensemble Prediction
- The final risk score uses a weighted ensemble technique.
- If tabular data and MRI are both provided: `40% ML + 60% DL`.
- If only tabular data is provided: `100% ML`.

## 🛡️ Security Features
- **Stateless Auth:** JWT-based stateless session management.
- **Password Security:** Salted password hashing via `werkzeug.security`.
- **Route Protection:** Protected API routes requiring Bearer tokens.
- **Input Validation:** Strict type checking and bounding logic in the backend.
- **CORS Configuration:** Explicit Cross-Origin allowed domains.

## ⚖️ Disclaimer
**This software system is built for educational, research, and project demonstration purposes only.** It has not been approved by the FDA or any medical authority. It should **not** be used as a substitute for professional medical diagnosis or clinical decision-making. Always consult qualified healthcare professionals for medical advice.

## 📄 License
This project is open-source and intended for educational and portfolio use.

---
*Built with ❤️ for intelligent healthcare solutions.*
