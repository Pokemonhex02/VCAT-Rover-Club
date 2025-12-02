import React from "react";
import { Badge } from "@/components/ui/badge";

export default function SkillTag({ skill, onClick, selected = false }) {
  return (
    <Badge 
      variant="outline" 
      className={`
        cursor-pointer transition-all duration-200
        ${selected 
          ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' 
          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}
      `}
      onClick={onClick}
    >
      {skill}
    </Badge>
  );
}