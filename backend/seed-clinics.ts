import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedClinics() {
  try {
    console.log("🌱 Seeding clinics in Da Nang...");

    // 1. Clear existing clinics
    await prisma.clinic.deleteMany({});
    console.log("🗑️ Cleared old clinics.");

    // 2. Define 5 sample clinics with actual Da Nang GPS coords
    const clinicsData = [
      {
        id: "clinic_danang_hospital",
        name: "Bệnh viện Đa khoa Đà Nẵng (Cơ sở 1)",
        address: "124 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng",
        latitude: 16.0722,
        longitude: 108.2198,
        image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: "clinic_hoan_my",
        name: "Bệnh viện Hoàn Mỹ Đà Nẵng",
        address: "291 Nguyễn Văn Linh, Thạc Gián, Thanh Khê, Đà Nẵng",
        latitude: 16.0611,
        longitude: 108.2098,
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: "clinic_family",
        name: "Phòng khám Đa khoa Gia đình (Family Clinic)",
        address: "73 Nguyễn Hữu Thọ, Hòa Thuận Nam, Hải Châu, Đà Nẵng",
        latitude: 16.0484,
        longitude: 108.2117,
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: "clinic_hoa_khanh",
        name: "Phòng khám Đa khoa Hòa Khánh",
        address: "245 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng",
        latitude: 16.0601,
        longitude: 108.1524,
        image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: "clinic_hai_chau",
        name: "Trung tâm Y tế Quận Hải Châu",
        address: "38 Cao Thắng, Thanh Bình, Hải Châu, Đà Nẵng",
        latitude: 16.0505,
        longitude: 108.2166,
        image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=400&auto=format&fit=crop"
      }
    ];

    for (const data of clinicsData) {
      await prisma.clinic.create({ data });
      console.log(`   ✅ Created Clinic: ${data.name}`);
    }

    // 3. Link doctors to these clinics
    console.log("🔗 Linking doctors to clinics...");
    const doctors = await prisma.doctor.findMany({});
    
    if (doctors.length === 0) {
      console.log("⚠️ No doctors found to link.");
      return;
    }

    // Distribute doctors across clinics
    for (let i = 0; i < doctors.length; i++) {
      const clinicIndex = i % clinicsData.length;
      const clinicId = clinicsData[clinicIndex].id;
      
      await prisma.doctor.update({
        where: { id: doctors[i].id },
        data: { clinicId }
      });
    }

    console.log(`🎉 Successfully linked ${doctors.length} doctors to clinics.`);
  } catch (error) {
    console.error("❌ Error seeding clinics:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedClinics();
