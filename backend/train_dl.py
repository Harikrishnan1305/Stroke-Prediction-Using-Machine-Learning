"""
train_dl.py — Standalone DL Model Training Script
=================================================
Usage:
    python train_dl.py                        # default: looks for dataset/ folder
    python train_dl.py --dataset path/to/data # custom dataset path
    python train_dl.py --epochs 30 --fine-tune-epochs 15

Dataset folder structure expected:
    dataset/
      train/
        Stroke/   <- stroke MRI images (.jpg/.png)
        Normal/   <- normal MRI images
      val/
        Stroke/
        Normal/
      test/
        Stroke/
        Normal/

If you have a flat dataset, run split_dataset.py first.
"""

import argparse
import os
import sys

def parse_args():
    parser = argparse.ArgumentParser(description='Train Stroke DL Model')
    parser.add_argument('--dataset',           default='dataset',
                        help='Path to dataset root folder (default: dataset/)')
    parser.add_argument('--epochs',            type=int, default=20,
                        help='Phase 1 training epochs (default: 20)')
    parser.add_argument('--fine-tune-epochs',  type=int, default=10,
                        help='Phase 2 fine-tuning epochs (default: 10)')
    parser.add_argument('--output',            default='models/stroke_dl_model.keras',
                        help='Output model path (default: models/stroke_dl_model.keras)')
    parser.add_argument('--evaluate',          action='store_true',
                        help='Run evaluation on test set after training')
    return parser.parse_args()


def check_dataset(dataset_path):
    """Validate dataset folder structure."""
    required = [
        os.path.join(dataset_path, 'train', 'Stroke'),
        os.path.join(dataset_path, 'train', 'Normal'),
        os.path.join(dataset_path, 'val',   'Stroke'),
        os.path.join(dataset_path, 'val',   'Normal'),
    ]
    missing = [p for p in required if not os.path.isdir(p)]
    if missing:
        print("❌ Dataset folder structure is incomplete!")
        print("   Missing folders:")
        for m in missing:
            print(f"     {m}")
        print("\n   Please run: python split_dataset.py --source <your_image_folder>")
        print("   Or create the folder structure manually.")
        return False

    # Count images
    for split in ['train', 'val', 'test']:
        for cls in ['Stroke', 'Normal']:
            path = os.path.join(dataset_path, split, cls)
            if os.path.isdir(path):
                count = len([f for f in os.listdir(path)
                             if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))])
                print(f"  {split:5s}/{cls:6s}: {count} images")
    return True


def main():
    args = parse_args()

    print("=" * 60)
    print("  STROKE PREDICTION — DL MODEL TRAINING")
    print("=" * 60)
    print(f"\nDataset    : {args.dataset}")
    print(f"Epochs     : {args.epochs} (+ {args.fine_tune_epochs} fine-tune)")
    print(f"Output     : {args.output}\n")

    # Validate dataset
    print("📁 Checking dataset structure...")
    if not check_dataset(args.dataset):
        sys.exit(1)

    # Import after validation to avoid TF loading if dataset is missing
    from dl_model import StrokeDLModel

    model = StrokeDLModel()
    model.dataset_dir = args.dataset

    print("\n🚀 Starting training...\n")
    model.train(
        epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
        save_path=args.output
    )

    # Optionally evaluate
    if args.evaluate:
        if not model.load(args.output):
            model.load()
        metrics = model.evaluate()
        if metrics:
            f1 = metrics['f1_score']
            target = 0.85
            status = "✅ PASS" if f1 >= target else "⚠️  BELOW TARGET"
            print(f"\n{status} — F1-Score: {f1:.4f} (target ≥ {target})")

    print("\n✅ Training complete!")
    print(f"   Model saved to: {args.output}")
    print("\nNext step: Run the Flask backend with:")
    print("   python app.py")


if __name__ == '__main__':
    main()
