"""
Generate favicon files in different sizes from the source image.
"""
import sys
import io
from PIL import Image
from pathlib import Path

# Fix for Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Source image
source_image = Path("c:/Users/Admin/Downloads/delorme-favicon-150x150.png")
output_dir = Path("frontend/public/assets")

# Ensure output directory exists
output_dir.mkdir(parents=True, exist_ok=True)

# Load the source image
img = Image.open(source_image)

# Convert to RGBA if needed
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Define sizes to generate
sizes = {
    'favicon-16x16.png': (16, 16),
    'favicon-32x32.png': (32, 32),
    'android-chrome-192x192.png': (192, 192),
    'android-chrome-512x512.png': (512, 512),
    'apple-touch-icon.png': (180, 180),  # Apple recommends 180x180
}

# Generate each size
for filename, size in sizes.items():
    # Resize with high-quality resampling
    resized = img.resize(size, Image.Resampling.LANCZOS)

    # Save the file
    output_path = output_dir / filename
    resized.save(output_path, 'PNG', optimize=True)
    print(f"✅ Created {filename} ({size[0]}x{size[1]})")

# Generate ICO file (multi-size icon for browsers)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [img.resize(size, Image.Resampling.LANCZOS) for size in ico_sizes]
ico_path = output_dir / 'favicon.ico'
ico_images[0].save(ico_path, format='ICO', sizes=ico_sizes)
print(f"✅ Created favicon.ico (multi-size: 16x16, 32x32, 48x48)")

# Also create SVG if source is high quality (optional - just copy original for now)
# Copy the original 150x150 as a backup
backup_path = output_dir / 'favicon-150x150.png'
img.save(backup_path, 'PNG', optimize=True)
print(f"✅ Created favicon-150x150.png (original size)")

print(f"\n🎉 All favicon files generated successfully in {output_dir}")
print(f"\nGenerated files:")
print(f"  - favicon.ico (16x16, 32x32, 48x48)")
print(f"  - favicon-16x16.png")
print(f"  - favicon-32x32.png")
print(f"  - android-chrome-192x192.png")
print(f"  - android-chrome-512x512.png")
print(f"  - apple-touch-icon.png")
print(f"  - favicon-150x150.png (backup)")
