from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Mapped

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='doctor')  # doctor or admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, username, email, role='doctor', **kwargs):
        super(User, self).__init__(**kwargs)
        self.username = username
        self.email = email
        self.role = role
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }


class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with predictions
    predictions = db.relationship('Prediction', backref='patient', lazy=True, cascade='all, delete-orphan')  # type: ignore
    
    def __init__(self, name, age, gender, email=None, phone=None, **kwargs):
        super(Patient, self).__init__(**kwargs)
        self.name = name
        self.age = age
        self.gender = gender
        self.email = email
        self.phone = phone
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'email': self.email,
            'phone': self.phone,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    
    # Backref relationship from Patient model
    if TYPE_CHECKING:
        patient: Mapped['Patient']
    
    # Medical parameters
    heart_rate = db.Column(db.Float, nullable=False)
    blood_pressure_systolic = db.Column(db.Float, nullable=False)
    blood_pressure_diastolic = db.Column(db.Float, nullable=False)
    blood_sugar = db.Column(db.Float, nullable=False)
    cholesterol = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    is_smoker = db.Column(db.Boolean, default=False)
    is_alcoholic = db.Column(db.Boolean, default=False)
    
    # Image data
    scan_image_path = db.Column(db.String(255))
    
    # Prediction results
    stroke_risk = db.Column(db.String(20))  # Low, Medium, High
    stroke_stage = db.Column(db.String(20))  # Stage 1, 2, 3, or None
    risk_probability = db.Column(db.Float)
    ml_prediction = db.Column(db.Float)
    dl_prediction = db.Column(db.Float)
    
    # Recommendations
    recommendations = db.Column(db.Text)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __init__(self, patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic,
                 blood_sugar, cholesterol, bmi, is_smoker=False, is_alcoholic=False,
                 scan_image_path=None, stroke_risk=None, stroke_stage=None,
                 risk_probability=None, ml_prediction=None, dl_prediction=None,
                 recommendations=None, created_by=None, **kwargs):
        super(Prediction, self).__init__(**kwargs)
        self.patient_id = patient_id
        self.heart_rate = heart_rate
        self.blood_pressure_systolic = blood_pressure_systolic
        self.blood_pressure_diastolic = blood_pressure_diastolic
        self.blood_sugar = blood_sugar
        self.cholesterol = cholesterol
        self.bmi = bmi
        self.is_smoker = is_smoker
        self.is_alcoholic = is_alcoholic
        self.scan_image_path = scan_image_path
        self.stroke_risk = stroke_risk
        self.stroke_stage = stroke_stage
        self.risk_probability = risk_probability
        self.ml_prediction = ml_prediction
        self.dl_prediction = dl_prediction
        self.recommendations = recommendations
        self.created_by = created_by
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.name if self.patient else None,
            'heart_rate': self.heart_rate,
            'blood_pressure': f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}",
            'blood_sugar': self.blood_sugar,
            'cholesterol': self.cholesterol,
            'bmi': self.bmi,
            'is_smoker': self.is_smoker,
            'is_alcoholic': self.is_alcoholic,
            'scan_image_path': self.scan_image_path,
            'stroke_risk': self.stroke_risk,
            'stroke_stage': self.stroke_stage,
            'risk_probability': self.risk_probability,
            'ml_prediction': self.ml_prediction,
            'dl_prediction': self.dl_prediction,
            'recommendations': self.recommendations,
            'created_at': self.created_at.isoformat()
        }
