"""
split_dataset.py — Automatically split a flat image dataset into train/val/test
================================================================================
Use this if you have images organised as:
    source/
      Stroke/    <- all stroke images
      Normal/    <- all normal images

It will create:
    output/
      train/Stroke/  train/Normal/
      val/Stroke/    val/Normal/
      test/Stroke/   test/Normal/

Usage:
    python split_dataset.py --source path/to/your/images
    python split_dataset.py --source path/to/your/images --output dataset --split 0.70 0.15 0.15
"""

import argparse
import os
import shutil
import random
from pathlib import Path


SUPPORTED_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}


def parse_args():
    parser = argparse.ArgumentParser(description='Split dataset into train/val/test')
    parser.add_argument('--source', required=True,
                        help='Source folder containing class subfolders (e.g., Stroke/, Normal/)')
    parser.add_argument('--output', default='dataset',
                        help='Output folder (default: dataset/)')
    parser.add_argument('--split', nargs=3, type=float, default=[0.70, 0.15, 0.15],
                        metavar=('TRAIN', 'VAL', 'TEST'),
                        help='Train/val/test split ratios (default: 0.70 0.15 0.15)')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed for reproducibility (default: 42)')
    parser.add_argument('--copy', action='store_true',
                        help='Copy files instead of moving them (default: move)')
    return parser.parse_args()


def split_class(source_dir, output_dir, class_name, ratios, seed, copy=True):
    src_class_dir = Path(source_dir) / class_name

    # Collect images
    images = [
        f for f in src_class_dir.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTS
    ]

    if not images:
        print(f"  ⚠️  No images found in {src_class_dir}")
        return

    random.seed(seed)
    random.shuffle(images)

    total  = len(images)
    n_train = int(total * ratios[0])
    n_val   = int(total * ratios[1])
    n_test  = total - n_train - n_val

    splits = {
        'train': images[:n_train],
        'val':   images[n_train:n_train + n_val],
        'test':  images[n_train + n_val:]
    }

    for split_name, files in splits.items():
        dest_dir = Path(output_dir) / split_name / class_name
        dest_dir.mkdir(parents=True, exist_ok=True)

        for img_path in files:
            dest = dest_dir / img_path.name
            if copy:
                shutil.copy2(img_path, dest)
            else:
                shutil.move(str(img_path), dest)

    print(f"  {class_name:8s}: {n_train} train | {n_val} val | {n_test} test  (total: {total})")


def main():
    args = parse_args()

    # Validate split ratios
    if abs(sum(args.split) - 1.0) > 1e-6:
        print(f"❌ Split ratios must sum to 1.0 (got {sum(args.split):.2f})")
        return

    source = Path(args.source)
    if not source.is_dir():
        print(f"❌ Source folder not found: {source}")
        return

    # Detect class folders
    classes = [d.name for d in source.iterdir() if d.is_dir()]
    if not classes:
        print(f"❌ No class subfolders found in {source}")
        print("   Expected: Stroke/ and Normal/ inside your source folder.")
        return

    print(f"\n📁 Source     : {source}")
    print(f"📦 Output     : {args.output}")
    print(f"📊 Split      : {args.split[0]:.0%} train / {args.split[1]:.0%} val / {args.split[2]:.0%} test")
    print(f"🏷️  Classes    : {classes}")
    print(f"📋 Mode       : {'copy' if args.copy else 'move'}\n")

    print("Splitting dataset...")
    for class_name in sorted(classes):
        split_class(source, args.output, class_name, args.split, args.seed, copy=args.copy)

    print(f"\n✅ Done! Dataset ready at: {args.output}/")
    print("   Now run: python train_dl.py")


if __name__ == '__main__':
    main()
