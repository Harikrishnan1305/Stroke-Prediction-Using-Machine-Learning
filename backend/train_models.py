"""Train both ML and DL models"""
import os
import sys

print("=" * 50)
print("Training ML and DL Models")
print("=" * 50)

# Train ML Model
print("\n1. Training ML Model...")
try:
    from ml_model import StrokeMLModel
    ml_model = StrokeMLModel()
    ml_model.train()
    print("✓ ML Model trained successfully!")
except Exception as e:
    print(f"✗ ML Model training failed: {e}")
    sys.exit(1)

# Train DL Model
print("\n2. Training DL Model...")
try:
    from dl_model import StrokeDLModel
    dl_model = StrokeDLModel()
    dl_model.train(epochs=5)
    print("✓ DL Model trained successfully!")
except Exception as e:
    print(f"✗ DL Model training failed: {e}")
    sys.exit(1)

print("\n" + "=" * 50)
print("All models trained successfully!")
print("=" * 50)
print("\nYou can now start the backend server with: python app.py")
