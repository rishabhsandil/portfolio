from PIL import Image
import os

# Directory containing the images
drinks_dir = "images/drinks"

# Target maximum dimension (width or height)
max_dimension = 600

# JPEG quality setting (0-100, higher = better quality but larger file)
jpeg_quality = 85

# Get all jpg files in the drinks directory
image_files = [f for f in os.listdir(drinks_dir) if f.lower().endswith('.jpg')]

print(f"Found {len(image_files)} images to resize\n")

for filename in image_files:
    filepath = os.path.join(drinks_dir, filename)
    
    try:
        # Open the image
        with Image.open(filepath) as img:
            # Get original size
            original_size = os.path.getsize(filepath)
            original_width, original_height = img.size
            
            # Calculate new dimensions while maintaining aspect ratio
            if original_width > max_dimension or original_height > max_dimension:
                if original_width > original_height:
                    new_width = max_dimension
                    new_height = int((max_dimension / original_width) * original_height)
                else:
                    new_height = max_dimension
                    new_width = int((max_dimension / original_height) * original_width)
                
                # Resize the image using Lanczos resampling for high quality
                img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Convert to RGB if necessary (in case of RGBA or other formats)
                if img_resized.mode != 'RGB':
                    img_resized = img_resized.convert('RGB')
                
                # Save the resized image, replacing the original
                img_resized.save(filepath, 'JPEG', quality=jpeg_quality, optimize=True)
                
                # Get new size
                new_size = os.path.getsize(filepath)
                
                print(f"{filename}:")
                print(f"  {original_width}x{original_height} -> {new_width}x{new_height}")
                print(f"  {original_size/1024:.1f} KB -> {new_size/1024:.1f} KB")
                print(f"  Saved {(original_size-new_size)/1024:.1f} KB ({((original_size-new_size)/original_size)*100:.1f}% reduction)\n")
            else:
                print(f"{filename}: Already optimized ({original_width}x{original_height})\n")
                
    except Exception as e:
        print(f"Error processing {filename}: {str(e)}\n")

print("All images processed!")
