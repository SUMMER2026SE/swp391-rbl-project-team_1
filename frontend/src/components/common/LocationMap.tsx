"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

interface LocationMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  title?: string;
  className?: string;
}

export default function LocationMap({
  lat = 16.0595, // 291 Nguyễn Văn Linh, Đà Nẵng
  lng = 108.2085,
  zoom = 15,
  title = "291 Nguyễn Văn Linh, Đà Nẵng",
  className = "w-full h-full min-h-[400px] rounded-3xl",
}: LocationMapProps) {
  const position = { lat, lng };
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className={`${className} overflow-hidden shadow-lg border border-teal-100/50 relative`}>
      {!apiKey ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-teal-50/50 p-6 text-center z-10 border-2 border-dashed border-teal-200 rounded-3xl">
          <svg className="w-12 h-12 text-teal-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-teal-800 font-semibold mb-1">Bản đồ đang được thiết lập</p>
          <p className="text-teal-600/70 text-sm">Vui lòng cung cấp Google Maps API Key để hiển thị bản đồ tương tác.</p>
        </div>
      ) : (
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={position}
            defaultZoom={zoom}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={false}
            gestureHandling="greedy"
          >
            <AdvancedMarker position={position} title={title}>
              <Pin background={"#0d9488"} borderColor={"#042f2e"} glyphColor={"#ccfbf1"} />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      )}
    </div>
  );
}
