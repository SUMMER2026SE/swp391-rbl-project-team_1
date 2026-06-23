import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    str = str.replace(/ + /g, " ");
    str = str.trim();
    return str;
}

function generateEmail(name: string) {
    let cleanName = name.replace(/^(ThS\.BS|BS\.CKII|BS\.CKI|PGS\.TS|GS\.TS|BS\.|ThS\.|TS\.|BS|ThS|TS|Dr\.)\s*/i, '');
    cleanName = removeVietnameseTones(cleanName);
    cleanName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}@gmail.com`;
}

async function main() {
    console.log('Creating doctor accounts...');
    
    const doctors = await prisma.doctor.findMany({
        include: {
            userAccount: true
        }
    });
    
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    let createdCount = 0;

    for (const doctor of doctors) {
        if (doctor.userAccount) {
            console.log(`Doctor ${doctor.name} already has an account: ${doctor.userAccount.email}`);
            continue;
        }

        let email = generateEmail(doctor.name);
        
        let isUnique = false;
        let counter = 1;
        let finalEmail = email;
        while (!isUnique) {
            const existingUser = await prisma.user.findUnique({ where: { email: finalEmail } });
            if (!existingUser) {
                isUnique = true;
            } else {
                finalEmail = email.replace('@gmail.com', `${counter}@gmail.com`);
                counter++;
            }
        }

        try {
            await prisma.user.create({
                data: {
                    email: finalEmail,
                    password: hashedPassword,
                    fullName: doctor.name,
                    role: 'DOCTOR',
                    doctorId: doctor.id,
                    avatar: doctor.avatar
                }
            });
            console.log(`Created account for ${doctor.name}: ${finalEmail}`);
            createdCount++;
        } catch (error) {
            console.error(`Failed to create account for ${doctor.name}:`, error);
        }
    }
    
    console.log(`✅ Completed creating ${createdCount} accounts.`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
