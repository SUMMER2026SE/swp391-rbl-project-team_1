import React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

interface AlertProps {
  type?: "success" | "error" | "info" | "warning";
  message: string;
  className?: string;
}

export default function Alert({ type = "info", message, className = "" }: AlertProps) {
  const styles = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-800",
    error: "bg-red-50 border-red-100 text-red-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
    info: "bg-blue-50 border-blue-100 text-blue-800",
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm shadow-sm ${styles[type]} ${className}`}>
      {icons[type]}
      <div>{message}</div>
    </div>
  );
}
