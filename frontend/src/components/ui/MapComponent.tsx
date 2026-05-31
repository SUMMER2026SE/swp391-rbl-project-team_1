"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(DefaultIcon);

// Custom icons for user and clinic markers
const userIcon = L.divIcon({
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #0f766e, #14b8a6);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    ">
      📍
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: "user-marker",
});

const clinicIcon = L.divIcon({
  html: `
    <div style="
      width: 35px;
      height: 35px;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
    ">
      🏥
    </div>
  `,
  iconSize: [35, 35],
  iconAnchor: [17.5, 17.5],
  popupAnchor: [0, -17.5],
  className: "clinic-marker",
});

interface Doctor {
  id: string;
  name: string;
  specialty: {
    name: string;
  };
  experience: number;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  doctors: Doctor[];
}

interface MapComponentProps {
  userCoords: { lat: number; lng: number } | null;
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic) => void;
}

export default function MapComponent({
  userCoords,
  clinics,
  selectedClinic,
  onSelectClinic,
}: MapComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-3xl">
        <span className="text-slate-500 text-sm font-semibold">Đang tải bản đồ...</span>
      </div>
    );
  }

  // Determine map center
  let mapCenter: [number, number] = [16.0544, 108.2022]; // Default: Da Nang center
  if (userCoords) {
    mapCenter = [userCoords.lat, userCoords.lng];
  } else if (clinics.length > 0) {
    const firstClinic = clinics[0];
    mapCenter = [firstClinic.latitude, firstClinic.longitude];
  }

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-inner">
      <MapContainer
        center={mapCenter}
        zoom={clinics.length > 0 ? 13 : 12}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* User location marker */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="text-xs">
                <strong>Vị trí của bạn</strong>
                <div className="text-slate-600">
                  ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clinic markers */}
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            position={[clinic.latitude, clinic.longitude]}
            icon={clinicIcon}
            eventHandlers={{
              click: () => onSelectClinic(clinic),
            }}
          >
            <Popup>
              <div className="text-xs max-w-[200px]">
                <strong className="text-teal-700">{clinic.name}</strong>
                <div className="text-slate-600 mt-1">📍 {clinic.address}</div>
                <div className="text-slate-500 mt-1">
                  Cách bạn: {clinic.distance.toFixed(2)} km
                </div>
                <div className="text-slate-500">👥 {clinic.doctors?.length || 0} bác sĩ</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
