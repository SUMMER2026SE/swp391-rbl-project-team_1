const { PrismaClient } = require('@prisma/client');
const mammoth = require('mammoth');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await mammoth.extractRawText({ path: path.join(__dirname, '../../BacSi.docx') });
        const text = result.value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        let currentDoctor = null;
        let parsingMode = null; // 'certs' or 'exp' or null
        const doctorsData = [];

        // Common titles to strip for searching
        const titleRegex = /^(Ts\.Bs\.|ThS\.Bs\.|BS\.CKI|BS\.CKII|THs\.Bs|Bs\.CKI|ThS\. BSNT|Ths\.BSNT\.|ThS\.BSNT|BS\.CKI\.|Bs\.|BS\.|THS\.BSNT|TS\.BS|THS\.BS|TSS\.BSNT|TS\.BSNT)\s*/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if line looks like a doctor's name (starts with title or is very short and title-like)
            if (line.match(titleRegex) || line.startsWith('1) Ths.BSNT.')) {
                let docName = line.replace('1) ', ''); // remove list numbers
                
                // create new doctor entry
                currentDoctor = {
                    originalName: docName,
                    cleanName: docName.replace(titleRegex, '').trim(),
                    certificates: [],
                    experiences: []
                };
                doctorsData.push(currentDoctor);
                parsingMode = null;
                continue;
            }

            if (!currentDoctor) continue;

            const lowerLine = line.toLowerCase();
            
            if (lowerLine.includes('bằng cấp chuyên môn') || lowerLine === 'chứng chỉ') {
                parsingMode = 'certs';
                // If it's inline like "Bằng cấp chuyên môn:– Tốt nghiệp..."
                const parts = line.split(':');
                if (parts.length > 1 && parts[1].trim()) {
                    const certs = parts[1].split('–').map(c => c.trim()).filter(c => c);
                    currentDoctor.certificates.push(...certs);
                }
                continue;
            }

            if (lowerLine.includes('kinh nghiệm chuyên môn') || lowerLine === 'kinh nghiệm làm việc' || lowerLine === 'quá trình công tác:') {
                parsingMode = 'exp';
                const parts = line.split(':');
                if (parts.length > 1 && parts[1].trim() && !lowerLine.includes('quá trình công tác:')) {
                    const exps = parts[1].split('–').map(c => c.trim()).filter(c => c);
                    currentDoctor.experiences.push(...exps);
                }
                continue;
            }

            if (lowerLine === 'giới thiệu' || lowerLine.startsWith('số năm công tác') || lowerLine === 'kỹ năng') {
                parsingMode = null;
                continue;
            }

            if (parsingMode === 'certs') {
                // handle lines starting with dash
                const certs = line.split('–').map(c => c.trim()).filter(c => c);
                currentDoctor.certificates.push(...certs);
            } else if (parsingMode === 'exp') {
                const exps = line.split('–').map(c => c.trim()).filter(c => c);
                currentDoctor.experiences.push(...exps);
            }
        }

        console.log(`Parsed ${doctorsData.length} doctors from Word file.`);

        let updatedCount = 0;
        let notFoundCount = 0;

        // Now find them in DB and update
        for (const data of doctorsData) {
            // we will search by cleanName.
            let dbDoctor = await prisma.doctor.findFirst({
                where: { name: { contains: data.cleanName, mode: 'insensitive' } }
            });
            
            // if not found, try parts of the name
            if (!dbDoctor) {
                const nameParts = data.cleanName.split(' ').slice(-2).join(' '); // last 2 words (e.g., Trung Nghĩa)
                dbDoctor = await prisma.doctor.findFirst({
                    where: { name: { contains: nameParts, mode: 'insensitive' } }
                });
            }

            if (dbDoctor) {
                updatedCount++;
                console.log(`Found DB match for ${data.originalName} -> ${dbDoctor.name}`);
                
                // Clear existing certs first to avoid duplicates if run multiple times
                await prisma.doctorCertificate.deleteMany({
                    where: { doctorId: dbDoctor.id }
                });

                // Prepare cert records
                const certRecords = [];
                for (const cert of data.certificates) {
                    if (cert.length > 2) {
                        certRecords.push({ doctorId: dbDoctor.id, title: cert });
                    }
                }
                for (const exp of data.experiences) {
                    if (exp.length > 2) {
                        certRecords.push({ doctorId: dbDoctor.id, title: exp });
                    }
                }

                if (certRecords.length > 0) {
                    await prisma.doctorCertificate.createMany({
                        data: certRecords
                    });
                    console.log(`  Inserted ${certRecords.length} records.`);
                } else {
                    console.log(`  No records to insert.`);
                }

            } else {
                notFoundCount++;
                console.log(`Could NOT find DB match for ${data.originalName} (tried searching: ${data.cleanName})`);
            }
        }
        
        console.log(`Summary: Updated ${updatedCount} doctors. Not found ${notFoundCount} doctors.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
