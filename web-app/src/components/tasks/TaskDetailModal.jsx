import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, Link as LinkIcon, Edit, ExternalLink, Loader2 } from "lucide-react";
import DivisionBadge from "../shared/DivisionBadge";
import PriorityBadge from "../shared/PriorityBadge";
import StatusBadge from "../shared/StatusBadge";

export default function TaskDetailModal({ open, onClose, task, isAdmin, onEdit }) {
  const { data: timeLogs = [], isLoading } = useQuery({
    queryKey: ['taskTimeLogs', task?.id],
    queryFn: () => base44.entities.TimeLog.filter({ taskId: task.id }),
    enabled: !!task?.id,
  });

  if (!task) return null;

  const totalLoggedHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

  const phaseColors = {
    Concept: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Design: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Fabrication: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Integration: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Testing: "bg-green-500/20 text-green-400 border-green-500/30",
    Documentation: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <DivisionBadge division={task.division} />
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            {task.subTeam && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Sub-Team</p>
                <p className="text-sm text-white">{task.subTeam}</p>
              </div>
            )}
            {task.phase && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Phase</p>
                <Badge variant="outline" className={phaseColors[task.phase]}>
                  {task.phase}
                </Badge>
              </div>
            )}
            {task.dueDate && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Due Date</p>
                <p className="text-sm text-white flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {format(new Date(task.dueDate), "MMMM d, yyyy")}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-1">Hours</p>
              <p className="text-sm text-white flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {totalLoggedHours.toFixed(1)} / {task.estimatedHours || '—'}h
              </p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Description</p>
              <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">{task.description}</p>
            </div>
          )}

          {/* Links */}
          {task.links && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Links</p>
              <a
                href={task.links}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                {task.links}
              </a>
            </div>
          )}

          {/* Assignees */}
          {task.assigneeNames?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Assignees</p>
              <div className="flex flex-wrap gap-2">
                {task.assigneeNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-cyan-500 text-white text-xs">
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Logs */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Time Logs ({timeLogs.length})</p>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : timeLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No time logged yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {timeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2">
                    <div>
                      <p className="text-sm text-white">{log.memberName}</p>
                      <p className="text-xs text-slate-400">{format(new Date(log.date), "MMM d")} • {log.category}</p>
                    </div>
                    <span className="text-sm font-medium text-cyan-400">{log.hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}