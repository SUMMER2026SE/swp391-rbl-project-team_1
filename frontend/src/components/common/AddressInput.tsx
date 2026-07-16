"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Search, X, Building2, Map, Home, Edit3 } from "lucide-react";

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  existingAddress?: string;
  className?: string;
}

const API_BASE = "https://provinces.open-api.vn/api";

export default function AddressInput({ value, onChange, existingAddress, className }: AddressInputProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [streetAddress, setStreetAddress] = useState("");

  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Show "editing" mode when user clicks to change existing address
  const [isEditing, setIsEditing] = useState(!existingAddress);

  const provinceRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const wardRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false);
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictDropdown(false);
      }
      if (wardRef.current && !wardRef.current.contains(event.target as Node)) {
        setShowWardDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/p/`);
        const data = await res.json();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`${API_BASE}/p/${selectedProvince.code}?depth=2`);
        const data = await res.json();
        setDistricts(data.districts || []);
      } catch (error) {
        console.error("Failed to fetch districts:", error);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(`${API_BASE}/d/${selectedDistrict.code}?depth=2`);
        const data = await res.json();
        setWards(data.wards || []);
      } catch (error) {
        console.error("Failed to fetch wards:", error);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Build full address whenever components change
  const buildAddress = useCallback(() => {
    const parts: string[] = [];
    if (streetAddress.trim()) parts.push(streetAddress.trim());
    if (selectedWard) parts.push(selectedWard.name);
    if (selectedDistrict) parts.push(selectedDistrict.name);
    if (selectedProvince) parts.push(selectedProvince.name);
    return parts.join(", ");
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince]);

  useEffect(() => {
    if (!isEditing) return;
    const fullAddress = buildAddress();
    if (fullAddress !== value) {
      onChange(fullAddress);
    }
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince, isEditing]);

  // Filtered lists
  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(provinceSearch.toLowerCase())
  );
  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );
  const filteredWards = wards.filter((w) =>
    w.name.toLowerCase().includes(wardSearch.toLowerCase())
  );

  const handleSelectProvince = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setProvinceSearch("");
    setDistrictSearch("");
    setWardSearch("");
    setShowProvinceDropdown(false);
  };

  const handleSelectDistrict = (district: District) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    setDistrictSearch("");
    setWardSearch("");
    setShowDistrictDropdown(false);
  };

  const handleSelectWard = (ward: Ward) => {
    setSelectedWard(ward);
    setWardSearch("");
    setShowWardDropdown(false);
  };

  const clearProvince = () => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setProvinceSearch("");
    setDistrictSearch("");
    setWardSearch("");
    onChange("");
  };

  const clearDistrict = () => {
    setSelectedDistrict(null);
    setSelectedWard(null);
    setWards([]);
    setDistrictSearch("");
    setWardSearch("");
  };

  const clearWard = () => {
    setSelectedWard(null);
    setWardSearch("");
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    // keep onChange pointing to new value
    onChange(value || "");
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    // Reset internal state
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setStreetAddress("");
    setDistricts([]);
    setWards([]);
    // Restore parent value to the existing address
    onChange(existingAddress || "");
  };

  // If existingAddress is provided and we're not editing, show preview
  if (!isEditing && existingAddress) {
    return (
      <div className={`${className || ""}`}>
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <MapPin className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 leading-relaxed">{existingAddress}</p>
          </div>
          <button
            type="button"
            onClick={handleStartEditing}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 shrink-0 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Thay đổi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className || ""}`}>
      {/* Cancel button when editing existing */}
      {existingAddress && isEditing && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Chọn địa chỉ mới để thay thế</p>
          <button
            type="button"
            onClick={handleCancelEditing}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Huỷ
          </button>
        </div>
      )}

      {/* Province selector */}
      <div ref={provinceRef} className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          <Map className="inline w-4 h-4 mr-1 text-teal-500" />
          Tỉnh / Thành phố <span className="text-red-500">*</span>
        </label>
        <div
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white cursor-pointer flex items-center justify-between hover:border-teal-400 transition-colors"
          onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
        >
          <span className={selectedProvince ? "text-slate-900" : "text-slate-400"}>
            {selectedProvince ? selectedProvince.name : "Chọn tỉnh / thành phố"}
          </span>
          <div className="flex items-center gap-1">
            {selectedProvince && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearProvince(); }}
                className="p-0.5 hover:bg-slate-100 rounded"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProvinceDropdown ? "rotate-180" : ""}`} />
          </div>
        </div>
        {showProvinceDropdown && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tỉnh / thành phố..."
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {loadingProvinces ? (
                <div className="p-3 text-center text-sm text-slate-400">Đang tải...</div>
              ) : filteredProvinces.length === 0 ? (
                <div className="p-3 text-center text-sm text-slate-400">Không tìm thấy</div>
              ) : (
                filteredProvinces.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors ${
                      selectedProvince?.code === p.code ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"
                    }`}
                    onClick={() => handleSelectProvince(p)}
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* District selector */}
      <div ref={districtRef} className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          <Building2 className="inline w-4 h-4 mr-1 text-teal-500" />
          Quận / Huyện <span className="text-red-500">*</span>
        </label>
        <div
          className={`w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white flex items-center justify-between transition-colors ${
            selectedProvince ? "cursor-pointer hover:border-teal-400" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => selectedProvince && setShowDistrictDropdown(!showDistrictDropdown)}
        >
          <span className={selectedDistrict ? "text-slate-900" : "text-slate-400"}>
            {selectedDistrict ? selectedDistrict.name : selectedProvince ? "Chọn quận / huyện" : "Vui lòng chọn tỉnh trước"}
          </span>
          <div className="flex items-center gap-1">
            {selectedDistrict && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearDistrict(); }}
                className="p-0.5 hover:bg-slate-100 rounded"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDistrictDropdown ? "rotate-180" : ""}`} />
          </div>
        </div>
        {showDistrictDropdown && selectedProvince && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm quận / huyện..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {loadingDistricts ? (
                <div className="p-3 text-center text-sm text-slate-400">Đang tải...</div>
              ) : filteredDistricts.length === 0 ? (
                <div className="p-3 text-center text-sm text-slate-400">Không tìm thấy</div>
              ) : (
                filteredDistricts.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors ${
                      selectedDistrict?.code === d.code ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"
                    }`}
                    onClick={() => handleSelectDistrict(d)}
                  >
                    {d.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ward selector */}
      <div ref={wardRef} className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          <MapPin className="inline w-4 h-4 mr-1 text-teal-500" />
          Phường / Xã
        </label>
        <div
          className={`w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white flex items-center justify-between transition-colors ${
            selectedDistrict ? "cursor-pointer hover:border-teal-400" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => selectedDistrict && setShowWardDropdown(!showWardDropdown)}
        >
          <span className={selectedWard ? "text-slate-900" : "text-slate-400"}>
            {selectedWard ? selectedWard.name : selectedDistrict ? "Chọn phường / xã" : "Vui lòng chọn quận trước"}
          </span>
          <div className="flex items-center gap-1">
            {selectedWard && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearWard(); }}
                className="p-0.5 hover:bg-slate-100 rounded"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showWardDropdown ? "rotate-180" : ""}`} />
          </div>
        </div>
        {showWardDropdown && selectedDistrict && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm phường / xã..."
                  value={wardSearch}
                  onChange={(e) => setWardSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {loadingWards ? (
                <div className="p-3 text-center text-sm text-slate-400">Đang tải...</div>
              ) : filteredWards.length === 0 ? (
                <div className="p-3 text-center text-sm text-slate-400">Không tìm thấy</div>
              ) : (
                filteredWards.map((w) => (
                  <button
                    key={w.code}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors ${
                      selectedWard?.code === w.code ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"
                    }`}
                    onClick={() => handleSelectWard(w)}
                  >
                    {w.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Street address input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          <Home className="inline w-4 h-4 mr-1 text-teal-500" />
          Số nhà, tên đường
        </label>
        <input
          type="text"
          placeholder="Ví dụ: 123 Nguyễn Văn Linh"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
        />
      </div>

      {/* Preview full address */}
      {(selectedProvince || streetAddress) && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
          <p className="text-xs font-medium text-teal-700 mb-1">Địa chỉ đầy đủ:</p>
          <p className="text-sm text-teal-900">{buildAddress() || "—"}</p>
        </div>
      )}
    </div>
  );
}