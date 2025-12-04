import React from "react";
import { Badge } from "@/components/ui/badge";

export default function DivisionBadge({ division, size = "default" }) {
  const styles = {
    HP: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    RC: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Both: "bg-gradient-to-r from-orange-500/20 to-cyan-500/20 text-white border-purple-500/30",
    Joint: "bg-gradient-to-r from-orange-500/20 to-cyan-500/20 text-white border-purple-500/30",
    None: "bg-slate-700 text-slate-400 border-slate-600",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge 
      variant="outline" 
      className={`${styles[division] || styles.None} ${sizeClasses[size]} font-medium`}
    >
      {division}
    </Badge>
  );
}