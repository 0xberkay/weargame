import os
import re
import glob
import subprocess
import time

WORKSPACE_DIR = "/home/notroot/Downloads/pngscreen/Selçuklu Seferi Oyunu (1)"
POSTS_DIR = os.path.join(WORKSPACE_DIR, "blog", "posts")
IMAGES_DIR = os.path.join(WORKSPACE_DIR, "blog", "posts-images")

# Ensure output directory exists
os.makedirs(IMAGES_DIR, exist_ok=True)

# Mapping categories to image filenames
CATEGORY_TO_IMAGE = {
    "bluetooth": "settings_bluetooth.png",
    "accessibility": "settings_accessibility.png",
    "developer": "settings_developer.png",
    "display": "settings_display.png",
    "sound": "settings_sound.png",
    "location": "settings_location.png",
    "gps": "settings_location.png",
    "apps": "settings_apps.png",
    "time": "settings_date.png",
    "home": "settings_home.png",
    "settings": "settings_main.png",
    "battery": "settings_main.png"  # generic fallback
}

# Screen capture intents map
SCREENSHOT_MAP = {
    'android.settings.BLUETOOTH_SETTINGS': 'settings_bluetooth.png',
    'android.settings.ACCESSIBILITY_SETTINGS': 'settings_accessibility.png',
    'android.settings.APPLICATION_DEVELOPMENT_SETTINGS': 'settings_developer.png',
    'android.settings.DISPLAY_SETTINGS': 'settings_display.png',
    'android.settings.SOUND_SETTINGS': 'settings_sound.png',
    'android.settings.LOCATION_SOURCE_SETTINGS': 'settings_location.png',
    'android.settings.DATE_SETTINGS': 'settings_date.png',
    'android.settings.APPLICATION_SETTINGS': 'settings_apps.png',
    'android.settings.SETTINGS': 'settings_main.png',
    'home': 'settings_home.png'
}

# Keyword rules for article body text
KEYWORDS = {
    "bluetooth": ["bluetooth", "headphone", "earbud", "pairing", "pair", "audio device", "wireless audio"],
    "accessibility": ["accessibility", "talkback", "screen reader", "magnif", "hearing aid", "mono audio", "high contrast"],
    "developer": ["developer options", "developer settings", "developer mode", "adb", "debugging", "sideload", "wireless debugging"],
    "display": ["display settings", "brightness", "screen timeout", "always-on", "always on", "aod", "screen brightness"],
    "sound": ["sound", "volume", "vibrate", "ringtone", "haptic", "silent mode", "audio balance", "speaker", "mute"],
    "location": ["gps", "location settings", "location tracking", "sensor calibration", "barometer", "compass", "altimeter", "location source"],
    "gps": ["gps", "location settings", "location tracking", "sensor calibration", "barometer", "compass", "altimeter", "location source"],
    "time": ["date", "time settings", "timezone", "calendar", "sync google calendar", "clock settings"],
    "apps": ["app crash", "sideload apps", "uninstall", "permissions", "application settings", "app store", "google play", "companion app", "whatsapp", "spotify", "fitbit", "google home", "google wallet"],
    "home": ["watch face", "clock face", "home screen", "tiles", "complications", "customization"],
    "settings": ["settings menu", "system settings", "factory reset", "software update", "about watch", "backup", "overheating", "clean and maintain", "water lock", "sos", "emergency"]
}

def capture_all_screenshots():
    print("=== CAPTURING SCREENSHOTS VIA ADB ===")
    captured = []
    
    # Check if any adb devices are online
    res = subprocess.run(["adb", "devices"], capture_output=True, text=True)
    if "device" not in res.stdout.split("\n")[1]:
        print("Error: No Wear OS emulator/device online via ADB.")
        return captured

    for intent, filename in SCREENSHOT_MAP.items():
        print(f"Processing intent: {intent} -> {filename}")
        # Wake up device and unlock
        subprocess.run(["adb", "shell", "input", "keyevent", "224"])
        subprocess.run(["adb", "shell", "input", "keyevent", "82"])
        
        try:
            if intent == 'home':
                subprocess.run(["adb", "shell", "input", "keyevent", "3"], check=True)
            else:
                subprocess.run(["adb", "shell", "am", "start", "-a", intent], check=True)
            
            # Wait for render
            time.sleep(3.0)
            
            out_path = os.path.join(IMAGES_DIR, filename)
            with open(out_path, "wb") as f:
                subprocess.run(["adb", "exec-out", "screencap", "-p"], stdout=f, check=True)
            
            print(f"Successfully captured and saved {filename}")
            captured.append(filename)
            
        except subprocess.CalledProcessError as e:
            print(f"Failed to start or capture {intent}: {e}")
            # Fallback to general settings screenshot
            try:
                print(f"Attempting fallback to android.settings.SETTINGS for {filename}...")
                subprocess.run(["adb", "shell", "am", "start", "-a", "android.settings.SETTINGS"], check=True)
                time.sleep(3.0)
                out_path = os.path.join(IMAGES_DIR, filename)
                with open(out_path, "wb") as f:
                    subprocess.run(["adb", "exec-out", "screencap", "-p"], stdout=f, check=True)
                print(f"Successfully captured fallback settings screenshot for {filename}")
                captured.append(filename)
            except Exception as fe:
                print(f"Fallback failed: {fe}")
                
    return captured

def classify_post(file_path, content):
    content_lower = content.lower()
    filename = os.path.basename(file_path).lower()
    
    # Calculate scores for each category
    scores = {}
    for cat, words in KEYWORDS.items():
        score = 0
        # Check filename first as it has high weight
        for word in words:
            if word in filename:
                score += 15
        # Check content
        for word in words:
            count = content_lower.count(word)
            score += count * 2
        scores[cat] = score
        
    # Get highest scoring category
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] == 0:
        best_cat = "settings" # Default fallback
        
    # Adjustments/refinements based on specific filename patterns or contents
    if "developer" in filename or "sideload" in filename:
        best_cat = "developer"
    elif "bluetooth" in filename:
        best_cat = "bluetooth"
    elif "accessibility" in filename:
        best_cat = "accessibility"
    elif "reset" in filename or "update" in filename or "overheating" in filename or "clean" in filename:
        best_cat = "settings"
    elif "gps" in filename or "sensor" in filename:
        best_cat = "location"
    elif "calendar" in filename or "time" in filename or "date" in filename:
        best_cat = "time"
    elif "battery" in filename:
        best_cat = "battery"
    elif "sound" in filename or "volume" in filename:
        best_cat = "sound"
    elif "display" in filename or "brightness" in filename:
        best_cat = "display"
    elif "watch-face" in filename or "customization" in filename or "tiles" in filename:
        best_cat = "home"
    
    return best_cat

def process_posts():
    print("\n=== PROCESSING HTML BLOG POSTS ===")
    posts = glob.glob(os.path.join(POSTS_DIR, "*.html"))
    modified_files = []
    
    for p in sorted(posts):
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Clean article content extraction
        start_idx = content.find('<article class="article-content">')
        end_idx = content.find('</article>', start_idx)
        article_content = content[start_idx:end_idx] if start_idx != -1 and end_idx != -1 else content
        
        # Check if the file contains any image references to modify
        # Pattern matches: src="../something.png" (excluding logo.webp because it's ../../logo.webp or similar)
        # Note: must not contain '/' after '..' to avoid subdirectories or logo.webp
        img_pattern = r'src="\.\./[^/"]+\.png"'
        matches = re.findall(img_pattern, content)
        
        if not matches:
            # No matching image tags to modify
            continue
            
        cat = classify_post(p, article_content)
        target_img = CATEGORY_TO_IMAGE.get(cat, "settings_main.png")
        
        new_ref = f'src="../posts-images/{target_img}"'
        updated_content = re.sub(img_pattern, new_ref, content)
        
        if updated_content != content:
            with open(p, "w", encoding="utf-8") as f:
                f.write(updated_content)
            print(f"Updated {os.path.basename(p)} -> category: {cat}, mapped image: {target_img}")
            modified_files.append((os.path.basename(p), target_img))
            
    return modified_files

if __name__ == "__main__":
    captured = capture_all_screenshots()
    modified = process_posts()
    
    print("\n=== EXECUTION SUMMARY ===")
    print(f"Screenshots Captured: {len(captured)} / {len(SCREENSHOT_MAP)}")
    for c in captured:
        print(f"  - {c}")
    print(f"Files Modified: {len(modified)}")
    for f, img in modified:
        print(f"  - {f} (linked to posts-images/{img})")
