import os
import re
import glob

POSTS_DIR = "/home/notroot/Downloads/pngscreen/Selçuklu Seferi Oyunu (1)/blog/posts/"

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
    "battery": "settings_main.png"  # generic fallback as there's no battery setting intent mapped
}

# Simple rules / keyword lists
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
    
    return best_cat, scores

posts = glob.glob(os.path.join(POSTS_DIR, "*.html"))
print(f"Found {len(posts)} HTML post files.")

results = []
for p in sorted(posts):
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()
    start_idx = content.find('<article class="article-content">')
    end_idx = content.find('</article>', start_idx)
    article_content = content[start_idx:end_idx] if start_idx != -1 and end_idx != -1 else content
    cat, scores = classify_post(p, article_content)
    image = CATEGORY_TO_IMAGE.get(cat, "settings_main.png")
    
    # Find current image references
    # Format typically: <img src="../something.png"
    img_refs = re.findall(r'src="\.\./([^"]+\.png)"', content)
    
    results.append({
        "file": os.path.basename(p),
        "category": cat,
        "image": image,
        "refs": img_refs
    })

for r in results:
    print(f"{r['file']}:")
    print(f"  Category: {r['category']} -> {r['image']}")
    print(f"  Current Refs: {r['refs']}")
