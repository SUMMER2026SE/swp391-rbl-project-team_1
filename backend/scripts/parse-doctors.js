const fs = require('fs');
const path = require('path');

const bacsiPath = path.resolve(__dirname, 'bacsi.txt');
const anhBSPath = path.resolve(__dirname, '../../frontend/public/AnhBS');
const outputPath = path.resolve(__dirname, '../prisma/parsed-doctors.json');

const text = fs.readFileSync(bacsiPath, 'utf8');
const imageFiles = fs.readdirSync(anhBSPath).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));

// Helper to remove accents
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function normalizeNameForFile(name) {
    return removeAccents(name).toLowerCase().replace(/[^a-z]/g, '');
}

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const doctors = [];
let currentSpecialty = '';
let currentDoctor = null;
let currentSection = '';

// Known titles
const titles = ['Ts.Bs.', 'ThS.Bs.', 'THS.BSNT', 'ThS.BSNT', 'ThS. BSNT', 'BS.CKII', 'BS.CKI', 'Bs.CKI', 'Bs.CKII', 'Bs. ', 'Bs ', 'BS ', 'Bác sĩ', 'TSS.BSNT', 'Ts.Bs', 'Ths.BSNT.', 'THs.Bs', 'THS.BS', 'ThS.BS', 'Ths.BS', 'Bs.Hoàng', 'THs.BSNT.'];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toLowerCase().startsWith('chuyên khoa ')) {
        currentSpecialty = line.replace(/chuyên khoa/i, '').trim();
        continue;
    }

    // Check if line is a doctor name
    let isDoctor = false;
    let name = line;
    for (const title of titles) {
        if (line.toLowerCase().startsWith(title.toLowerCase())) {
            isDoctor = true;
            name = line.substring(title.length).trim();
            // Remove leading dots or hyphens
            name = name.replace(/^[\.\-\s]+/, '');
            // Some might have numbers like "1) Ths.BSNT."
            break;
        }
    }
    // Also check for leading numbers "1)", "2)"
    if (/^\d+\)\s/.test(line)) {
        isDoctor = true;
        name = line.replace(/^\d+\)\s/, '');
        for (const title of titles) {
            if (name.toLowerCase().startsWith(title.toLowerCase())) {
                name = name.substring(title.length).trim();
                name = name.replace(/^[\.\-\s]+/, '');
                break;
            }
        }
    }

    // Fallback: If line is short and previous line was Chuyên khoa or Kinh nghiệm làm việc, maybe it's a name without title, but let's stick to titles.
    if (isDoctor) {
        if (currentDoctor) {
            doctors.push(currentDoctor);
        }
        
        // Clean name
        name = name.replace(/[:\-].*$/, '').trim();

        // Match image
        const normalized = normalizeNameForFile(name);
        let matchedImage = null;
        for (const img of imageFiles) {
            const imgName = img.split('.')[0];
            if (imgName === normalized || normalized.includes(imgName) || imgName.includes(normalized)) {
                matchedImage = img;
                break;
            }
        }

        // Guess experience from line later, default to 10
        currentDoctor = {
            name: name,
            title: line.replace(name, '').trim(),
            specialty: currentSpecialty,
            image: matchedImage,
            experience: 10,
            certificates: [],
            description: ''
        };
        currentSection = 'intro';
        continue;
    }

    if (currentDoctor) {
        const lower = line.toLowerCase();
        if (lower.includes('chứng chỉ') || lower.includes('bằng cấp chuyên môn:')) {
            currentSection = 'cert';
            continue;
        } else if (lower.includes('kinh nghiệm làm việc') || lower.includes('kinh nghiệm chuyên môn:')) {
            currentSection = 'exp';
            continue;
        }

        if (currentSection === 'intro') {
            currentDoctor.description += line + ' ';
            const expMatch = line.match(/(\d+)\s+năm/i);
            if (expMatch) {
                currentDoctor.experience = parseInt(expMatch[1]);
            }
        } else if (currentSection === 'cert') {
            if (line.length > 10 && !line.startsWith('Số năm công tác') && !line.startsWith('Kinh nghiệm và đào tạo')) {
                currentDoctor.certificates.push(line.replace(/^[–\-*]\s*/, ''));
            }
        } else if (currentSection === 'exp') {
            if (line.length > 10) {
                const expMatch = line.match(/từ năm (\d{4})/i);
                if (expMatch) {
                    const startYear = parseInt(expMatch[1]);
                    currentDoctor.experience = 2026 - startYear;
                }
            }
        }
    }
}

if (currentDoctor) {
    doctors.push(currentDoctor);
}

fs.writeFileSync(outputPath, JSON.stringify(doctors, null, 2));
console.log(`Parsed ${doctors.length} doctors. Saved to parsed-doctors.json`);
