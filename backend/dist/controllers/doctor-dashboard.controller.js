"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientDetail = exports.getDoctorReviews = exports.getDoctorStatistics = exports.updateBulkAppointmentStatus = exports.getDashboardCharts = exports.createPrescription = exports.createMedicalRecord = exports.getPatientMedicalRecords = exports.getDoctorPatients = exports.updateAppointmentStatus = exports.getDoctorAppointments = exports.deleteDoctorSchedule = exports.updateDoctorSchedule = exports.createDoctorSchedule = exports.getDoctorSchedules = exports.updateDoctorProfile = exports.getAvailableSpecialtiesAndClinics = exports.getDoctorProfile = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const emailService_1 = require("../utils/emailService");
const prisma = new client_1.PrismaClient();
// Utility to get the logged-in doctor
const getDoctor = async (userId) => {
    return prisma.doctor.findFirst({
        where: { userAccount: { id: userId } }
    });
};
const getDashboardStats = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalAppointmentsToday = await prisma.appointment.count({
            where: {
                doctorId: doctor.id,
                appointmentDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            }
        });
        const pendingAppointments = await prisma.appointment.count({
            where: { doctorId: doctor.id, status: client_1.AppointmentStatus.PENDING }
        });
        const completedAppointments = await prisma.appointment.count({
            where: { doctorId: doctor.id, status: client_1.AppointmentStatus.COMPLETED }
        });
        const cancelledAppointments = await prisma.appointment.count({
            where: { doctorId: doctor.id, status: client_1.AppointmentStatus.CANCELLED }
        });
        // New: completed appointments this month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        const completedAppointmentsThisMonth = await prisma.appointment.count({
            where: {
                doctorId: doctor.id,
                status: client_1.AppointmentStatus.COMPLETED,
                appointmentDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalPatients = await prisma.appointment.groupBy({
            by: ['userId'],
            where: { doctorId: doctor.id }
        });
        // Average Rating
        const reviews = await prisma.review.aggregate({
            _avg: { rating: true },
            where: { doctorId: doctor.id }
        });
        const averageRating = reviews._avg.rating ? Number(reviews._avg.rating.toFixed(1)) : 0;
        // Monthly Revenue (sum of Payments in current month where status = PAID)
        const payments = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                status: 'PAID',
                payDate: { gte: startOfMonth, lte: endOfMonth },
                appointment: {
                    doctorId: doctor.id
                }
            }
        });
        const monthlyRevenue = payments._sum.amount || 0;
        res.json({
            totalAppointmentsToday,
            pendingAppointments,
            completedAppointmentsThisMonth,
            completedAppointments,
            cancelledAppointments,
            totalPatients: totalPatients.length,
            averageRating,
            monthlyRevenue
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDashboardStats = getDashboardStats;
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findFirst({
            where: { userAccount: { id: req.user.userId } },
            include: { specialty: true, clinic: true }
        });
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        res.json(doctor);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorProfile = getDoctorProfile;
const getAvailableSpecialtiesAndClinics = async (req, res) => {
    try {
        const specialties = await prisma.specialty.findMany({ select: { id: true, name: true } });
        const clinics = await prisma.clinic.findMany({ select: { id: true, name: true, address: true } });
        res.json({ specialties, clinics });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getAvailableSpecialtiesAndClinics = getAvailableSpecialtiesAndClinics;
const updateDoctorProfile = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { name, experience, avatar, specialtyId, clinicId, price, phone, description } = req.body;
        const updatedDoctor = await prisma.doctor.update({
            where: { id: doctor.id },
            data: {
                name,
                experience: experience ? parseInt(experience) : undefined,
                avatar,
                specialtyId,
                clinicId,
                price: price ? parseInt(price) : undefined,
                phone,
                description
            },
            include: { specialty: true, clinic: true }
        });
        res.json({ message: "Profile updated successfully", doctor: updatedDoctor });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateDoctorProfile = updateDoctorProfile;
// --- SCHEDULES ---
const getDoctorSchedules = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const schedules = await prisma.doctorSchedule.findMany({
            where: { doctorId: doctor.id },
            orderBy: { dayOfWeek: 'asc' }
        });
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorSchedules = getDoctorSchedules;
const timeToMinutes = (t) => {
    const parts = t.split(":");
    const hh = parseInt(parts[0] ?? "0", 10);
    const mm = parseInt(parts[1] ?? "0", 10);
    return hh * 60 + mm;
};
const createDoctorSchedule = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
        if (dayOfWeek === undefined || !startTime || !endTime) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ các trường Thứ, Giờ bắt đầu, Giờ kết thúc." });
        }
        const dow = parseInt(dayOfWeek);
        if (isNaN(dow) || dow < 0 || dow > 6) {
            return res.status(400).json({ message: "Thứ trong tuần không hợp lệ." });
        }
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({ message: "Định dạng thời gian không hợp lệ. Vui lòng dùng định dạng HH:MM." });
        }
        const startMin = timeToMinutes(startTime);
        const endMin = timeToMinutes(endTime);
        if (startMin >= endMin) {
            return res.status(400).json({ message: "Giờ bắt đầu phải trước giờ kết thúc." });
        }
        // Check overlap
        const existingSchedules = await prisma.doctorSchedule.findMany({
            where: {
                doctorId: doctor.id,
                dayOfWeek: dow
            }
        });
        const hasOverlap = existingSchedules.some(sch => {
            const schStart = timeToMinutes(sch.startTime);
            const schEnd = timeToMinutes(sch.endTime);
            return startMin < schEnd && endMin > schStart;
        });
        if (hasOverlap) {
            return res.status(400).json({ message: "Khung giờ này bị trùng lặp với lịch trực đã có vào ngày này." });
        }
        const schedule = await prisma.doctorSchedule.create({
            data: {
                doctorId: doctor.id,
                dayOfWeek: dow,
                startTime,
                endTime,
                isAvailable: isAvailable ?? true
            }
        });
        res.json({ message: "Schedule created", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.createDoctorSchedule = createDoctorSchedule;
const updateDoctorSchedule = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const id = req.params.id;
        const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
        const currentSchedule = await prisma.doctorSchedule.findFirst({
            where: { id, doctorId: doctor.id }
        });
        if (!currentSchedule) {
            return res.status(404).json({ message: "Không tìm thấy khung giờ trực này." });
        }
        const finalDayOfWeek = dayOfWeek !== undefined ? parseInt(dayOfWeek) : currentSchedule.dayOfWeek;
        const finalStartTime = startTime !== undefined ? startTime : currentSchedule.startTime;
        const finalEndTime = endTime !== undefined ? endTime : currentSchedule.endTime;
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(finalStartTime) || !timeRegex.test(finalEndTime)) {
            return res.status(400).json({ message: "Định dạng thời gian không hợp lệ. Vui lòng dùng định dạng HH:MM." });
        }
        const startMin = timeToMinutes(finalStartTime);
        const endMin = timeToMinutes(finalEndTime);
        if (startMin >= endMin) {
            return res.status(400).json({ message: "Giờ bắt đầu phải trước giờ kết thúc." });
        }
        // Check overlap (excluding the schedule itself)
        const existingSchedules = await prisma.doctorSchedule.findMany({
            where: {
                doctorId: doctor.id,
                dayOfWeek: finalDayOfWeek,
                id: { not: id }
            }
        });
        const hasOverlap = existingSchedules.some(sch => {
            const schStart = timeToMinutes(sch.startTime);
            const schEnd = timeToMinutes(sch.endTime);
            return startMin < schEnd && endMin > schStart;
        });
        if (hasOverlap) {
            return res.status(400).json({ message: "Khung giờ này bị trùng lặp với lịch trực đã có vào ngày này." });
        }
        const schedule = await prisma.doctorSchedule.update({
            where: { id, doctorId: doctor.id },
            data: {
                dayOfWeek: finalDayOfWeek,
                startTime: finalStartTime,
                endTime: finalEndTime,
                isAvailable
            }
        });
        res.json({ message: "Schedule updated", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateDoctorSchedule = updateDoctorSchedule;
const deleteDoctorSchedule = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const id = req.params.id;
        await prisma.doctorSchedule.delete({
            where: { id, doctorId: doctor.id }
        });
        res.json({ message: "Schedule deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.deleteDoctorSchedule = deleteDoctorSchedule;
// --- APPOINTMENTS ---
const getDoctorAppointments = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            include: {
                user: { select: { id: true, fullName: true, email: true, gender: true, dateOfBirth: true, avatar: true } },
                patientProfile: true,
                payment: true,
                medicalRecord: { select: { id: true, status: true } }
            },
            orderBy: { appointmentDate: 'desc' }
        });
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorAppointments = getDoctorAppointments;
const updateAppointmentStatus = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const id = req.params.id;
        const { status, notes, cancellationReason } = req.body;
        const appointmentObj = await prisma.appointment.findUnique({
            where: { id, doctorId: doctor.id }
        });
        if (!appointmentObj) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }
        if (status === "COMPLETED") {
            const appointmentTime = new Date(appointmentObj.appointmentDate);
            const now = new Date();
            if (now < appointmentTime) {
                return res.status(400).json({
                    message: "Không thể hoàn thành lịch hẹn trước thời gian khám dự kiến."
                });
            }
        }
        const appointment = await prisma.appointment.update({
            where: { id, doctorId: doctor.id },
            data: { status, notes, cancellationReason },
            include: {
                user: true,
                doctor: {
                    include: {
                        specialty: true,
                        clinic: true
                    }
                }
            }
        });
        if (appointment.user.email) {
            (0, emailService_1.sendBookingStatusUpdateEmail)(appointment.user.email, {
                patientName: appointment.user.fullName || appointment.user.email,
                doctorName: appointment.doctor?.name || "Bác sĩ",
                specialtyName: appointment.doctor?.specialty?.name || "",
                clinicName: appointment.doctor?.clinic?.name || appointment.doctor?.hospital || "Phòng khám",
                appointmentDate: appointment.appointmentDate,
                status: appointment.status,
                cancellationReason: appointment.cancellationReason,
                notes: appointment.notes
            }).catch((err) => console.error("Error sending status update email:", err));
        }
        res.json({ message: "Appointment status updated", appointment });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
// --- PATIENTS & MEDICAL RECORDS ---
const getDoctorPatients = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        // Get distinct patients for this doctor
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            include: { user: { select: { id: true, fullName: true, email: true, gender: true, dateOfBirth: true, avatar: true } } }
        });
        const uniquePatientsMap = new Map();
        for (const appt of appointments) {
            if (!uniquePatientsMap.has(appt.userId)) {
                uniquePatientsMap.set(appt.userId, appt.user);
            }
        }
        res.json(Array.from(uniquePatientsMap.values()));
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorPatients = getDoctorPatients;
const getPatientMedicalRecords = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const userId = req.params.userId;
        const records = await prisma.medicalRecord.findMany({
            where: { doctorId: doctor.id, userId },
            include: { appointment: true, prescriptions: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getPatientMedicalRecords = getPatientMedicalRecords;
const createMedicalRecord = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { appointmentId, userId, diagnosis, notes } = req.body;
        const record = await prisma.medicalRecord.create({
            data: {
                appointmentId,
                doctorId: doctor.id,
                userId,
                diagnosis,
                notes
            }
        });
        res.json({ message: "Medical record created", record });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.createMedicalRecord = createMedicalRecord;
const createPrescription = async (req, res) => {
    try {
        const { medicalRecordId, medicineId, dosage, frequency, durationDays, quantity } = req.body;
        const prescription = await prisma.prescription.create({
            data: {
                medicalRecordId,
                medicineId,
                dosage,
                frequency,
                durationDays: durationDays || 7,
                quantity: quantity || 14
            }
        });
        res.json({ message: "Prescription added", prescription });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.createPrescription = createPrescription;
// --- CHARTS & BULK ACTIONS ---
const getDashboardCharts = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 1. Bar Chart (Last 7 days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const last7DaysAppointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id,
                appointmentDate: { gte: sevenDaysAgo, lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            },
            select: { appointmentDate: true, status: true }
        });
        const barChartMap = new Map();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
            barChartMap.set(dateStr, { name: dateStr, completed: 0, confirmed: 0, cancelled: 0 });
        }
        last7DaysAppointments.forEach(app => {
            const d = new Date(app.appointmentDate);
            const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
            if (barChartMap.has(dateStr)) {
                const data = barChartMap.get(dateStr);
                if (app.status === 'COMPLETED')
                    data.completed++;
                else if (app.status === 'CONFIRMED')
                    data.confirmed++;
                else if (app.status === 'CANCELLED')
                    data.cancelled++;
            }
        });
        const barChart = Array.from(barChartMap.values());
        // 2. Line Chart (Patient Trend Last 3 Months)
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        const last3MonthsAppointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id,
                appointmentDate: { gte: threeMonthsAgo }
            },
            select: { appointmentDate: true, userId: true }
        });
        const lineChartMap = new Map(); // month-year -> set of userIds
        for (let i = 2; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
            lineChartMap.set(monthStr, new Set());
        }
        last3MonthsAppointments.forEach(app => {
            const d = new Date(app.appointmentDate);
            const monthStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
            if (lineChartMap.has(monthStr)) {
                lineChartMap.get(monthStr).add(app.userId);
            }
        });
        const lineChart = Array.from(lineChartMap.entries()).map(([name, set]) => ({ name, patients: set.size }));
        // 3. Donut Chart (Distribution by ICD-10 or Speciality)
        // We'll use medical records ICD-10 prefixes (first character usually indicates chapter)
        const medicalRecords = await prisma.medicalRecord.findMany({
            where: { doctorId: doctor.id },
            select: { icd10Code: true }
        });
        const donutMap = new Map();
        medicalRecords.forEach(record => {
            let code = record.icd10Code ? record.icd10Code.trim().substring(0, 3) : 'Khác';
            if (!code)
                code = 'Khác';
            donutMap.set(code, (donutMap.get(code) || 0) + 1);
        });
        // Sort and get top 4 + others
        let sortedDonut = Array.from(donutMap.entries()).sort((a, b) => b[1] - a[1]);
        if (sortedDonut.length > 5) {
            const othersCount = sortedDonut.slice(4).reduce((acc, curr) => acc + curr[1], 0);
            sortedDonut = sortedDonut.slice(0, 4);
            sortedDonut.push(['Khác', othersCount]);
        }
        const donutChart = sortedDonut.map(([name, value]) => ({ name, value }));
        // 4. Upcoming Appointments Today
        const upcomingAppointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id,
                appointmentDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
                status: 'CONFIRMED'
            },
            include: { user: { select: { fullName: true, avatar: true } }, patientProfile: { select: { fullName: true } } },
            orderBy: { appointmentDate: 'asc' }
        });
        // 5. Latest Reviews
        const latestReviews = await prisma.review.findMany({
            where: { doctorId: doctor.id },
            include: { user: { select: { fullName: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        res.json({
            barChart,
            lineChart,
            donutChart,
            upcomingAppointments,
            latestReviews
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDashboardCharts = getDashboardCharts;
const updateBulkAppointmentStatus = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const { ids, status } = req.body;
        if (!Array.isArray(ids) || !status) {
            return res.status(400).json({ message: "Invalid request payload" });
        }
        await prisma.appointment.updateMany({
            where: {
                id: { in: ids },
                doctorId: doctor.id,
                status: 'PENDING' // Only allow bulk update for PENDING appointments
            },
            data: { status }
        });
        res.json({ message: `Successfully updated ${ids.length} appointments to ${status}` });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateBulkAppointmentStatus = updateBulkAppointmentStatus;
// --- STATISTICS & REVIEWS ---
const getDoctorStatistics = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const today = new Date();
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        // All appointments
        const allAppointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            select: { id: true, status: true, userId: true, appointmentDate: true }
        });
        // 1. Total Patients & Return Rate
        const patientMap = new Map();
        allAppointments.forEach(app => {
            patientMap.set(app.userId, (patientMap.get(app.userId) || 0) + 1);
        });
        const totalPatients = patientMap.size;
        let returnPatients = 0;
        patientMap.forEach(count => { if (count > 1)
            returnPatients++; });
        const returnPatientRate = totalPatients > 0 ? (returnPatients / totalPatients) * 100 : 0;
        // 2. Completion Rate
        const completedAppts = allAppointments.filter(app => app.status === 'COMPLETED').length;
        const resolvedAppts = allAppointments.filter(app => app.status === 'COMPLETED' || app.status === 'CANCELLED').length;
        const completionRate = resolvedAppts > 0 ? (completedAppts / resolvedAppts) * 100 : 0;
        // 3. Reviews & Rating
        const reviews = await prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: { doctorId: doctor.id }
        });
        const averageRating = reviews._avg.rating ? Number(reviews._avg.rating.toFixed(1)) : 0;
        const totalReviews = reviews._count.id;
        // 4. Revenue (All time + this month)
        const allPayments = await prisma.payment.findMany({
            where: { appointment: { doctorId: doctor.id }, status: 'PAID' },
            select: { amount: true, payDate: true }
        });
        const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
        const monthlyRevenue = allPayments
            .filter(p => p.payDate && p.payDate >= thisMonthStart)
            .reduce((sum, p) => sum + p.amount, 0);
        // 5. Line chart revenue 12 months & Bar chart patients per month (12 months)
        const revenue12Months = [];
        const patients12Months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const rev = allPayments
                .filter(p => p.payDate && p.payDate >= monthStart && p.payDate <= monthEnd)
                .reduce((sum, p) => sum + p.amount, 0);
            const pats = new Set(allAppointments
                .filter(a => a.appointmentDate >= monthStart && a.appointmentDate <= monthEnd)
                .map(a => a.userId)).size;
            revenue12Months.push({ name: monthStr, revenue: rev });
            patients12Months.push({ name: monthStr, patients: pats });
        }
        // 6. Pie chart age distribution
        const patientsRecords = await prisma.patientProfile.findMany({
            where: { appointments: { some: { doctorId: doctor.id } } },
            select: { dateOfBirth: true }
        });
        const usersRecords = await prisma.user.findMany({
            where: { appointments: { some: { doctorId: doctor.id } } },
            select: { dateOfBirth: true }
        });
        const ageGroups = { '0-18': 0, '19-40': 0, '41-60': 0, '60+': 0 };
        const currentYear = today.getFullYear();
        const calculateAgeGroup = (dob) => {
            if (!dob)
                return;
            const age = currentYear - dob.getFullYear();
            if (age <= 18)
                ageGroups['0-18']++;
            else if (age <= 40)
                ageGroups['19-40']++;
            else if (age <= 60)
                ageGroups['41-60']++;
            else
                ageGroups['60+']++;
        };
        patientsRecords.forEach(p => calculateAgeGroup(p.dateOfBirth));
        // If patient profiles are scarce, we could fallback to user records, but for simplicity let's combine if they are unique
        // We will just map the results to chart format
        const ageChart = [
            { name: '0-18 tuổi', value: ageGroups['0-18'] },
            { name: '19-40 tuổi', value: ageGroups['19-40'] },
            { name: '41-60 tuổi', value: ageGroups['41-60'] },
            { name: 'Trên 60 tuổi', value: ageGroups['60+'] },
        ].filter(g => g.value > 0);
        // 7. Top 5 ICD-10
        const medicalRecords = await prisma.medicalRecord.findMany({
            where: { doctorId: doctor.id },
            select: { icd10Code: true }
        });
        const icdMap = new Map();
        medicalRecords.forEach(r => {
            const code = r.icd10Code?.trim();
            if (code)
                icdMap.set(code, (icdMap.get(code) || 0) + 1);
        });
        const topIcdChart = Array.from(icdMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        res.json({
            kpi: {
                totalPatients,
                completionRate: Math.round(completionRate),
                averageRating,
                totalReviews,
                totalRevenue,
                monthlyRevenue,
                returnPatientRate: Math.round(returnPatientRate)
            },
            charts: {
                revenue12Months,
                patients12Months,
                ageChart,
                topIcdChart
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorStatistics = getDoctorStatistics;
const getDoctorReviews = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
        const skip = (page - 1) * limit;
        const whereClause = { doctorId: doctor.id };
        if (rating) {
            whereClause.rating = rating;
        }
        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: whereClause,
                include: { user: { select: { fullName: true, avatar: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.review.count({ where: whereClause })
        ]);
        res.json({
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getDoctorReviews = getDoctorReviews;
const getPatientDetail = async (req, res) => {
    try {
        const doctor = await getDoctor(req.user.userId);
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });
        const userId = req.params.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, fullName: true, email: true, gender: true,
                dateOfBirth: true, avatar: true, bloodType: true,
                allergies: true, chronicDiseases: true, personalHistory: true
            }
        });
        if (!user)
            return res.status(404).json({ message: "Patient not found" });
        const patientProfile = await prisma.patientProfile.findFirst({
            where: { userId, isPrimary: true }
        });
        const pastAppointments = await prisma.appointment.findMany({
            where: { userId, doctorId: doctor.id, status: 'COMPLETED' },
            include: {
                patientProfile: true,
                medicalRecord: { select: { id: true, status: true } }
            },
            orderBy: { appointmentDate: 'desc' }
        });
        res.json({
            user: {
                ...user,
                phone: patientProfile?.phoneNumber || null,
                cccd: patientProfile?.cccd || null,
            },
            pastAppointments
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getPatientDetail = getPatientDetail;
