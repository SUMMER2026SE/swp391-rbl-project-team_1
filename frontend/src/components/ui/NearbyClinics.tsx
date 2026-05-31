"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Phone, Stethoscope, Search, Loader2, Compass } from "lucide-react";
import api from "@/services/api";
import Button from "../common/Button";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
      <span className="text-xs font-medium">Đang tải bản đồ GPS...</span>
    </div>
  )
});

interface Doctor {
  id: string;
  name: string;
  specialty: {
    name: string;
    icon?: string;
  };
  experience: number;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  image?: string;
  latitude: number;
  longitude: number;
  distance: number;
  doctors: Doctor[];
}

export default function NearbyClinics() {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIpGeolocation = async (gpsError?: any) => {
    // Try ipapi.co first
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = data.latitude;
          const lng = data.longitude;
          setCoords({ lat, lng });
          toast.success(`Định vị qua mạng (IP) thành công: ${data.city || data.region || "Việt Nam"}`);
          fetchNearbyClinics(lat, lng, radius);
          return;
        }
      }
    } catch (e) {
      console.warn("ipapi.co failed, trying freeipapi.com...", e);
    }

    // Try freeipapi.com next
    try {
      const res = await fetch("https://freeipapi.com/api/json");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = data.latitude;
          const lng = data.longitude;
          setCoords({ lat, lng });
          toast.success(`Định vị qua mạng (IP) thành công: ${data.cityName || "Việt Nam"}`);
          fetchNearbyClinics(lat, lng, radius);
          return;
        }
      }
    } catch (e) {
      console.warn("freeipapi.com failed, trying ipwho.is...", e);
    }

    // Try ipwho.is next
    try {
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.latitude && data.longitude) {
          const lat = data.latitude;
          const lng = data.longitude;
          setCoords({ lat, lng });
          toast.success(`Định vị qua mạng (IP) thành công: ${data.city || "Việt Nam"}`);
          fetchNearbyClinics(lat, lng, radius);
          return;
        }
      }
    } catch (e) {
      console.error("All IP Geolocation methods failed:", e);
    }

      // If all fails, show original GPS error message
      let errorMsg = "Không thể định vị vị trí của bạn. ";
      if (gpsError) {
        if (gpsError.code === 1) {
          errorMsg += "Quyền truy cập định vị bị từ chối. Vui lòng cấp quyền định vị trong cài đặt trình duyệt.";
        } else if (gpsError.code === 2) {
          errorMsg += "Vị trí không khả dụng (thiết bị không hỗ trợ GPS hoặc đang tắt dịch vụ định vị).";
        } else if (gpsError.code === 3) {
          errorMsg += "Định vị hết thời gian phản hồi (timeout).";
        } else {
          errorMsg += gpsError.message;
        }
      } else {
        errorMsg += "Trình duyệt không hỗ trợ Geolocation và không truy cập được IP Geolocation.";
      }
      setError(errorMsg);
      setLoading(false);
  };

  const getGeolocation = () => {
    setLoading(true);
    setError(null);
    setSelectedClinic(null);
    
    if (!navigator.geolocation) {
      fetchIpGeolocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        fetchNearbyClinics(lat, lng, radius);
      },
      (err) => {
        console.warn("Native GPS failed, calling IP Geolocation fallback...", err);
        fetchIpGeolocation(err);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  const fetchNearbyClinics = async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/clinics/nearby?lat=${lat}&lng=${lng}&radius=${rad}`);
      setClinics(response.data.clinics);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tìm thấy phòng khám xung quanh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClinics = async () => {
    setLoading(true);
    setError(null);
    setSelectedClinic(null);
    try {
      const response = await api.get("/clinics");
      const formatted = response.data.clinics.map((c: any) => ({
        ...c,
        distance: 0,
        doctors: c.doctors || []
      }));
      setClinics(formatted);
      toast.success("Đã tải danh sách tất cả phòng khám trên hệ thống!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tải danh sách phòng khám.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md space-y-6">
      {/* Geolocation trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600 animate-spin-slow" />
            Tìm Phòng Khám Gần Bạn Nhất (GPS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Định vị tọa độ thực của bạn và gợi ý phòng khám trong bán kính gần</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-500 font-medium">Bán kính:</span>
            <select 
              value={radius} 
              onChange={(e) => {
                const r = parseInt(e.target.value);
                setRadius(r);
                if (coords) fetchNearbyClinics(coords.lat, coords.lng, r);
              }}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <Button 
            onClick={getGeolocation}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white border-none py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold text-xs"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            Định vị & Tìm Kiếm
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl flex items-center gap-2 animate-fadeIn">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Main Grid: map and clinic list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Clinic List (Left) */}
        <div className="lg:col-span-5 space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {clinics.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">
                {coords ? "Không tìm thấy phòng khám nào gần bạn" : "Chưa có dữ liệu định vị phòng khám"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                {coords 
                  ? `Vị trí của bạn: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}) nằm ngoài bán kính ${radius}km của các phòng khám Da Nang.`
                  : "Vui lòng nhấn nút Định vị để tự động định vị và tìm kiếm phòng khám xung quanh."}
              </p>
              <div className="mt-4 flex flex-col gap-2 w-full">
                {coords && (
                  <Button 
                    onClick={() => {
                      setRadius(50);
                      fetchNearbyClinics(coords.lat, coords.lng, 50);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none text-xs py-2 px-3 rounded-xl font-bold"
                  >
                    Mở rộng bán kính (50 km)
                  </Button>
                )}
                <Button 
                  onClick={fetchAllClinics}
                  className="bg-teal-600 hover:bg-teal-700 text-white border-none text-xs py-2 px-3 rounded-xl font-bold"
                >
                  Hiển thị tất cả phòng khám (Xem danh sách)
                </Button>
              </div>
            </div>
          ) : (
            clinics.map((clinic) => (
              <div 
                key={clinic.id} 
                onClick={() => setSelectedClinic(clinic)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 hover:border-teal-500/50 ${
                  selectedClinic?.id === clinic.id 
                    ? "bg-teal-50/50 border-teal-500 shadow-sm" 
                    : "bg-white border-slate-100"
                }`}
              >
                {clinic.image && (
                  <img src={clinic.image} alt={clinic.name} className="w-16 h-16 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{clinic.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 truncate">{clinic.address}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">
                      📍 Cách {clinic.distance} km
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                      👥 {clinic.doctors?.length || 0} bác sĩ
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Map / Details Panel (Right) */}
        <div className="lg:col-span-7 h-[450px] bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden relative flex flex-col shadow-inner">
          {selectedClinic ? (
            <div className="flex flex-col h-full bg-white p-6 relative">
              {/* Clinic Banner */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">{selectedClinic.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    {selectedClinic.address}
                  </p>
                </div>
                <span className="text-xs bg-teal-50 text-teal-700 font-extrabold border border-teal-200/50 px-3 py-1 rounded-full shrink-0">
                  {selectedClinic.distance} km
                </span>
              </div>

              {/* List of doctors in this clinic */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bác sĩ làm việc tại cơ sở này</h4>
                
                {selectedClinic.doctors && selectedClinic.doctors.length > 0 ? (
                  selectedClinic.doctors.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                          {doc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{doc.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{doc.specialty?.name || "Chuyên khoa"} • {doc.experience} năm kinh nghiệm</div>
                        </div>
                      </div>
                      <a href={`/doctors/${doc.id}`} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10">
                        Đặt khám
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Hiện tại chưa có bác sĩ nào thuộc cơ sở này đăng ký trên hệ thống.</p>
                )}
              </div>
            </div>
          ) : (
            /* Real Map with Leaflet */
            <MapComponent 
              userCoords={coords}
              clinics={clinics}
              selectedClinic={selectedClinic}
              onSelectClinic={setSelectedClinic}
            />
          )}
        </div>
      </div>
    </div>
  );
}
