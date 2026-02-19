import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model  # type: ignore
from tensorflow.keras.applications import EfficientNetB0  # type: ignore
from tensorflow.keras.preprocessing.image import load_img, img_to_array  # type: ignore
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau  # type: ignore
import os
import cv2

class StrokeDLModel:
    def __init__(self, img_height=224, img_width=224, use_transfer_learning=True):
        self.img_height = img_height
        self.img_width = img_width
        self.model = None
        self.use_transfer_learning = use_transfer_learning
        self.training_history = None
    
    def create_model(self):
        """Create CNN model with Transfer Learning (EfficientNet)"""
        if self.use_transfer_learning:
            print("Creating Transfer Learning model with EfficientNetB0...")
            # Load pretrained EfficientNetB0
            base_model = EfficientNetB0(
                include_top=False,
                weights='imagenet',
                input_shape=(self.img_height, self.img_width, 3)
            )
            
            # Freeze base model layers initially
            base_model.trainable = False
            
            # Add custom classification head
            inputs = layers.Input(shape=(self.img_height, self.img_width, 3))
            x = base_model(inputs, training=False)
            x = layers.GlobalAveragePooling2D()(x)
            x = layers.BatchNormalization()(x)
            x = layers.Dense(512, activation='relu')(x)
            x = layers.Dropout(0.5)(x)
            x = layers.Dense(256, activation='relu')(x)
            x = layers.Dropout(0.3)(x)
            outputs = layers.Dense(4, activation='softmax')(x)
            
            model = Model(inputs, outputs)
        else:
            # Original CNN architecture
            model = tf.keras.Sequential([  # type: ignore
                layers.Input(shape=(self.img_height, self.img_width, 3)),
                layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                layers.Flatten(),
                layers.Dense(512, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                layers.Dense(256, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                
                layers.Dense(4, activation='softmax')
            ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),  # type: ignore
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def create_synthetic_training_data(self, n_samples=1000):
        """Create synthetic training data for demonstration"""
        print("Creating synthetic training data...")
        
        # Generate random images (in real scenario, use actual MRI/CT scans)
        X = np.random.rand(n_samples, self.img_height, self.img_width, 3)
        
        # Generate labels based on image characteristics
        # This is simplified; in reality, labels would come from medical experts
        y = np.random.randint(0, 4, n_samples)
        
        return X, y
    
    def train(self, save_path='models/stroke_dl_model.h5', epochs=20):
        """Train the CNN model with callbacks"""
        print("Creating CNN model...")
        self.model = self.create_model()
        
        print(self.model.summary())
        
        # Create synthetic data
        X_train, y_train = self.create_synthetic_training_data(n_samples=800)
        X_val, y_val = self.create_synthetic_training_data(n_samples=200)
        
        # Callbacks
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        )
        
        reduce_lr = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
        
        # Train model
        print("Training CNN model...")
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=32,
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        self.training_history = history.history
        
        # Save model
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        self.model.save(save_path)
        print(f"Model saved to {save_path}")
        
        return history
    
    def load(self, model_path='models/stroke_dl_model.h5'):
        """Load trained model"""
        if os.path.exists(model_path):
            self.model = tf.keras.models.load_model(model_path)  # type: ignore
            print("DL Model loaded successfully")
            return True
        return False
    
    def preprocess_image(self, image_path):
        """Preprocess image for prediction"""
        try:
            img = load_img(image_path, target_size=(self.img_height, self.img_width))
            img_array = img_to_array(img)
            img_array = img_array / 255.0  # Normalize
            img_array = np.expand_dims(img_array, axis=0)
            return img_array
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def predict(self, image_path):
        """
        Predict stroke risk from brain scan image
        Returns: (risk_level, confidence, stage, probabilities)
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load() first.")
        
        img_array = self.preprocess_image(image_path)
        if img_array is None:
            return None, None, None, None
        
        predictions = self.model.predict(img_array, verbose=0)
        probabilities = predictions[0]
        predicted_class = np.argmax(probabilities)
        confidence = probabilities[predicted_class]
        
        # Map prediction to risk and stage
        class_mapping = {
            0: ('Low', None),
            1: ('Medium', 'Stage 1'),
            2: ('High', 'Stage 2'),
            3: ('High', 'Stage 3')
        }
        
        risk_level, stage = class_mapping[int(predicted_class)]
        
        return risk_level, float(confidence), stage, probabilities.tolist()
    
    def combine_predictions(self, ml_result, dl_result):
        """Combine ML and DL predictions with dynamic confidence-based weighting"""
        if ml_result is None or dl_result is None:
            return ml_result if dl_result is None else dl_result
        
        ml_risk, ml_prob, ml_stage, _ = ml_result
        dl_risk, dl_prob, dl_stage, _ = dl_result
        
        # Dynamic weighting based on confidence levels
        # Higher confidence gets more weight
        total_confidence = ml_prob + dl_prob
        ml_weight = ml_prob / total_confidence if total_confidence > 0 else 0.3
        dl_weight = dl_prob / total_confidence if total_confidence > 0 else 0.7
        
        print(f"Dynamic weights - ML: {ml_weight:.2f}, DL: {dl_weight:.2f}")
        
        # Weight the predictions
        risk_scores = {'Low': 0, 'Medium': 1, 'High': 2}
        
        ml_score = risk_scores.get(ml_risk, 0)
        dl_score = risk_scores.get(dl_risk, 0)
        
        combined_score = ml_weight * ml_score + dl_weight * dl_score
        combined_prob = ml_weight * ml_prob + dl_weight * dl_prob
        
        # Determine final risk
        if combined_score < 0.7:
            final_risk = 'Low'
            final_stage = None
        elif combined_score < 1.5:
            final_risk = 'Medium'
            final_stage = ml_stage or dl_stage or 'Stage 1'
        else:
            final_risk = 'High'
            # Prefer DL stage if DL has higher confidence
            final_stage = dl_stage if dl_prob > ml_prob else (ml_stage or dl_stage or 'Stage 2')
        
        return final_risk, float(combined_prob), final_stage
    def generate_gradcam_heatmap(self, image_path, last_conv_layer_name=None):
        """Generate Grad-CAM heatmap for explainability"""
        if self.model is None:
            return None
        
        try:
            img_array = self.preprocess_image(image_path)
            if img_array is None:
                return None
            
            # Find last convolutional layer if not specified
            if last_conv_layer_name is None:
                for layer in reversed(self.model.layers):
                    if 'conv' in layer.name.lower():
                        last_conv_layer_name = layer.name
                        break
            
            if last_conv_layer_name is None:
                print("No convolutional layer found for Grad-CAM")
                return None
            
            # Create gradient model
            grad_model = tf.keras.Model(  # type: ignore
                [self.model.inputs],
                [self.model.get_layer(last_conv_layer_name).output, self.model.output]
            )
            
            with tf.GradientTape() as tape:
                conv_outputs, predictions = grad_model(img_array)
                class_idx = tf.argmax(predictions[0])
                class_channel = predictions[:, class_idx]
            
            # Compute gradients
            grads = tape.gradient(class_channel, conv_outputs)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            
            conv_outputs = conv_outputs[0]
            heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            
            # Normalize heatmap
            heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
            heatmap = heatmap.numpy()
            
            return heatmap
            
        except Exception as e:
            print(f"Error generating Grad-CAM: {e}")
            return None


if __name__ == '__main__':
    # Train model when run directly
    model = StrokeDLModel(use_transfer_learning=True)
    model.train(epochs=10)
