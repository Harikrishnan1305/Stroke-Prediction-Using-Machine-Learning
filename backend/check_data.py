from app import app, Patient, Prediction
from models import db

with app.app_context():
    patient_count = Patient.query.count()
    prediction_count = Prediction.query.count()
    
    print(f"=== DATABASE STATUS ===")
    print(f"Total Patients: {patient_count}")
    print(f"Total Predictions: {prediction_count}")
    print()
    
    if patient_count > 0:
        print("Recent Patients:")
        patients = Patient.query.order_by(Patient.created_at.desc()).limit(5).all()
        for p in patients:
            print(f"  - {p.name}, Age: {p.age}, Gender: {p.gender}")
    
    if prediction_count > 0:
        print("\nRecent Predictions:")
        predictions = Prediction.query.order_by(Prediction.created_at.desc()).limit(5).all()
        for pred in predictions:
            print(f"  - Patient: {pred.patient.name if pred.patient else 'Unknown'}, Risk: {pred.stroke_risk}")
