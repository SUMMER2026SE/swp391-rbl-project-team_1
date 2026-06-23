import json
import re
import unicodedata
import os

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def sanitize_filename(name):
    name = remove_accents(name).lower()
    name = re.sub(r'[^a-z0-input_str]', '', name)
    return name + ".jpg"

with open('bacsi.txt', 'r', encoding='utf-8') as f:
    lines = [line.strip() for line in f if line.strip()]

specialties = []
current_specialty = None
doctors = []
current_doctor = None

def get_years_experience(text):
    match = re.search(r'từ năm (\d{4})', text.lower())
    if match:
        year = int(match.group(1))
        return 2026 - year
    return 5 # default 5 years

for line in lines:
    if line.lower().startswith('chuyên khoa ') or line.lower().startswith('chuyên khoa'):
        current_specialty = line.strip()
        if current_specialty not in specialties:
            specialties.append(current_specialty)
        current_doctor = None
    elif re.match(r'^(Ts\.Bs\.|ThS\.Bs\.|ThS\. BSNT|THS\.BS|Bs\.CKII|Bs\.CKI|BS\.CKI|BS\.CKII|BS|Bs|TS\.BS|THS\.BSNT|Ths\.BSNT\.|Bs\.)', line, re.IGNORECASE) or line.startswith('1)'):
        # A new doctor
        name = re.sub(r'^(1\)\s*|Ts\.Bs\.\s*|ThS\.Bs\.\s*|ThS\.\s*BSNT\s*|THS\.BS\s*|Bs\.CKII\s*|Bs\.CKI\s*|BS\.CKI\s*|BS\.CKII\s*|BS\s*|Bs\s*|TS\.BS\s*|THS\.BSNT\s*|Ths\.BSNT\.\s*)', '', line, flags=re.IGNORECASE).strip()
        name = name.strip('-').strip()
        
        # some names might have title embedded, let's just clean it up a bit
        name = re.sub(r'^(BS\.CKI|BS\.CKII|ThS\.BS|THS\.BSNT)\s+', '', name, flags=re.IGNORECASE)
        
        current_doctor = {
            "name": name,
            "specialty": current_specialty,
            "experience": 5,
            "hospital": "Bệnh viện Hoàn Mỹ Đà Nẵng",
            "avatar": "",
            "description": ""
        }
        doctors.append(current_doctor)
    elif current_doctor:
        if 'từ năm ' in line.lower():
            current_doctor['experience'] = get_years_experience(line)
        current_doctor['description'] += line + "\n"

# Map to images
image_dir = r"d:\Personal\Semester 5\SWP391\BookingDoctor\AnhBS (1)"
images = os.listdir(image_dir) if os.path.exists(image_dir) else []
images_lower = {img.lower(): img for img in images}

for d in doctors:
    # try to match name
    clean_name = remove_accents(d['name']).lower()
    clean_name = re.sub(r'[^a-z]', '', clean_name)
    img_name = clean_name + ".jpg"
    
    if img_name in images_lower:
         d['avatar'] = "/uploads/doctors/" + img_name
    else:
         # fallback if any match
         found = False
         for img in images_lower:
             if clean_name in img:
                 d['avatar'] = "/uploads/doctors/" + img
                 found = True
                 break
         if not found:
             d['avatar'] = "/uploads/doctors/default.jpg"
             
with open('doctors.json', 'w', encoding='utf-8') as f:
    json.dump(doctors, f, ensure_ascii=False, indent=2)
print(f"Parsed {len(doctors)} doctors.")
