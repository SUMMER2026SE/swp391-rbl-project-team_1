import type { ReactNode } from "react";

/**
 * Layout riêng cho tất cả các trang video call.
 * Full-screen, không có sidebar/navbar từ doctor layout.
 */
export default function VideoCallLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-950">
      {children}
    </div>
  );
}
