import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";

export default function PriorityBadge({ priority }) {
  const config = {
    Critical: {
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: AlertTriangle,
    },
    High: {
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      icon: ArrowUp,
    },
    Medium: {
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: Minus,
    },
    Low: {
      className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      icon: ArrowDown,
    },
  };

  const { className, icon: Icon } = config[priority] || config.Medium;

  return (
    <Badge variant="outline" className={`${className} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {priority}
    </Badge>
  );
}