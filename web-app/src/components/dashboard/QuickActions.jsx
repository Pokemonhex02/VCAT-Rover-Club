import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, UserCheck, Rocket, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function QuickActions({ currentEvent, onLogHours, onCheckIn }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Button
        onClick={onLogHours}
        className="h-auto py-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 flex flex-col items-center gap-2"
      >
        <Clock className="w-6 h-6" />
        <span className="text-sm font-medium">Log Hours</span>
      </Button>

      <Button
        onClick={onCheckIn}
        disabled={!currentEvent}
        className={`h-auto py-4 flex flex-col items-center gap-2 ${
          currentEvent
            ? "bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
            : "bg-slate-700 text-slate-400"
        }`}
      >
        <UserCheck className="w-6 h-6" />
        <span className="text-sm font-medium">Check In</span>
      </Button>

      <Link to={createPageUrl("TasksHP")} className="w-full">
        <Button className="w-full h-auto py-4 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 flex flex-col items-center gap-2">
          <Rocket className="w-6 h-6" />
          <span className="text-sm font-medium">HP Board</span>
        </Button>
      </Link>

      <Link to={createPageUrl("TasksRC")} className="w-full">
        <Button className="w-full h-auto py-4 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 flex flex-col items-center gap-2">
          <Zap className="w-6 h-6" />
          <span className="text-sm font-medium">RC Board</span>
        </Button>
      </Link>
    </div>
  );
}