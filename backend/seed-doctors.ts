import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function removeVietnameseTones(str: string) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    str = str.replace(/ + /g, " ");
    str = str.trim();
    // Remove punctuations
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    return str;
}

async function main() {
    console.log('Seeding doctors...');
    
    // Read JSON
    const jsonPath = path.join(__dirname, '..', 'doctors.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('doctors.json not found!');
        process.exit(1);
    }
    const doctorsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    for (const data of doctorsData) {
        // Find or create specialty
        const specialtyName = data.specialty.replace('Chuyên khoa ', '').trim();
        const specialtySlug = slugify(removeVietnameseTones(specialtyName));
        
        let specialty = await prisma.specialty.findUnique({
            where: { slug: specialtySlug }
        });
        
        if (!specialty) {
            specialty = await prisma.specialty.create({
                data: {
                    name: specialtyName,
                    slug: specialtySlug,
                    icon: '🩺'
                }
            });
            console.log(`Created specialty: ${specialtyName}`);
        }
        
        // Find or create clinic if needed
        let clinic = await prisma.clinic.findFirst({
            where: { name: 'Bệnh viện Hoàn Mỹ Đà Nẵng' }
        });
        
        if (!clinic) {
            clinic = await prisma.clinic.create({
                data: {
                    name: 'Bệnh viện Hoàn Mỹ Đà Nẵng',
                    address: '291 Nguyễn Văn Linh, Quận Thanh Khê, TP. Đà Nẵng',
                    image: '/uploads/hoan_my_da_nang.png',
                }
            });
        }
        
        // Check if doctor exists
        const existingDoc = await prisma.doctor.findFirst({
            where: {
                name: data.name,
                specialtyId: specialty.id
            }
        });
        
        if (!existingDoc) {
            await prisma.doctor.create({
                data: {
                    name: data.name,
                    experience: data.experience,
                    hospital: data.hospital,
                    avatar: data.avatar,
                    specialtyId: specialty.id,
                    description: data.description,
                    clinicId: clinic.id,
                    price: 150000,
                    status: "APPROVED"
                }
            });
            console.log(`Created doctor: ${data.name}`);
        } else {
            console.log(`Doctor already exists: ${data.name}`);
        }
    }

    console.log('✅ Doctors seeding completed!');
}

main()
    .catch((e) => {
        console.error('Lỗi khi seed dữ liệu:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
