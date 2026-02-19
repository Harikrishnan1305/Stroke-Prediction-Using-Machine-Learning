from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import io
from dotenv import load_dotenv
from sqlalchemy import desc

from models import db, User, Patient, Prediction
from ml_model import StrokeMLModel
from dl_model import StrokeDLModel
from pdf_generator import StrokePredictionReport

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///stroke_prediction.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

# Initialize extensions
CORS(app)
db.init_app(app)
jwt = JWTManager(app)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Initialize ML/DL models
ml_model = StrokeMLModel()
dl_model = StrokeDLModel()
pdf_generator = StrokePredictionReport()

# Create upload folder
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'dcm', 'nii'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Initialize database
with app.app_context():
    db.create_all()
    
    # Create default admin user if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@stroke.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Default admin user created: admin/admin123")
    
    # Load or train models
    if not ml_model.load():
        print("ML model not found. Training new model...")
        ml_model.train()
        ml_model.load()
    
    try:
        if not dl_model.load():
            print("DL model not found. Training new model...")
            dl_model.train(epochs=5)
            dl_model.load()
    except Exception as e:
        print("DL model disabled:", e)



# ==================== Authentication Routes ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user/doctor"""
    try:
        data = request.get_json()
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'doctor')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """User login"""
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Ensure user.id is a valid type for JWT
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        # Convert back to int if needed
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Patient Routes ====================

@app.route('/api/patients', methods=['GET'])
@jwt_required()
def get_patients():
    """Get all patients"""
    try:
        patients = Patient.query.order_by(Patient.created_at.desc()).all()
        return jsonify([p.to_dict() for p in patients]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    """Get patient by ID"""
    try:
        patient = Patient.query.get_or_404(patient_id)
        patient_data = patient.to_dict()
        patient_data['predictions'] = [p.to_dict() for p in patient.predictions]
        return jsonify(patient_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients', methods=['POST'])
@jwt_required()
def create_patient():
    """Create new patient"""
    try:
        data = request.get_json()
        patient = Patient(
            name=data['name'],
            age=data['age'],
            gender=data['gender'],
            email=data.get('email'),
            phone=data.get('phone')
        )
        db.session.add(patient)
        db.session.commit()
        
        return jsonify({
            'message': 'Patient created successfully',
            'patient': patient.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients/search', methods=['GET'])
@jwt_required()
def search_patients():
    """Search patients by name"""
    try:
        query = request.args.get('q', '')
        patients = Patient.query.filter(Patient.name.ilike(f'%{query}%')).all()  # pyright: ignore[reportGeneralTypeIssues]
        return jsonify([p.to_dict() for p in patients]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Prediction Routes ====================

@app.route('/api/predict', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def predict_stroke():
    """Main prediction endpoint"""
    try:
        user_id = int(get_jwt_identity())
        
        # Get form data
        data = request.form.to_dict()
        print(f"Received data: {data}")  # Debug logging
        
        # Create or get patient
        patient_id = data.get('patient_id')
        if patient_id:
            patient = Patient.query.get(patient_id)
            if not patient:
                return jsonify({'error': 'Patient not found'}), 404
        else:
            patient = Patient(
                name=data['name'],
                age=int(data['age']),
                gender=data['gender']
            )
            db.session.add(patient)
            db.session.flush()
        
        # Prepare features for ML model
        features = {
            'age': int(data['age']),
            'heart_rate': int(data['heart_rate']),
            'bp_systolic': int(data['bp_systolic']),
            'bp_diastolic': int(data['bp_diastolic']),
            'blood_sugar': float(data['blood_sugar']),
            'cholesterol': float(data['cholesterol']),
            'bmi': float(data['bmi']),
            'is_smoker': data.get('is_smoker', 'false').lower() == 'true',
            'is_alcoholic': data.get('is_alcoholic', 'false').lower() == 'true'
        }
        
        # ML Prediction
        ml_risk, ml_prob, ml_stage, ml_probs = ml_model.predict(features)
        
        # DL Prediction (if image provided)
        dl_risk, dl_prob, dl_stage = None, None, None
        scan_image_path = None
        
        if 'scan_image' in request.files:
            file = request.files['scan_image']
            if file and allowed_file(file.filename) and patient:
                filename = secure_filename(f"{patient.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                scan_image_path = filepath
                
                # DL Prediction
                dl_risk, dl_prob, dl_stage, dl_probs = dl_model.predict(filepath)  # pyright: ignore[reportUnusedVariable]
        
        # Combine predictions
        if dl_risk:
            final_risk, final_prob, final_stage = dl_model.combine_predictions(
                (ml_risk, ml_prob, ml_stage, ml_probs),
                (dl_risk, dl_prob, dl_stage, None)
            )
        else:
            final_risk, final_prob, final_stage = ml_risk, ml_prob, ml_stage
        
        # Generate recommendations
        recommendations = ml_model.get_recommendations(features, final_risk, final_stage)
        
        # Get feature importance explanation
        feature_explanation = ml_model.explain_prediction(features)
        
        # Ensure patient exists before saving prediction
        if not patient:
            return jsonify({'error': 'Patient object is None'}), 500
        
        # Save prediction
        prediction = Prediction(
            patient_id=patient.id,
            heart_rate=features['heart_rate'],
            blood_pressure_systolic=features['bp_systolic'],
            blood_pressure_diastolic=features['bp_diastolic'],
            blood_sugar=features['blood_sugar'],
            cholesterol=features['cholesterol'],
            bmi=features['bmi'],
            is_smoker=features['is_smoker'],
            is_alcoholic=features['is_alcoholic'],
            scan_image_path=scan_image_path,
            stroke_risk=final_risk,
            stroke_stage=final_stage,
            risk_probability=final_prob,
            ml_prediction=ml_prob,
            dl_prediction=dl_prob if dl_prob else None,
            recommendations='\n'.join(recommendations),
            created_by=user_id
        )
        
        db.session.add(prediction)
        db.session.commit()
        
        return jsonify({
            'message': 'Prediction completed successfully',
            'patient': patient.to_dict(),
            'prediction': prediction.to_dict(),
            'recommendations': recommendations,
            'feature_importance': feature_explanation
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in predict_stroke: {str(e)}")  # Debug logging
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    """Get all predictions with filtering"""
    try:
        query = Prediction.query
        
        # Filter by risk level
        risk = request.args.get('risk')
        if risk:
            query = query.filter_by(stroke_risk=risk)
        
        # Filter by date
        date_filter = request.args.get('date')
        if date_filter == 'today':
            today = datetime.utcnow().date()
            query = query.filter(db.func.date(Prediction.created_at) == today)
        elif date_filter == 'week':
            week_ago = datetime.utcnow() - timedelta(days=7)
            query = query.filter(Prediction.created_at >= week_ago)
        elif date_filter == 'month':
            month_ago = datetime.utcnow() - timedelta(days=30)
            query = query.filter(Prediction.created_at >= month_ago)
        
        # Filter by patient ID
        patient_id = request.args.get('patient_id')
        if patient_id:
            query = query.filter_by(patient_id=int(patient_id))
        
        # Filter by stage
        stage = request.args.get('stage')
        if stage:
            query = query.filter_by(stroke_stage=stage)
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Order by date
        query = query.order_by(desc(Prediction.created_at))
        
        # Execute query with pagination
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'predictions': [p.to_dict() for p in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': paginated.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predictions/<int:prediction_id>', methods=['GET'])
@jwt_required()
def get_prediction(prediction_id):
    """Get prediction by ID"""
    try:
        prediction = Prediction.query.get_or_404(prediction_id)
        return jsonify(prediction.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Statistics Routes ====================

@app.route('/api/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """Get dashboard statistics with enhanced analytics"""
    try:
        total_patients = Patient.query.count()
        total_predictions = Prediction.query.count()
        
        high_risk = Prediction.query.filter_by(stroke_risk='High').count()
        medium_risk = Prediction.query.filter_by(stroke_risk='Medium').count()
        low_risk = Prediction.query.filter_by(stroke_risk='Low').count()
        
        recent_predictions = Prediction.query.order_by(Prediction.created_at.desc()).limit(5).all()
        
        # Age distribution analysis
        age_groups = {
            '20-40': 0, '41-60': 0, '61-80': 0, '80+': 0
        }
        patients = Patient.query.all()
        for p in patients:
            if p.age <= 40:
                age_groups['20-40'] += 1
            elif p.age <= 60:
                age_groups['41-60'] += 1
            elif p.age <= 80:
                age_groups['61-80'] += 1
            else:
                age_groups['80+'] += 1
        
        # Risk by gender
        gender_risk = {}
        for gender in ['Male', 'Female', 'Other']:
            gender_patients = Patient.query.filter_by(gender=gender).all()
            patient_ids = [p.id for p in gender_patients]
            if len(patient_ids) > 0:
                high = Prediction.query.filter(
                    Prediction.patient_id.in_(patient_ids),  # type: ignore
                    Prediction.stroke_risk == 'High'
                ).count()
                gender_risk[gender] = {'total': len(patient_ids), 'high_risk': high}
        
        return jsonify({
            'total_patients': total_patients,
            'total_predictions': total_predictions,
            'risk_distribution': {
                'high': high_risk,
                'medium': medium_risk,
                'low': low_risk
            },
            'recent_predictions': [p.to_dict() for p in recent_predictions],
            'age_distribution': age_groups,
            'gender_risk': gender_risk
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Image Routes ====================

@app.route('/api/images/<path:filename>', methods=['GET'])
@jwt_required()
def get_image(filename):
    """Serve uploaded images"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        return send_file(filepath)
    except Exception as e:
        return jsonify({'error': str(e)}), 404


# ==================== Model Performance & Explainability ====================

@app.route('/api/model/performance', methods=['GET'])
@jwt_required()
def get_model_performance():
    """Get ML model performance metrics"""
    try:
        metrics = ml_model.get_performance_metrics()
        feature_importance = ml_model.get_feature_importance()
        
        return jsonify({
            'ml_metrics': metrics,
            'feature_importance': feature_importance,
            'best_params': ml_model.best_params
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/model/compare', methods=['GET'])
@jwt_required()
def compare_models():
    """Compare ML vs DL predictions"""
    try:
        # Get predictions with both ML and DL results
        predictions = Prediction.query.filter(
            Prediction.ml_prediction != None,  # type: ignore
            Prediction.dl_prediction != None  # type: ignore
        ).limit(100).all()
        
        comparison_data = []
        for pred in predictions:
            comparison_data.append({
                'id': pred.id,
                'patient_name': pred.patient.name if pred.patient else 'Unknown',
                'ml_prediction': pred.ml_prediction,
                'dl_prediction': pred.dl_prediction,
                'final_risk': pred.stroke_risk,
                'created_at': pred.created_at.isoformat()
            })
        
        return jsonify(comparison_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/patient/<int:patient_id>/trends', methods=['GET'])
@jwt_required()
def get_patient_trends(patient_id):
    """Get patient health parameter trends over time"""
    try:
        patient = Patient.query.get_or_404(patient_id)
        predictions = Prediction.query.filter_by(patient_id=patient_id).order_by(Prediction.created_at).all()
        
        trends = {
            'dates': [],
            'heart_rate': [],
            'bp_systolic': [],
            'bp_diastolic': [],
            'blood_sugar': [],
            'cholesterol': [],
            'bmi': [],
            'risk_probability': []
        }
        
        for pred in predictions:
            trends['dates'].append(pred.created_at.isoformat())
            trends['heart_rate'].append(pred.heart_rate)
            trends['bp_systolic'].append(pred.blood_pressure_systolic)
            trends['bp_diastolic'].append(pred.blood_pressure_diastolic)
            trends['blood_sugar'].append(pred.blood_sugar)
            trends['cholesterol'].append(pred.cholesterol)
            trends['bmi'].append(pred.bmi)
            trends['risk_probability'].append(pred.risk_probability)
        
        return jsonify({
            'patient': patient.to_dict(),
            'trends': trends
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prediction/<int:prediction_id>/report', methods=['GET'])
@jwt_required()
def download_prediction_report(prediction_id):
    """Generate and download PDF report for prediction"""
    try:
        prediction = Prediction.query.get_or_404(prediction_id)
        patient = prediction.patient
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get recommendations
        recommendations = prediction.recommendations.split('\n') if prediction.recommendations else []
        
        # Generate PDF (returns BytesIO when output_path is None)
        pdf_buffer: io.BytesIO = pdf_generator.generate_report(  # type: ignore[assignment]
            patient_data=patient.to_dict(),
            prediction_data=prediction.to_dict(),
            recommendations=recommendations
        )
        
        # Create filename
        filename = f"stroke_report_{patient.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ==================== Health Check ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'ml_model_loaded': ml_model.model is not None,
        'dl_model_loaded': dl_model.model is not None
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
