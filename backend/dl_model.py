"""
Stroke Detection Deep Learning Model
- Binary classification: Normal vs Stroke
- EfficientNetB0 Transfer Learning with fine-tuning
- Grad-CAM explainability
- Supports real MRI dataset from folder structure:
    dataset/train/Stroke/ & dataset/train/Normal/
    dataset/val/Stroke/   & dataset/val/Normal/
    dataset/test/Stroke/  & dataset/test/Normal/
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model  # type: ignore
from tensorflow.keras.applications import EfficientNetB0  # type: ignore
from tensorflow.keras.preprocessing.image import load_img, img_to_array  # type: ignore
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint  # type: ignore
from tensorflow.keras.preprocessing.image import ImageDataGenerator  # type: ignore
from sklearn.metrics import classification_report, precision_recall_fscore_support
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
import os
import cv2
import base64
from PIL import Image


# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
IMG_HEIGHT = 224
IMG_WIDTH  = 224
IMG_SIZE   = (IMG_HEIGHT, IMG_WIDTH)
CLASSES    = ['Normal', 'Stroke']   # alphabetical = keras default order
NUM_CLASSES = 2
BATCH_SIZE  = 32


class StrokeDLModel:
    def __init__(self, img_height=IMG_HEIGHT, img_width=IMG_WIDTH):
        self.img_height = img_height
        self.img_width  = img_width
        self.model      = None
        self.training_history = None
        # Paths
        self.dataset_dir   = 'dataset'
        self.model_path    = 'models/stroke_dl_model.keras'
        self.model_path_h5 = 'models/stroke_dl_model.h5'

    # ──────────────────────────────────────────────
    # Model Architecture
    # ──────────────────────────────────────────────

    def build_model(self, fine_tune_at=None):
        """
        EfficientNetB0 Transfer Learning for binary classification.
        fine_tune_at: layer index from which to unfreeze (None = frozen base).
        """
        base_model = EfficientNetB0(
            include_top=False,
            weights='imagenet',
            input_shape=(self.img_height, self.img_width, 3)
        )
        base_model.trainable = False   # freeze initially

        if fine_tune_at is not None:
            # Unfreeze layers from fine_tune_at onwards
            for layer in base_model.layers[:fine_tune_at]:
                layer.trainable = False
            for layer in base_model.layers[fine_tune_at:]:
                layer.trainable = True

        inputs = layers.Input(shape=(self.img_height, self.img_width, 3))

        # EfficientNet expects pixel values in [0, 255]; no pre-scaling needed
        x = base_model(inputs, training=(fine_tune_at is not None))
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(256, activation='relu',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)  # type: ignore
        x = layers.Dropout(0.5)(x)
        x = layers.Dense(128, activation='relu',
                         kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)  # type: ignore
        x = layers.Dropout(0.3)(x)
        outputs = layers.Dense(1, activation='sigmoid')(x)   # binary

        model = Model(inputs, outputs, name='StrokeDL')
        return model, base_model

    def _compile(self, model, lr=1e-3):
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=lr),  # type: ignore
            loss='binary_crossentropy',
            metrics=[
                'accuracy',
                tf.keras.metrics.Precision(name='precision'),  # type: ignore
                tf.keras.metrics.Recall(name='recall'),         # type: ignore
                tf.keras.metrics.AUC(name='auc')                # type: ignore
            ]
        )

    # ──────────────────────────────────────────────
    # Data Generators
    # ──────────────────────────────────────────────

    def get_data_generators(self):
        """Create augmented train + validation generators from folder structure.
        NOTE: NO rescale — EfficientNetB0 includes its own internal preprocessing
        and expects raw pixel values in [0, 255].
        """
        train_datagen = ImageDataGenerator(
            # DO NOT rescale — EfficientNetB0 handles its own preprocessing
            horizontal_flip=True,
            rotation_range=20,
            zoom_range=0.2,
            width_shift_range=0.15,
            height_shift_range=0.15,
            brightness_range=[0.8, 1.2],
            shear_range=0.1,
            fill_mode='nearest'
        )

        val_datagen = ImageDataGenerator()   # NO rescale

        train_generator = train_datagen.flow_from_directory(
            os.path.join(self.dataset_dir, 'train'),
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='binary',
            classes=CLASSES,
            shuffle=True
        )

        val_generator = val_datagen.flow_from_directory(
            os.path.join(self.dataset_dir, 'val'),
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='binary',
            classes=CLASSES,
            shuffle=False
        )

        return train_generator, val_generator

    def get_test_generator(self):
        test_datagen = ImageDataGenerator()   # NO rescale
        test_generator = test_datagen.flow_from_directory(
            os.path.join(self.dataset_dir, 'test'),
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='binary',
            classes=CLASSES,
            shuffle=False
        )
        return test_generator

    def _callbacks(self, best_model_path, patience=8):
        return [
            EarlyStopping(
                monitor='val_auc', mode='max',
                patience=patience, restore_best_weights=True, verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss', factor=0.3,
                patience=4, min_lr=1e-7, verbose=1
            ),
            ModelCheckpoint(
                best_model_path, monitor='val_auc',
                mode='max', save_best_only=True, verbose=1
            )
        ]

    # ──────────────────────────────────────────────
    # Training
    # ──────────────────────────────────────────────

    def train(self, epochs=20, fine_tune_epochs=10,
              save_path='models/stroke_dl_model.keras'):
        """
        Two-phase training:
          Phase 1 — frozen EfficientNetB0 base (fast, high LR)
          Phase 2 — fine-tune top layers of EfficientNetB0 (slow, low LR)
        """
        os.makedirs('models', exist_ok=True)

        dataset_exists = os.path.isdir(os.path.join(self.dataset_dir, 'train'))
        if not dataset_exists:
            print("⚠️  Real dataset not found at 'dataset/train'.")
            print("    Run split_dataset.py first, or use train_dl.py with --dataset flag.")
            print("    Using synthetic data for model structure validation only.")
            self._train_synthetic(save_path)
            return

        print("=" * 60)
        print("PHASE 1: Transfer Learning (frozen base)")
        print("=" * 60)

        train_gen, val_gen = self.get_data_generators()
        self.model, base_model = self.build_model()
        self._compile(self.model, lr=1e-3)

        print(self.model.summary())

        # ── Compute class weights to handle imbalance ──────────────────
        labels = train_gen.classes  # array of 0/1 for each training image
        classes_arr = np.unique(labels)
        weights = compute_class_weight('balanced', classes=classes_arr, y=labels)
        class_weight = dict(zip(classes_arr.tolist(), weights.tolist()))
        print(f"\n⚖️  Class weights: Normal={class_weight[0]:.3f}, Stroke={class_weight[1]:.3f}")

        history1 = self.model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=epochs,
            class_weight=class_weight,
            callbacks=self._callbacks(save_path, patience=8),
            verbose=1
        )

        print("\n" + "=" * 60)
        print("PHASE 2: Fine-tuning (unfreezing top layers)")
        print("=" * 60)

        # Unfreeze top 30 layers of EfficientNet
        fine_tune_at = max(0, len(base_model.layers) - 30)
        for layer in base_model.layers[fine_tune_at:]:
            layer.trainable = True

        self._compile(self.model, lr=1e-5)

        history2 = self.model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=fine_tune_epochs,
            class_weight=class_weight,
            callbacks=self._callbacks(save_path, patience=5),
            verbose=1
        )

        # Merge histories
        self.training_history = {
            k: history1.history.get(k, []) + history2.history.get(k, [])
            for k in set(list(history1.history.keys()) + list(history2.history.keys()))
        }

        print(f"\n✅ Model saved to {save_path}")
        return self.training_history

    def _train_synthetic(self, save_path):
        """Fallback: train on random data just to validate architecture."""
        print("Training on synthetic data (demo mode)...")
        self.model, _ = self.build_model()
        self._compile(self.model, lr=1e-3)

        X = np.random.rand(200, self.img_height, self.img_width, 3).astype(np.float32)
        y = np.random.randint(0, 2, 200).astype(np.float32)

        self.model.fit(X, y, epochs=3, batch_size=32, validation_split=0.2, verbose=1)
        self.model.save(save_path)
        print(f"Synthetic model saved to {save_path}")

    # ──────────────────────────────────────────────
    # Evaluation
    # ──────────────────────────────────────────────

    def evaluate(self):
        """Evaluate on test set, print full metrics."""
        if self.model is None:
            print("Model not loaded.")
            return None

        test_gen = self.get_test_generator()
        print("\n📊 Evaluating on test set...")

        # Get predictions
        probs = self.model.predict(test_gen, verbose=1).flatten()
        # Use 0.35 threshold — favours Stroke recall (fewer missed strokes)
        y_pred = (probs >= 0.35).astype(int)
        y_true = test_gen.classes

        report = classification_report(y_true, y_pred,
                                       target_names=CLASSES, digits=4,
                                       zero_division=0)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average='weighted', zero_division=0
        )

        print("\n" + "=" * 60)
        print("TEST SET EVALUATION")
        print("=" * 60)
        print(report)
        print(f"Weighted F1-Score : {f1:.4f}")
        print(f"Precision         : {precision:.4f}")
        print(f"Recall            : {recall:.4f}")

        metrics = {
            'precision': float(precision),
            'recall':    float(recall),
            'f1_score':  float(f1),
            'report':    report
        }
        return metrics

    # ──────────────────────────────────────────────
    # Load
    # ──────────────────────────────────────────────

    def load(self, model_path=None):
        """Load model — supports both .keras and legacy .h5 format."""
        paths_to_try = []
        if model_path:
            paths_to_try.append(model_path)
        paths_to_try += [self.model_path, self.model_path_h5]

        for path in paths_to_try:
            if os.path.exists(path):
                try:
                    self.model = tf.keras.models.load_model(path)  # type: ignore
                    print(f"DL Model loaded successfully from {path}")
                    return True
                except Exception as e:
                    print(f"Failed to load {path}: {e}")
        return False

    # ──────────────────────────────────────────────
    # Preprocessing
    # ──────────────────────────────────────────────

    def preprocess_image(self, image_path):
        """Load and preprocess image for prediction.
        Returns float32 array in [0, 255] — EfficientNetB0 handles its own normalisation.
        """
        try:
            img = load_img(image_path, target_size=IMG_SIZE)
            # Keep in [0, 255] — EfficientNetB0 preprocesses internally
            arr = img_to_array(img).astype(np.float32)
            return np.expand_dims(arr, axis=0)          # shape: (1, H, W, 3)
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None

    # ──────────────────────────────────────────────
    # Predict
    # ──────────────────────────────────────────────

    def predict(self, image_path):
        """
        Predict stroke risk from a brain scan image.
        Returns: (risk_level, confidence, stage, probabilities_list)
          risk_level   : 'High' (Stroke) or 'Low' (Normal)
          confidence   : float 0-1 (probability of the predicted class)
          stage        : 'Stroke Detected' or None
          probabilities: [prob_normal, prob_stroke]
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load() first.")

        img_array = self.preprocess_image(image_path)
        if img_array is None:
            return None, None, None, None

        stroke_prob = float(self.model.predict(img_array, verbose=0)[0][0])
        normal_prob = 1.0 - stroke_prob

        # Use 0.35 threshold for better stroke recall (medical safety)
        if stroke_prob >= 0.35:
            risk_level  = 'High'
            confidence  = stroke_prob
            stage       = 'Stroke Detected'
        else:
            risk_level  = 'Low'
            confidence  = normal_prob
            stage       = None

        return risk_level, confidence, stage, [normal_prob, stroke_prob]

    # ──────────────────────────────────────────────
    # Grad-CAM
    # ──────────────────────────────────────────────

    def generate_gradcam_heatmap(self, image_path, conv_layer_name=None):
        """
        Generate raw Grad-CAM heatmap (numpy array, normalised 0-1).
        Automatically finds EfficientNetB0's 'top_conv' layer.
        """
        if self.model is None:
            return None

        img_array = self.preprocess_image(image_path)
        if img_array is None:
            return None

        # Auto-find last conv layer
        if conv_layer_name is None:
            for layer in reversed(self.model.layers):
                if 'conv' in layer.name.lower() or layer.name == 'top_conv':
                    conv_layer_name = layer.name
                    break
            # Walk into nested EfficientNet model if needed
            if conv_layer_name is None:
                for layer in self.model.layers:
                    if hasattr(layer, 'layers'):
                        for sublayer in reversed(layer.layers):
                            if 'conv' in sublayer.name.lower():
                                conv_layer_name = sublayer.name
                                break
                    if conv_layer_name:
                        break

        if conv_layer_name is None:
            print("⚠️  No conv layer found for Grad-CAM")
            return None

        try:
            # Build gradient model
            try:
                conv_out = self.model.get_layer(conv_layer_name).output
            except ValueError:
                # Layer may be inside sub-model
                for layer in self.model.layers:
                    if hasattr(layer, 'get_layer'):
                        try:
                            conv_out = layer.get_layer(conv_layer_name).output
                            break
                        except Exception:
                            continue
                else:
                    return None

            grad_model = tf.keras.Model(  # type: ignore
                inputs=self.model.inputs,
                outputs=[conv_out, self.model.output]
            )

            with tf.GradientTape() as tape:
                tape.watch(img_array)
                conv_outputs, predictions = grad_model(img_array)
                # For binary sigmoid: gradient w.r.t. the stroke output
                loss = predictions[:, 0]

            grads = tape.gradient(loss, conv_outputs)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

            conv_outputs = conv_outputs[0]
            heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0)
            max_val = tf.math.reduce_max(heatmap)
            if max_val > 0:
                heatmap = heatmap / max_val
            return heatmap.numpy()

        except Exception as e:
            print(f"Error generating Grad-CAM: {e}")
            import traceback; traceback.print_exc()
            return None

    def get_gradcam_overlay_base64(self, image_path, alpha=0.4):
        """
        Generate Grad-CAM heatmap overlaid on the original image.
        Returns a base64-encoded PNG string for the API to serve.
        """
        heatmap = self.generate_gradcam_heatmap(image_path)
        if heatmap is None:
            return None

        # Load original image
        orig = cv2.imread(image_path)
        if orig is None:
            # Try PIL fallback
            pil_img = Image.open(image_path).convert('RGB')
            orig = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        orig = cv2.resize(orig, IMG_SIZE)

        # Resize heatmap to image size and convert to colour
        heatmap_resized = cv2.resize(heatmap, IMG_SIZE)
        heatmap_uint8   = np.uint8(255 * heatmap_resized)
        heatmap_colour  = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Overlay
        overlay = cv2.addWeighted(orig, 1 - alpha, heatmap_colour, alpha, 0)

        # Encode to base64
        success, buffer = cv2.imencode('.png', overlay)
        if not success:
            return None
        b64 = base64.b64encode(buffer.tobytes()).decode('utf-8')
        return f"data:image/png;base64,{b64}"

    # ──────────────────────────────────────────────
    # Combine ML + DL
    # ──────────────────────────────────────────────

    def combine_predictions(self, ml_result, dl_result):
        """
        Combine ML (tabular) and DL (image) predictions.
        ml_result: (risk_level, probability, stage, probs_list)
        dl_result: (risk_level, probability, stage, probs_list)
        Returns: (final_risk, final_probability, final_stage)
        """
        if ml_result is None:
            return dl_result[:3]
        if dl_result is None:
            return ml_result[:3]

        ml_risk, ml_prob, ml_stage, _ = ml_result
        dl_risk, dl_prob, dl_stage, _ = dl_result

        # Weights: DL gets slightly more weight when image is available
        ML_WEIGHT = 0.40
        DL_WEIGHT = 0.60

        risk_scores = {'Low': 0.0, 'Medium': 0.5, 'High': 1.0}
        ml_score = risk_scores.get(ml_risk, 0.0)
        dl_score = risk_scores.get(dl_risk, 0.0)

        combined_score = ML_WEIGHT * ml_score + DL_WEIGHT * dl_score
        combined_prob  = ML_WEIGHT * ml_prob  + DL_WEIGHT * dl_prob

        if combined_score < 0.35:
            final_risk  = 'Low'
            final_stage = None
        elif combined_score < 0.65:
            final_risk  = 'Medium'
            final_stage = ml_stage or 'Stage 1'
        else:
            final_risk  = 'High'
            final_stage = dl_stage or ml_stage or 'Stage 2'

        return final_risk, float(combined_prob), final_stage


# ──────────────────────────────────────────────
# Standalone test
# ──────────────────────────────────────────────
if __name__ == '__main__':
    model = StrokeDLModel()
    model.train(epochs=20, fine_tune_epochs=10)
