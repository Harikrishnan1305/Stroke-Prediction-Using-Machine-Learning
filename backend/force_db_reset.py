from app import app, db
from models import Patient, Prediction, User
from sqlalchemy import text

with app.app_context():
    try:
        print("Dropping all tables to ensure a clean slate...")
        db.drop_all()
        print("Creating all tables based on updated models...")
        db.create_all()
        
        # Verify schema
        result = db.session.execute(text("PRAGMA table_info(patients);")).fetchall()
        print("Current patients table schema:")
        for row in result:
            print(f" - {row[1]} ({row[2]})")
            
        print("Database reset successful!")
    except Exception as e:
        print("Error during reset:", e)
