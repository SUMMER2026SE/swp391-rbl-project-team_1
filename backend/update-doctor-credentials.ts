import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '123456';
const BCRYPT_ROUNDS = 12;

function normalizeName(name: string): string {
    let cleaned = name.trim().toLowerCase();
    const prefixRegex = /^(th?s\.?|ths\.?|thạc sỹ|thạc sĩ|ts\.?|bs(\s*ck[ii\d]*)?\.?|bsck[ii\d]*\.?|bác sĩ|bác sỹ)\s*/i;
    while (prefixRegex.test(cleaned)) {
        cleaned = cleaned.replace(prefixRegex, '');
    }
    cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    cleaned = cleaned.replace(/đ/g, 'd').replace(/Đ/g, 'd');
    cleaned = cleaned.replace(/[^a-z0-9]/g, '');
    return cleaned;
}

function escapePostgresLiteral(value: string): string {
    return value.replace(/'/g, "''");
}

function generateEmail(name: string, existingEmails: Set<string>): string {
    const username = normalizeName(name);
    let email = `${username}@gmail.com`;
    let suffix = 1;

    while (existingEmails.has(email)) {
        email = `${username}${suffix}@gmail.com`;
        suffix += 1;
    }

    existingEmails.add(email);
    return email;
}

async function main() {
    console.log('🔄 Updating doctor user emails and passwords...');

    const doctors = await prisma.$queryRawUnsafe<
        Array<{ id: string; name: string; user_id: string }>
    >(`
        SELECT d.id, d.name, u.id AS user_id
        FROM "Doctor" d
        JOIN "User" u ON u."doctorId" = d.id
        WHERE u.role = 'DOCTOR';
    `);

    if (!doctors.length) {
        console.log('⚠️  Không có bác sĩ nào trong database.');
        return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
    const existingEmails = new Set<string>();

    const allUsers = await prisma.$queryRawUnsafe<Array<{ email: string }>>(
        `SELECT email FROM "User";`
    );
    allUsers.forEach((user) => existingEmails.add(user.email));

    for (const doctor of doctors) {
        const email = generateEmail(doctor.name, existingEmails);
        const escapedEmail = escapePostgresLiteral(email);

        await prisma.$executeRawUnsafe(
            `UPDATE "User" SET email = '${escapedEmail}', password = '${hashedPassword}' WHERE id = '${doctor.user_id}';`
        );

        console.log(`✅ Updated doctor ${doctor.name}: email=${email}, password=${DEFAULT_PASSWORD}`);
    }

    console.log('🎉 Hoàn tất cập nhật email và mật khẩu cho tất cả bác sĩ.');
}

main()
    .catch((error) => {
        console.error('❌ Lỗi khi cập nhật doctor credentials:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
