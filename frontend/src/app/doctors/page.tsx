"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doctorService } from "@/services/doctor.service";
import { specialtyService } from "@/services/specialty.service";
import { Doctor, Specialty } from "@/types/doctor";
import DoctorCard from "@/components/ui/DoctorCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Search, Filter, Stethoscope, RefreshCcw } from "lucide-react";
import Button from "@/components/common/Button";
import BookingProgress from "@/components/ui/BookingProgress";
import Pagination from "@/components/common/Pagination";
import { removeVietnameseTones } from "@/utils/stringUtils";

function DoctorsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const urlSpecialty = searchParams.get("specialty") || "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const DOCTORS_PER_PAGE = 9;

  // Fetch specialties on mount
  useEffect(() => {
    async function fetchSpecialties() {
      try {
        const data = await specialtyService.listSpecialties();
        setSpecialties(data.specialties);
      } catch (err) {
        console.error("Failed to load specialties", err);
      }
    }
    fetchSpecialties();
  }, []);

  // Fetch doctors whenever urlSpecialty changes (relation-based backend filtering)
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        setError(null);
        const data = await doctorService.listDoctors(urlSpecialty || undefined);
        setDoctors(data.doctors);
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Không thể tải danh sách bác sĩ. Vui lòng kiểm tra kết nối với Backend.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [urlSpecialty]);

  // Sync initialSearch query from URL if it changes
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Apply search query filter on client side over the backend-filtered specialty doctors
  useEffect(() => {
    let result = [...doctors];

    if (searchQuery.trim()) {
      const q = removeVietnameseTones(searchQuery.trim());
      result = result.filter(
        (doc) =>
          removeVietnameseTones(doc.name).includes(q) ||
          removeVietnameseTones(doc.hospital).includes(q)
      );
    }

    setFilteredDoctors(result);
    setCurrentPage(1);
  }, [searchQuery, doctors]);

  const totalPages = Math.ceil(filteredDoctors.length / DOCTORS_PER_PAGE);
  const currentDoctors = filteredDoctors.slice(
    (currentPage - 1) * DOCTORS_PER_PAGE,
    currentPage * DOCTORS_PER_PAGE
  );

  const handleSpecialtyChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug && slug !== "ALL") {
      params.set("specialty", slug);
    } else {
      params.delete("specialty");
    }
    router.push(`/doctors?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    router.push("/doctors");
  };

  const getActiveSpecialtyName = () => {
    if (!urlSpecialty) return "";
    const found = specialties.find(s => s.slug === urlSpecialty);
    return found ? found.name : "";
  };

  return (
    <div className="space-y-8">
      {/* Specialty Scrollable Tabs */}
      <div className="border-b border-slate-100 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <button
            onClick={() => handleSpecialtyChange("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              !urlSpecialty
                ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10 animate-fade-in"
                : "bg-white border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600"
            }`}
          >
            Tất cả chuyên khoa
          </button>
          {specialties.map((spec) => (
            <button
              key={spec.id}
              onClick={() => handleSpecialtyChange(spec.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                urlSpecialty === spec.slug
                  ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                  : "bg-white border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600"
              }`}
            >
              <span>{spec.icon || "🩺"}</span>
              <span>{spec.name}</span>
              {spec._count && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  urlSpecialty === spec.slug ? "bg-teal-700 text-teal-100" : "bg-slate-100 text-slate-500"
                }`}>
                  {spec._count.doctors}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

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
              value={urlSpecialty || "ALL"}
              onChange={(e) => handleSpecialtyChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả chuyên khoa</option>
              {specialties.map((spec) => (
                <option key={spec.id} value={spec.slug}>
                  {spec.icon ? `${spec.icon} ` : ""}{spec.name}
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
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Main Results Display */}
      <div id="doctors-list-section">
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
          <div className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {urlSpecialty ? (
              <p>Không tìm thấy bác sĩ nào thuộc chuyên khoa <strong>{getActiveSpecialtyName() || urlSpecialty}</strong>{searchQuery ? ` phù hợp với từ khóa "${searchQuery}"` : ""}.</p>
            ) : (
              <p>Không tìm thấy bác sĩ phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;. Thử thay đổi bộ lọc tìm kiếm.</p>
            )}
          </div>
          <Button variant="teal" onClick={handleResetFilters} className="mt-5 rounded-xl text-xs font-semibold">
            Xem toàn bộ bác sĩ
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-600">
              Tìm thấy <span className="text-teal-600 font-bold">{filteredDoctors.length}</span> bác sĩ
              {urlSpecialty && <> thuộc chuyên khoa <span className="text-teal-600 font-bold">{getActiveSpecialtyName()}</span></>}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              scrollTargetId="doctors-list-section"
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow flex flex-col">
      <BookingProgress />
      {/* Header Info */}
      <div className="space-y-2.5 mb-8">
        <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">Đội Ngũ Bác Sĩ Chuyên Khoa</h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl font-medium">
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
