from app import app, db

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Recreating tables with new schema...")
    db.create_all()
    print("Done! Schema is now fresh.")
