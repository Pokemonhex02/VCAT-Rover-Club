import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Link as LinkIcon } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import PriorityBadge from "../shared/PriorityBadge";

export default function TaskCard({ task, onClick }) {
  const isDueSoon = task.dueDate && (isToday(new Date(task.dueDate)) || isPast(new Date(task.dueDate)));

  const phaseColors = {
    Concept: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Design: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Fabrication: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Integration: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Testing: "bg-green-500/20 text-green-400 border-green-500/30",
    Documentation: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <Card
      className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-3">
        <h4 className="font-medium text-white text-sm line-clamp-2 mb-2">{task.title}</h4>
        
        <div className="flex flex-wrap gap-1 mb-2">
          <PriorityBadge priority={task.priority} />
          {task.phase && (
            <Badge variant="outline" className={`${phaseColors[task.phase]} text-xs`}>
              {task.phase}
            </Badge>
          )}
        </div>

        {task.subTeam && (
          <p className="text-xs text-slate-400 mb-2">{task.subTeam}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isDueSoon && task.status !== 'Done' ? 'text-red-400' : ''}`}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {task.estimatedHours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.loggedHours || 0}/{task.estimatedHours}h
              </span>
            )}
            {task.links && (
              <LinkIcon className="w-3 h-3 text-cyan-400" />
            )}
          </div>

          {task.assigneeNames?.length > 0 && (
            <div className="flex -space-x-2">
              {task.assigneeNames.slice(0, 3).map((name, i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-slate-800">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-cyan-500 text-white text-xs">
                    {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assigneeNames.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-300">
                  +{task.assigneeNames.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}