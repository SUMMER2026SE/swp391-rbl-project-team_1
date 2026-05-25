"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doctorService } from "@/services/doctor.service";
import { Doctor } from "@/types/doctor";
import DoctorCard from "@/components/ui/DoctorCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Search, Filter, Stethoscope, RefreshCcw } from "lucide-react";
import Button from "@/components/common/Button";

function DoctorsListContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Fetch doctors on mount
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        setError(null);
        const data = await doctorService.listDoctors();
        setDoctors(data.doctors);

        // Extract unique specialties from API response
        const specs = data.doctors.map((doc) => doc.specialty);
        const uniqueSpecs = Array.from(new Set(specs));
        setSpecialties(uniqueSpecs);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách bác sĩ. Vui lòng kiểm tra kết nối với Backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  // Sync initialSearch query from URL if it changes
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Apply filters on search query or specialty change
  useEffect(() => {
    let result = [...doctors];

    // Search query filter (name or hospital)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.hospital.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q)
      );
    }

    // Specialty filter
    if (selectedSpecialty !== "ALL") {
      result = result.filter((doc) => doc.specialty === selectedSpecialty);
    }

    setFilteredDoctors(result);
  }, [searchQuery, selectedSpecialty, doctors]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty("ALL");
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search box */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 z-10" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ, bệnh viện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
            />
          </div>

          {/* Specialty Filter Dropdown */}
          <div className="md:col-span-4 relative">
            <Filter className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 z-10" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả chuyên khoa</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="md:col-span-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 rounded-xl text-slate-700 hover:text-slate-900"
            >
              <RefreshCcw className="h-4 w-4" />
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Results Display */}
      {loading ? (
        <div className="flex flex-col py-24 items-center justify-center">
          <LoadingSpinner className="h-10 w-10 text-teal-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải danh sách bác sĩ chuyên gia...</p>
        </div>
      ) : error ? (
        <Alert type="error" message={error} className="my-6" />
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-base font-bold text-slate-800">Không tìm thấy bác sĩ nào</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Không tìm thấy bác sĩ phù hợp với từ khóa &ldquo;{searchQuery}&rdquo; hoặc chuyên khoa được chọn. Thử thay đổi bộ lọc tìm kiếm.
          </p>
          <Button variant="teal" onClick={handleResetFilters} className="mt-5 rounded-xl text-xs font-semibold">
            Xem toàn bộ bác sĩ
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-600">
              Tìm thấy <span className="text-teal-600 font-bold">{filteredDoctors.length}</span> bác sĩ phù hợp
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow flex flex-col">
      {/* Header Info */}
      <div className="space-y-2.5 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đội Ngũ Bác Sĩ Chuyên Khoa</h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-3xl">
          Đội ngũ y bác sĩ hàng đầu tại Việt Nam có đầy đủ chứng chỉ chuyên môn và kinh nghiệm công tác dày dặn tại các bệnh viện trung ương lớn.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex py-24 items-center justify-center">
            <LoadingSpinner className="h-10 w-10 text-teal-600" />
          </div>
        }
      >
        <DoctorsListContent />
      </Suspense>
    </div>
  );
}
