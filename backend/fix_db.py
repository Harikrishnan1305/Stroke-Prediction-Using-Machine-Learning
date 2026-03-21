import sqlite3
import os

db_path = 'instance/stroke_prediction.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute('ALTER TABLE patients ADD COLUMN created_by INTEGER REFERENCES users(id)')
        conn.commit()
        print("Successfully added created_by column to patients table!")
    except Exception as e:
        print("Error/Already exists:", str(e))
    conn.close()
else:
    print("Database not found at", db_path)
