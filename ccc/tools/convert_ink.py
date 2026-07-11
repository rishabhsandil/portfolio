from PIL import Image

# Load the original ink2.png
img = Image.open('images/ink2.png')
print(f'Original size: {img.size}')
print(f'Original mode: {img.mode}')

# Convert to RGBA if not already
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Get pixel data
pixels = img.load()
width, height = img.size

# Define coffee color - rich brown: #3d2817 = rgb(61, 40, 23)
# Updated to Dark Blue: #192C55 = rgb(25, 44, 85)
coffee_r, coffee_g, coffee_b = 25, 44, 85

# Replace all non-transparent pixels with coffee color while preserving alpha
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 0:  # Only modify non-transparent pixels
            pixels[x, y] = (coffee_r, coffee_g, coffee_b, a)

# Save the coffee-colored version
img.save('images/ink2.png', 'PNG')
print('Updated images/ink2.png with coffee colors')

