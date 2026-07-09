import os
import shutil
from PIL import Image, ImageDraw

def get_average_corner_color(img):
    # Read color near the top-left corner
    # Sample a small region (10x10) and average the colors
    region = img.crop((2, 2, 12, 12))
    pixels = list(region.getdata())
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    return f"#{r:02X}{g:02X}{b:02X}"

def build_icons():
    input_path = "/Users/tunc/.gemini/antigravity/brain/02393135-0c59-4d40-9351-c08ebf592898/media__1781191768633.jpg"
    res_dir = "/Users/tunc/Desktop/sınıf asistanı/sinif-asistani-android/app/src/main/res"
    
    # 1. Load original image
    original = Image.open(input_path)
    w, h = original.size
    
    # 2. Crop to square centered
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    square_img = original.crop((left, top, left + min_dim, top + min_dim))
    
    # 3. Get background color from the corner of the square image
    bg_color = get_average_corner_color(square_img)
    print(f"Extracted background color of the paper texture: {bg_color}")
    
    # Target folders and sizes
    # (folder_name, legacy_size, foreground_size)
    densities = [
        ("mipmap-mdpi", 48, 108),
        ("mipmap-hdpi", 72, 162),
        ("mipmap-xhdpi", 96, 216),
        ("mipmap-xxhdpi", 144, 324),
        ("mipmap-xxxhdpi", 192, 432)
    ]
    
    for folder, l_size, fg_size in densities:
        dest_folder = os.path.join(res_dir, folder)
        os.makedirs(dest_folder, exist_ok=True)
        
        # Delete old webp files to avoid duplicates
        for old_file in ["ic_launcher.webp", "ic_launcher_round.webp"]:
            file_path = os.path.join(dest_folder, old_file)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed old WebP file: {file_path}")
                
        # A. Legacy square icon (just the square cropped image)
        legacy_square = square_img.resize((l_size, l_size), Image.Resampling.LANCZOS)
        legacy_square.save(os.path.join(dest_folder, "ic_launcher.png"), "PNG")
        
        # B. Legacy round icon (apply circular mask)
        mask = Image.new('L', (l_size, l_size), 0)
        draw = ImageDraw.Draw(mask)
        # 4% margin all around
        margin = int(l_size * 0.04)
        draw.ellipse((margin, margin, l_size - margin, l_size - margin), fill=255)
        
        legacy_round = Image.new('RGBA', (l_size, l_size), (0, 0, 0, 0))
        legacy_round.paste(legacy_square, (0, 0), mask=mask)
        legacy_round.save(os.path.join(dest_folder, "ic_launcher_round.png"), "PNG")
        
        # C. Adaptive foreground icon
        # According to Android guidelines:
        # Size is 108dp. Safe zone is center circle of 66dp (61% of total size).
        # Let's make the badge fit inside the safe zone (e.g. 64% of fg_size).
        badge_size = int(fg_size * 0.64)
        resized_badge = square_img.resize((badge_size, badge_size), Image.Resampling.LANCZOS)
        
        # Apply circular mask to the badge
        badge_mask = Image.new('L', (badge_size, badge_size), 0)
        badge_draw = ImageDraw.Draw(badge_mask)
        badge_margin = int(badge_size * 0.04)
        badge_draw.ellipse((badge_margin, badge_margin, badge_size - badge_margin, badge_size - badge_margin), fill=255)
        
        masked_badge = Image.new('RGBA', (badge_size, badge_size), (0, 0, 0, 0))
        masked_badge.paste(resized_badge, (0, 0), mask=badge_mask)
        
        # Center the masked badge on a transparent canvas of size fg_size x fg_size
        fg_canvas = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        offset = (fg_size - badge_size) // 2
        fg_canvas.paste(masked_badge, (offset, offset), mask=masked_badge)
        fg_canvas.save(os.path.join(dest_folder, "ic_launcher_foreground.png"), "PNG")
        
        print(f"Generated icons for {folder} (square: {l_size}px, round: {l_size}px, foreground: {fg_size}px)")
        
    # 4. Modify ic_launcher_background.xml to use extracted background color
    bg_xml_path = os.path.join(res_dir, "drawable", "ic_launcher_background.xml")
    bg_content = f"""<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="{bg_color}"
        android:pathData="M0,0h108v108h-108z" />
</vector>
"""
    with open(bg_xml_path, "w") as f:
        f.write(bg_content)
    print(f"Updated {bg_xml_path} with fillColor={bg_color}")
    
    # 5. Update adaptive icon definition XMLs to use @mipmap/ic_launcher_foreground
    any_dpi_dir = os.path.join(res_dir, "mipmap-anydpi-v26")
    
    ic_launcher_xml_path = os.path.join(any_dpi_dir, "ic_launcher.xml")
    ic_launcher_round_xml_path = os.path.join(any_dpi_dir, "ic_launcher_round.xml")
    
    xml_content = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    with open(ic_launcher_xml_path, "w") as f:
        f.write(xml_content)
    with open(ic_launcher_round_xml_path, "w") as f:
        f.write(xml_content)
    print("Updated adaptive icon definition XMLs in mipmap-anydpi-v26")

if __name__ == "__main__":
    build_icons()
