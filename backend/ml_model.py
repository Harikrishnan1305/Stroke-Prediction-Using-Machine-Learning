import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import pickle
import os
import json

class StrokeMLModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'age', 'heart_rate', 'bp_systolic', 'bp_diastolic',
            'blood_sugar', 'cholesterol', 'bmi', 'is_smoker', 'is_alcoholic'
        ]
        self.feature_importances = None
        self.performance_metrics = None
        self.best_params = None
    
    def create_synthetic_data(self, n_samples=1000):
        """Create synthetic training data for demonstration"""
        np.random.seed(42)
        
        data = {
            'age': np.random.randint(20, 90, n_samples),
            'heart_rate': np.random.randint(60, 120, n_samples),
            'bp_systolic': np.random.randint(90, 180, n_samples),
            'bp_diastolic': np.random.randint(60, 120, n_samples),
            'blood_sugar': np.random.randint(70, 250, n_samples),
            'cholesterol': np.random.randint(150, 300, n_samples),
            'bmi': np.random.uniform(18, 40, n_samples),
            'is_smoker': np.random.randint(0, 2, n_samples),
            'is_alcoholic': np.random.randint(0, 2, n_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Create target based on risk factors
        risk_score = (
            (df['age'] > 60) * 2 +
            (df['bp_systolic'] > 140) * 2 +
            (df['blood_sugar'] > 126) * 1.5 +
            (df['cholesterol'] > 240) * 1.5 +
            (df['bmi'] > 30) * 1 +
            df['is_smoker'] * 1.5 +
            df['is_alcoholic'] * 1
        )
        
        # 0: Low risk, 1: Medium risk, 2: High risk
        df['stroke_risk'] = pd.cut(risk_score, bins=[-np.inf, 3, 6, np.inf], labels=[0, 1, 2])
        
        return df
    
    def train(self, save_path='models/stroke_ml_model.pkl', use_grid_search=True):
        """Train the Random Forest model with hyperparameter tuning"""
        print("Creating synthetic training data...")
        df = self.create_synthetic_data(n_samples=2000)
        
        X = df[self.feature_names]
        y = df['stroke_risk']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        if use_grid_search:
            print("Performing hyperparameter tuning with GridSearchCV...")
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 15, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
                'max_features': ['sqrt', 'log2']
            }
            
            rf = RandomForestClassifier(random_state=42, n_jobs=-1)
            grid_search = GridSearchCV(
                rf, param_grid, cv=5, scoring='accuracy', 
                n_jobs=-1, verbose=1
            )
            grid_search.fit(X_train_scaled, y_train)
            
            self.model = grid_search.best_estimator_
            self.best_params = grid_search.best_params_
            print(f"Best parameters: {self.best_params}")
        else:
            # Train Random Forest with default optimized params
            print("Training Random Forest model...")
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features='sqrt',
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X_train_scaled, y_train)
        
        # Cross-validation
        print("Performing cross-validation...")
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5, scoring='accuracy')
        print(f"Cross-validation scores: {cv_scores}")
        print(f"Mean CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # Evaluate on test set
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        y_pred = self.model.predict(X_test_scaled)
        
        # Calculate detailed metrics
        precision, recall, f1, support = precision_recall_fscore_support(y_test, y_pred, average='weighted')
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        self.performance_metrics = {
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'confusion_matrix': conf_matrix.tolist(),
            'classification_report': classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High'], output_dict=True)
        }
        
        # Feature importances
        self.feature_importances = dict(zip(self.feature_names, self.model.feature_importances_.tolist()))
        
        print(f"\n=== Model Performance ===")
        print(f"Training Accuracy: {train_score:.4f}")
        print(f"Testing Accuracy: {test_score:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1-Score: {f1:.4f}")
        print(f"\nConfusion Matrix:\n{conf_matrix}")
        print(f"\nFeature Importances:")
        for feature, importance in sorted(self.feature_importances.items(), key=lambda x: x[1], reverse=True):
            print(f"  {feature}: {importance:.4f}")
        
        # Save model with metadata
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, 'wb') as f:
            pickle.dump({
                'model': self.model, 
                'scaler': self.scaler,
                'feature_importances': self.feature_importances,
                'performance_metrics': self.performance_metrics,
                'best_params': self.best_params
            }, f)
        
        print(f"\nModel saved to {save_path}")
        return test_score
    
    def load(self, model_path='models/stroke_ml_model.pkl'):
        """Load trained model"""
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.scaler = data['scaler']
                self.feature_importances = data.get('feature_importances', None)
                self.performance_metrics = data.get('performance_metrics', None)
                self.best_params = data.get('best_params', None)
            print("Model loaded successfully")
            return True
        return False
    
    def predict(self, features):
        """
        Predict stroke risk from medical parameters
        features: dict with keys matching feature_names
        Returns: (risk_level, probability, stage)
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load() first.")
        
        # Prepare features
        feature_vector = np.array([[
            features['age'],
            features['heart_rate'],
            features['bp_systolic'],
            features['bp_diastolic'],
            features['blood_sugar'],
            features['cholesterol'],
            features['bmi'],
            1 if features['is_smoker'] else 0,
            1 if features['is_alcoholic'] else 0
        ]])
        
        # Scale and predict
        feature_vector_scaled = self.scaler.transform(feature_vector)
        prediction = self.model.predict(feature_vector_scaled)[0]
        probabilities = self.model.predict_proba(feature_vector_scaled)[0]
        
        # Map prediction to risk level
        risk_levels = ['Low', 'Medium', 'High']
        risk_level = risk_levels[int(prediction)]
        
        # Determine stage based on probability
        max_prob = probabilities[int(prediction)]
        if prediction == 0:
            stage = None
        elif prediction == 1:
            stage = 'Stage 1'
        else:
            if max_prob > 0.8:
                stage = 'Stage 3'
            elif max_prob > 0.6:
                stage = 'Stage 2'
            else:
                stage = 'Stage 1'
        
        return risk_level, float(max_prob), stage, probabilities.tolist()
    
    def get_feature_importance(self):
        """Get feature importance for explainability"""
        if self.feature_importances:
            return self.feature_importances
        elif self.model:
            return dict(zip(self.feature_names, self.model.feature_importances_.tolist()))
        return None
    
    def get_performance_metrics(self):
        """Get model performance metrics"""
        return self.performance_metrics
    
    def explain_prediction(self, features):
        """Explain individual prediction with feature contributions"""
        if self.model is None:
            return None
        
        feature_vector = np.array([[
            features['age'],
            features['heart_rate'],
            features['bp_systolic'],
            features['bp_diastolic'],
            features['blood_sugar'],
            features['cholesterol'],
            features['bmi'],
            1 if features['is_smoker'] else 0,
            1 if features['is_alcoholic'] else 0
        ]])
        
        # Get feature importances
        importances = self.get_feature_importance()
        if importances is None:
            return None
        
        # Calculate contribution scores (simplified)
        contributions = {}
        for i, feature_name in enumerate(self.feature_names):
            feature_value = feature_vector[0][i]
            importance = importances.get(feature_name, 0)
            
            # Normalize contribution based on value and importance
            if feature_name == 'age':
                normalized = (feature_value - 20) / 70  # age range 20-90
            elif feature_name in ['is_smoker', 'is_alcoholic']:
                normalized = feature_value
            elif feature_name == 'heart_rate':
                normalized = (feature_value - 60) / 60  # 60-120 range
            elif feature_name == 'bp_systolic':
                normalized = (feature_value - 90) / 90  # 90-180 range
            elif feature_name == 'bp_diastolic':
                normalized = (feature_value - 60) / 60  # 60-120 range
            elif feature_name == 'blood_sugar':
                normalized = (feature_value - 70) / 180  # 70-250 range
            elif feature_name == 'cholesterol':
                normalized = (feature_value - 150) / 150  # 150-300 range
            elif feature_name == 'bmi':
                normalized = (feature_value - 18) / 22  # 18-40 range
            else:
                normalized = 0.5
            
            contribution = importance * max(0, normalized)
            contributions[feature_name] = float(contribution)
        
        # Normalize to percentages
        total = sum(contributions.values())
        if total > 0:
            contributions = {k: (v/total) * 100 for k, v in contributions.items()}
        
        return dict(sorted(contributions.items(), key=lambda x: x[1], reverse=True))
    
    def get_recommendations(self, features, risk_level, stage):
        """Generate personalized recommendations"""
        recommendations = []
        
        if risk_level == 'High':
            recommendations.append("⚠️ URGENT: Immediate medical consultation required.")
            recommendations.append("Consider emergency medical evaluation.")
        
        if features['bp_systolic'] > 140 or features['bp_diastolic'] > 90:
            recommendations.append("🩺 High Blood Pressure detected. Monitor regularly and consult cardiologist.")
        
        if features['blood_sugar'] > 126:
            recommendations.append("🍬 Elevated blood sugar levels. Diabetes screening recommended.")
        
        if features['cholesterol'] > 240:
            recommendations.append("💊 High cholesterol. Consider dietary changes and lipid-lowering medication.")
        
        if features['bmi'] > 30:
            recommendations.append("⚖️ BMI indicates obesity. Weight management program recommended.")
        
        if features['is_smoker']:
            recommendations.append("🚭 Smoking cessation is crucial. Join a quit-smoking program.")
        
        if features['is_alcoholic']:
            recommendations.append("🍺 Reduce alcohol consumption. Seek support if needed.")
        
        if risk_level == 'Medium':
            recommendations.append("📊 Regular health checkups every 3-6 months advised.")
        
        if risk_level == 'Low':
            recommendations.append("✅ Maintain healthy lifestyle. Annual checkups recommended.")
        
        # Lifestyle recommendations
        recommendations.append("🏃 Regular exercise: 30 minutes daily.")
        recommendations.append("🥗 Balanced diet: More fruits, vegetables, and whole grains.")
        recommendations.append("😴 Adequate sleep: 7-8 hours per night.")
        
        return recommendations


if __name__ == '__main__':
    # Train model when run directly
    model = StrokeMLModel()
    model.train()
