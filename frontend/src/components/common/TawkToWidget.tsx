"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: any;
  }
}

export default function TawkToWidget() {
  useEffect(() => {
    // Prevent multiple initializations
    if (typeof window !== "undefined" && window.Tawk_API) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    (function () {
      var s1 = document.createElement("script");
      var s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = "https://embed.tawk.to/64d1f2e994cf5d49dc69213f/1h7a7n823"; // Using a placeholder/demo tawk.to property id if user didn't provide one
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      } else {
        document.head.appendChild(s1);
      }
    })();
  }, []);

  return null;
}
