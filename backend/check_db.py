import sqlite3
import os

db_path = 'instance/stroke_prediction.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    print(conn.execute('SELECT id, username, email FROM users').fetchall())
else:
    print("Database not found at", db_path)
