"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, ChevronRight, Stethoscope, RefreshCcw } from "lucide-react";
import { packageService, MedicalPackage } from "@/services/package.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Pagination from "@/components/common/Pagination";
import Link from "next/link";

export default function PackagesPage() {
  const [packages, setPackages] = useState<MedicalPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("Bệnh viện Hoàn Mỹ Đà Nẵng");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PACKAGES_PER_PAGE = 8;

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await packageService.getPackages(
        hospitalFilter === "ALL" ? undefined : hospitalFilter,
        searchQuery || undefined
      );
      setPackages(data);
      setCurrentPage(1); // Reset to first page on new search
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách gói khám. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchPackages();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setHospitalFilter("ALL");
    // Trigger fetch on next tick or let useEffect handle it if we add dependencies (but we manually fetch)
    setTimeout(() => {
      packageService.getPackages(undefined, undefined).then(data => {
        setPackages(data);
        setCurrentPage(1);
      });
    }, 0);
  };

  // Calculate pagination
  const totalPages = Math.ceil(packages.length / PACKAGES_PER_PAGE);
  const currentPackages = packages.slice(
    (currentPage - 1) * PACKAGES_PER_PAGE,
    currentPage * PACKAGES_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-r from-[#eef9fa] to-[#d6f0f2] pt-16 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#017a86] leading-tight tracking-tight mb-4 drop-shadow-sm">
                Gói khám <br className="hidden md:block" />
                sức khỏe
              </h1>
              <p className="text-slate-600 text-lg max-w-md">
                Chủ động chăm sóc sức khỏe với các gói khám toàn diện, được thiết kế chuyên biệt bởi đội ngũ y bác sĩ hàng đầu.
              </p>
            </div>
            <div className="md:w-1/2 relative flex justify-end">
              <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white/50">
                <Image
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"
                  alt="Doctor consulting patient"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Lọc theo</label>
              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 font-medium appearance-none bg-slate-50"
              >
                <option value="ALL">Tất cả bệnh viện / phòng khám</option>
                <option value="Bệnh viện Hoàn Mỹ Đà Nẵng">Bệnh viện Hoàn Mỹ Đà Nẵng</option>
                <option value="Bệnh viện Đà Nẵng">Bệnh viện Đà Nẵng</option>
              </select>
            </div>
            
            <div className="w-full md:w-1/2 relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2 opacity-0 hidden md:block">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Từ khóa tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50"
                />
              </div>
            </div>

            <div className="w-full md:w-auto flex gap-2">
              <Button
                variant="teal"
                onClick={handleApplyFilters}
                className="w-full md:w-auto py-3 px-8 rounded-xl font-bold whitespace-nowrap shadow-sm hover:shadow-md"
              >
                Áp dụng
              </Button>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="py-3 px-4 rounded-xl text-slate-500 hover:text-slate-800 border-slate-200"
                title="Xóa bộ lọc"
              >
                <RefreshCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="flex flex-col py-24 items-center justify-center">
            <LoadingSpinner className="h-10 w-10 text-teal-600" />
            <p className="mt-4 text-sm text-slate-500 font-medium">Đang tải danh sách gói khám...</p>
          </div>
        ) : error ? (
          <Alert type="error" message={error} className="mb-8" />
        ) : packages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-800">Không tìm thấy gói khám nào</p>
            <p className="text-sm text-slate-500 mt-2">Vui lòng thử nghiệm với từ khóa hoặc bộ lọc khác.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {currentPackages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                  {/* Card Image */}
                  <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                    {pkg.image ? (
                      <Image
                        src={pkg.image}
                        alt={pkg.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <Stethoscope className="w-12 h-12" />
                      </div>
                    )}
                    {/* Teal bottom border accent matching the screenshot */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[#017a86]" />
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#eaf6f7] text-[#017a86] text-[10px] font-bold uppercase tracking-wide">
                        {pkg.hospital}
                      </div>
                      {pkg.isRecommended && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide border border-orange-200">
                          🔥 Đề xuất
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-[#017a86] mb-2 leading-tight group-hover:text-teal-700 transition-colors line-clamp-2">
                      {pkg.name}
                    </h3>
                    
                    <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed flex-grow">
                      {pkg.description || "Chưa có mô tả chi tiết cho gói khám này."}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="font-black text-slate-800">
                        {pkg.price.toLocaleString("vi-VN")} <span className="text-xs text-slate-400 font-medium">VNĐ</span>
                      </div>
                      <Link href={`/packages/${pkg.id}`} className="inline-flex items-center text-sm font-bold text-[#017a86] hover:text-teal-700 transition-colors group-hover:translate-x-1 duration-300">
                        Xem thêm <ChevronRight className="w-4 h-4 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center pb-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
