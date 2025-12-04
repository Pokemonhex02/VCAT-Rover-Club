import React from "react";
import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status, type = "task" }) {
  const taskStyles = {
    Backlog: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Blocked: "bg-red-500/20 text-red-400 border-red-500/30",
    Done: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const memberStyles = {
    Active: "bg-green-500/20 text-green-400 border-green-500/30",
    Alumni: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Prospective: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const attendanceStyles = {
    Present: "bg-green-500/20 text-green-400 border-green-500/30",
    Late: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Excused: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Absent: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const styles = type === "task" ? taskStyles : type === "member" ? memberStyles : attendanceStyles;

  return (
    <Badge variant="outline" className={`${styles[status] || "bg-slate-700 text-slate-400"} font-medium`}>
      {status}
    </Badge>
  );
}