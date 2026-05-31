import { DoctorStatus } from "@prisma/client";
import prisma from "../prisma/client";

export interface RecommendedDoctor {
    id: string;
    name: string;
    experience: number;
    hospital: string;
    avatar: string;
    specialty: {
        id: string;
        name: string;
        slug: string;
        icon: string | null;
    };
}

export interface ChatRecommendations {
    specialties: Array<{ id: string; name: string; slug: string; icon: string | null }>;
    doctors: RecommendedDoctor[];
}

const publicDoctorFilter = {
    status: DoctorStatus.APPROVED,
    isLocked: false,
};

/** Chuẩn hóa tiếng Việt để so khớp từ khóa */
function normalizeVietnamese(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

function containsAny(text: string, keywords: string[]): boolean {
    return keywords.some((k) => text.includes(k));
}

/**
 * Ánh xạ triệu chứng → slug chuyên khoa (ưu tiên slug có trong DB seed).
 * Bổ sung tên chuyên khoa để tìm fuzzy trên DB (bệnh viện Đà Nẵng có nhiều specialty hơn seed).
 */
function getSpecialtySlugHints(norm: string): string[] {
    const slugs: string[] = [];

    if (
        /\bho\b/.test(norm) ||
        containsAny(norm, ["sot", "hong", "mui", "cum", "cam", "kho tho", "viem hong", "phoi"])
    ) {
        slugs.push("noi-tong-quat", "ho-hap", "tai-mui-hong");
    }

    if (
        containsAny(norm, [
            "bung",
            "da day",
            "tieu chay",
            "non",
            "day hoi",
            "tieu hoa",
            "o hoi",
        ])
    ) {
        slugs.push("noi-tong-quat", "tieu-hoa", "tieu-hoa-gan-mat");
    }

    if (
        containsAny(norm, [
            "dau chan",
            "chan dau",
            "khop",
            "lung",
            "xuong",
            "vai",
            "co xuong",
            "dau goi",
            "dau tay",
            "te bi",
            "chinh hinh",
        ])
    ) {
        slugs.push("chinh-hinh", "phuc-hoi-chuc-nang");
    }

    if (
        containsAny(norm, [
            "dau dau",
            "nhuc dau",
            "chong mat",
            "hoa mat",
            "than kinh",
            "mat ngu",
            "kho ngu",
        ])
    ) {
        slugs.push("than-kinh", "noi-tong-quat");
    }

    if (
        containsAny(norm, ["tim", "huyet ap", "tuc nguc", "hoi hop", "nguc"])
    ) {
        slugs.push("tim-mach");
    }

    if (
        containsAny(norm, ["ngua", "mun", "di ung", "phat ban", "viem da", "da li"])
    ) {
        slugs.push("da-lieu");
    }

    if (containsAny(norm, ["tre em", "nhi", "be", "em be"])) {
        slugs.push("nhi-khoa");
    }

    if (slugs.length === 0) {
        slugs.push("noi-tong-quat");
    }

    return [...new Set(slugs)];
}

const SPECIALTY_NAME_KEYWORDS: Record<string, string[]> = {
    "tim mach": ["tim", "nguc", "huyet ap", "hoi hop"],
    "da lieu": ["da", "ngua", "mun", "di ung", "phat ban"],
    "nhi khoa": ["tre", "nhi", "em be"],
    "noi tong quat": ["met", "sot", "benh"],
    "than kinh": ["dau dau", "chong mat", "te", "liet"],
    "chinh hinh": ["xuong", "khop", "chan", "goi", "lung", "vai"],
    "tai mui hong": ["hong", "mui", "ho", "tai"],
    "tieu hoa": ["bung", "da day", "tieu"],
    "ho hap": ["ho", "kho tho", "phoi"],
};

function scoreSpecialtyByName(specialtyName: string, norm: string): number {
    const key = normalizeVietnamese(specialtyName);
    const keywords = SPECIALTY_NAME_KEYWORDS[key] || key.split(/\s+/).filter((w) => w.length > 2);
    let score = 0;
    for (const kw of keywords) {
        if (norm.includes(kw)) score += 1;
    }
    return score;
}

/**
 * Lấy chuyên khoa + bác sĩ thật trong DB phù hợp triệu chứng.
 */
export async function getChatRecommendations(
    userMessage: string,
    maxDoctors = 4
): Promise<ChatRecommendations> {
    const norm = normalizeVietnamese(userMessage);
    const slugHints = getSpecialtySlugHints(norm);

    const allSpecialties = await prisma.specialty.findMany({
        orderBy: { name: "asc" },
    });

    const scored = allSpecialties
        .map((s) => {
            let score = 0;
            if (slugHints.includes(s.slug)) score += 10;
            score += scoreSpecialtyByName(s.name, norm);
            return { specialty: s, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

    const pickedSpecialties =
        scored.length > 0
            ? scored.slice(0, 2).map((x) => x.specialty)
            : allSpecialties.filter((s) => slugHints.includes(s.slug)).slice(0, 1);

    const fallback =
        pickedSpecialties.length > 0
            ? pickedSpecialties
            : allSpecialties.slice(0, 1);

    const specialtyIds = fallback.map((s) => s.id);

    const doctors = await prisma.doctor.findMany({
        where: {
            ...publicDoctorFilter,
            specialtyId: { in: specialtyIds },
        },
        include: {
            specialty: {
                select: { id: true, name: true, slug: true, icon: true },
            },
        },
        orderBy: [{ experience: "desc" }, { name: "asc" }],
        take: maxDoctors,
    });

    return {
        specialties: fallback.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            icon: s.icon,
        })),
        doctors: doctors.map((d) => ({
            id: d.id,
            name: d.name,
            experience: d.experience,
            hospital: d.hospital,
            avatar: d.avatar,
            specialty: d.specialty,
        })),
    };
}

/** Context đưa vào Gemini để AI gợi ý đúng bác sĩ có trong DB (giống luồng proj2). */
export function buildDoctorContextForPrompt(
    recommendations: ChatRecommendations
): string {
    if (recommendations.doctors.length === 0) {
        return "";
    }

    const specialtyLine = recommendations.specialties
        .map((s) => `${s.name}`)
        .join(", ");

    const doctorLines = recommendations.doctors
        .map(
            (d) =>
                `- **${d.name}** | Chuyên khoa: ${d.specialty.name} | ${d.experience} năm KN | ${d.hospital}`
        )
        .join("\n");

    return `

DỮ LIỆU BÁC SĨ THẬT TRÊN MEDBOOKING (chỉ được gợi ý từ danh sách này, ghi đúng tên):
Chuyên khoa phù hợp: ${specialtyLine}
${doctorLines}`;
}

export function formatRecommendationsMarkdown(
    recommendations: ChatRecommendations
): string {
    if (recommendations.doctors.length === 0) {
        return "";
    }

    const specialtyLine = recommendations.specialties
        .map((s) => `${s.icon || "🩺"} **${s.name}**`)
        .join(" · ");

    const doctorLines = recommendations.doctors
        .map(
            (d) =>
                `- **${d.name}** — ${d.specialty.name} · ${d.experience} năm KN · ${d.hospital}`
        )
        .join("\n");

    return `

### 👨‍⚕️ Bác sĩ đề xuất trên MedBooking
**Chuyên khoa phù hợp:** ${specialtyLine}

${doctorLines}

*Bấm vào thẻ bác sĩ bên dưới để xem hồ sơ và đặt lịch khám.*`;
}

export function replyAlreadyHasDoctorRecommendations(
    reply: string,
    recommendations: ChatRecommendations
): boolean {
    if (reply.includes("Bác sĩ đề xuất trên MedBooking")) {
        return true;
    }
    return recommendations.doctors.some((d) => reply.includes(d.name));
}
