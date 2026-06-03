"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/useBooking";
import { clinicService } from "@/services/clinic.service";
import { Clinic } from "@/types/appointment";
import { Building2, MapPin, Users, ChevronRight } from "lucide-react";

export default function ClinicsPage() {
  const router = useRouter();
  const { selectedClinic, setSelectedClinic } = useBooking();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        const data = await clinicService.listClinics();
        setClinics(data.clinics || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching clinics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  const handleSelectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    // Navigate to doctors page with clinic filter
    router.push(`/doctors?clinicId=${clinic.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || clinics.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">
              {error || "Không có bệnh viện nào khả dụng"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-teal-600" />
            Chọn Bệnh Viện
          </h1>
          <p className="text-gray-600">
            Chọn bệnh viện ở khu vực Đà Nẵng để xem danh sách bác sĩ có sẵn
          </p>
        </div>

        {/* Clinics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden border-2 ${
                selectedClinic?.id === clinic.id
                  ? "border-teal-500 ring-2 ring-teal-200"
                  : "border-transparent"
              }`}
              onClick={() => handleSelectClinic(clinic)}
            >
              {/* Image */}
              {clinic.image && (
                <div className="h-48 bg-gradient-to-br from-teal-100 to-blue-100 overflow-hidden">
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  {clinic.name}
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{clinic.address}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSelectClinic(clinic)}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Chọn bệnh viện này
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
