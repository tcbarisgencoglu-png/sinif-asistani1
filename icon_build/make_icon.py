import os
from PIL import Image, ImageDraw

def create_circular_icon(input_path, output_path, size=512):
    # Load original image
    img = Image.open(input_path)
    w, h = img.size
    
    # 1. Crop to square centered
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    square_img = img.crop((left, top, right, bottom))
    
    # Resize to standard size (e.g. 512x512) for processing
    square_img = square_img.resize((size, size), Image.Resampling.LANCZOS)
    
    # 2. Create circular mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # We want to keep the circular badge. Let's find the circle radius.
    # The badge is almost full size. Let's draw a circle with margin.
    # Center is (size/2, size/2)
    # Let's try different diameters, e.g. size * 0.92
    margin = (size - int(size * 0.92)) // 2
    draw.ellipse((margin, margin, size - margin, size - margin), fill=255)
    
    # Apply mask
    output_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output_img.paste(square_img, (0, 0), mask=mask)
    
    # Save test image
    output_img.save(output_path, 'PNG')
    print(f"Saved test circular icon to {output_path} with margin={margin}")

if __name__ == '__main__':
    os.makedirs('icon_build', exist_ok=True)
    input_img = "/Users/tunc/.gemini/antigravity/brain/02393135-0c59-4d40-9351-c08ebf592898/media__1781191768633.jpg"
    create_circular_icon(input_img, "icon_build/test_circle.png")
