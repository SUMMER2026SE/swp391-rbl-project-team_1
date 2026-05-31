import prisma from "../prisma/client";

export async function getNearbyClinics(lat: number, lng: number, radiusKm: number = 10) {
    const clinics = await prisma.clinic.findMany({
        include: {
            doctors: {
                where: { status: "APPROVED", isLocked: false },
                include: { specialty: true }
            }
        }
    });

    const R = 6371; // Earth's radius in km
    const clinicsWithDistance = clinics
        .map((clinic) => {
            if (clinic.latitude === null || clinic.latitude === undefined || 
                clinic.longitude === null || clinic.longitude === undefined) {
                return { ...clinic, distance: null };
            }
            const dLat = ((clinic.latitude - lat) * Math.PI) / 180;
            const dLng = ((clinic.longitude - lng) * Math.PI) / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lat * Math.PI) / 180) *
                    Math.cos((clinic.latitude * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // in km
            return { ...clinic, distance: parseFloat(distance.toFixed(2)) };
        })
        .filter((clinic) => clinic.distance !== null && clinic.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return clinicsWithDistance;
}

export async function getClinicById(id: string) {
    return prisma.clinic.findUnique({
        where: { id },
        include: {
            doctors: {
                where: { status: "APPROVED", isLocked: false },
                include: { specialty: true }
            }
        }
    });
}

export async function getAllPublicClinics() {
    return prisma.clinic.findMany({
        include: {
            doctors: {
                where: { status: "APPROVED", isLocked: false },
                include: { specialty: true }
            }
        },
        orderBy: { name: "asc" },
    });
}

