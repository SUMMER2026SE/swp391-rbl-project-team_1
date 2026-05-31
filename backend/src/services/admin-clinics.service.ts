import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";

type ClinicWithCount = Prisma.ClinicGetPayload<{
    include: { _count: { select: { doctors: true } } };
}>;

interface CreateClinicInput {
    name: string;
    address: string;
    image?: string;
}

interface UpdateClinicInput {
    name?: string;
    address?: string;
    image?: string;
}

/**
 * Returns all clinics with doctor count.
 */
export async function getAllClinics(): Promise<ClinicWithCount[]> {
    return prisma.clinic.findMany({
        include: {
            _count: { select: { doctors: true } },
        },
        orderBy: { name: "asc" },
    });
}

/**
 * Creates a new clinic.
 */
export async function createClinic(
    input: CreateClinicInput
): Promise<ClinicWithCount> {
    return prisma.clinic.create({
        data: {
            name: input.name,
            address: input.address,
            image: input.image,
        },
        include: {
            _count: { select: { doctors: true } },
        },
    });
}

/**
 * Updates an existing clinic.
 */
export async function updateClinic(
    id: string,
    input: UpdateClinicInput
): Promise<ClinicWithCount> {
    const clinic = await prisma.clinic.findUnique({ where: { id } });

    if (!clinic) {
        throw new ApiError("Clinic not found", 404);
    }

    return prisma.clinic.update({
        where: { id },
        data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.address !== undefined && { address: input.address }),
            ...(input.image !== undefined && { image: input.image }),
        },
        include: {
            _count: { select: { doctors: true } },
        },
    });
}

/**
 * Deletes a clinic. Automatically unlinks all doctors from the clinic.
 */
export async function deleteClinic(id: string): Promise<void> {
    const clinic = await prisma.clinic.findUnique({
        where: { id },
        include: { _count: { select: { doctors: true } } },
    });

    if (!clinic) {
        throw new ApiError("Clinic not found", 404);
    }

    // Automatically unlink all doctors from the clinic
    if (clinic._count.doctors > 0) {
        await prisma.doctor.updateMany({
            where: { clinicId: id },
            data: { clinicId: null },
        });
    }

    await prisma.clinic.delete({ where: { id } });
}

/**
 * Returns all doctors belonging to a specific clinic.
 */
export async function getClinicDoctors(clinicId: string) {
    return prisma.doctor.findMany({
        where: { clinicId },
        include: { specialty: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Returns all approved doctors who are currently not assigned to any clinic.
 */
export async function getUnassignedDoctors() {
    return prisma.doctor.findMany({
        where: {
            status: "APPROVED",
            clinicId: null,
        },
        include: { specialty: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Links a doctor to a clinic and synchronizes the legacy `hospital` text field.
 */
export async function addDoctorToClinic(clinicId: string, doctorId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
        throw new ApiError("Clinic not found", 404);
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    return prisma.doctor.update({
        where: { id: doctorId },
        data: {
            clinicId,
            hospital: clinic.name,
        },
        include: { specialty: true, clinic: true },
    });
}

/**
 * Unlinks a doctor from a clinic.
 */
export async function removeDoctorFromClinic(clinicId: string, doctorId: string) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        throw new ApiError("Doctor not found", 404);
    }

    if (doctor.clinicId !== clinicId) {
        throw new ApiError("Doctor is not associated with this clinic", 400);
    }

    return prisma.doctor.update({
        where: { id: doctorId },
        data: {
            clinicId: null,
            hospital: "Chưa liên kết",
        },
        include: { specialty: true },
    });
}
