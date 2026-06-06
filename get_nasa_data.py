import os
import math
import random
import time
import requests
from PIL import Image

# Configuration
NUM_LEVELS = 10
ZOOM = 9  # High resolution zoom level for MODIS
HEADERS = {"User-Agent": "SatellitePuzzleGame_Contact_myemail@domain.com"}

# Create directories
os.makedirs("puzzle_game/full_maps", exist_ok=True)


# Math helper: Converts Lat/Lon into NASA GIBS / Google tile coordinates
def lat_lon_to_tile(lat, lon, zoom):
    lat_rad = math.radians(lat)
    n = 2.0**zoom
    x_tile = int((lon + 180.0) / 360.0 * n)
    y_tile = int(
        (1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi)
        / 2.0
        * n
    )
    return x_tile, y_tile


# Fetch a single 256x256 tile from NASA
def download_tile(x, y, zoom):
    url = f"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/{zoom}/{y}/{x}.jpg"
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            return response.content
    except Exception:
        return None
    return None


print(f"🚀 Starting generation of {NUM_LEVELS} levels...")

level_count = 0
while level_count < NUM_LEVELS:
    # 1. Pick a random coordinate on Earth
    # Avoiding extreme poles where map projections distort or fail
    random_lat = random.uniform(-60.0, 60.0)
    random_lon = random.uniform(-180.0, 180.0)

    # 2. Convert to base tile coordinate
    base_x, base_y = lat_lon_to_tile(random_lat, random_lon, ZOOM)

    # 3. Create a 4x4 block of tiles (16 total) to form one big image
    # NASA tiles are 256x256 pixels. A 4x4 block gives us a crisp 1024x1024 image.
    stitched_image = Image.new("RGB", (1024, 1024))
    success = True

    print(
        f"Generating Level {level_count}... Coordinates: ({random_lat:.4f}, {random_lon:.4f})"
    )

    for row in range(4):
        for col in range(4):
            tile_x = base_x + col
            tile_y = base_y + row

            tile_data = download_tile(tile_x, tile_y, ZOOM)

            # If NASA returns a blank tile or error (e.g. over open ocean with no data), discard level
            if not tile_data:
                success = False
                break

            # Paste the tile into our canvas
            with open("temp_tile.jpg", "wb") as f:
                f.write(tile_data)
            tile_img = Image.open("temp_tile.jpg")
            stitched_image.paste(tile_img, (col * 256, row * 256))
            time.sleep(0.1)  # Be gentle on NASA's servers

        if not success:
            break

    if not success:
        print("❌ Layer data incomplete or mostly ocean. Retrying a new location...")
        continue

    # 4. Save the full large image
    level_dir = f"puzzle_game/level_{level_count}"
    os.makedirs(level_dir, exist_ok=True)

    full_image_path = f"puzzle_game/full_maps/level_{level_count}.jpg"
    stitched_image.save(full_image_path)

    # 5. Automatically slice the big image into a 4x4 grid of pieces for your game
    piece_size = 256
    piece_index = 0
    for row in range(4):
        for col in range(4):
            left = col * piece_size
            top = row * piece_size
            right = left + piece_size
            bottom = top + piece_size

            # Crop out the individual 256x256 puzzle piece
            piece = stitched_image.crop((left, top, right, bottom))
            piece.save(f"{level_dir}/piece_{piece_index}.jpg")
            piece_index += 1

    print(f"✅ Success! Level {level_count} generated. Saved pieces to {level_dir}")
    level_count += 1

# Clean up temp file
if os.path.exists("temp_tile.jpg"):
    os.remove("temp_tile.jpg")

print("\n🎉 All done! Check the 'puzzle_game' directory for your game assets.")
