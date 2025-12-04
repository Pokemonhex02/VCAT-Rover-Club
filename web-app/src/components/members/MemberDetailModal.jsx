import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import DivisionBadge from "../shared/DivisionBadge";
import StatusBadge from "../shared/StatusBadge";
import { Mail, Phone, GraduationCap, Calendar, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function MemberDetailModal({ open, onClose, member }) {
  const { data: timeLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['memberTimeLogs', member?.id],
    queryFn: () => base44.entities.TimeLog.filter({ memberId: member.id }),
    enabled: !!member?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['memberTasks', member?.id],
    queryFn: () => base44.entities.Task.list(),
    enabled: !!member?.id,
  });

  if (!member) return null;

  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

  const assignedTasks = tasks.filter(t => t.assigneeIds?.includes(member.id) && t.status !== "Done");

  const hoursByCategory = timeLogs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + (log.hours || 0);
    return acc;
  }, {});

  const totalHours = Object.values(hoursByCategory).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 flex-shrink-0">
              <AvatarImage src={member.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-cyan-500 text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl font-bold">
                {member.firstName} {member.lastName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <DivisionBadge division={member.division} />
                <StatusBadge status={member.status} type="member" />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.major && (
              <div className="flex items-center gap-2 text-slate-300">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>{member.major} '{member.graduationYear?.toString().slice(-2)}</span>
              </div>
            )}
            {member.joinedDate && (
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined {format(new Date(member.joinedDate), "MMMM yyyy")}</span>
              </div>
            )}
          </div>

          {/* Roles */}
          {member.roles?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Roles</h4>
              <div className="flex flex-wrap gap-2">
                {member.roles.map((role) => (
                  <Badge key={role} className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Teams */}
          {member.subTeams?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Sub-Teams</h4>
              <div className="flex flex-wrap gap-2">
                {member.subTeams.map((team) => (
                  <Badge key={team} variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                    {team}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {member.skills?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Hours */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hours Logged ({totalHours.toFixed(1)} total)
            </h4>
            {logsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(hoursByCategory).map(([category, hours]) => (
                  <div key={category} className="bg-slate-800/50 rounded-lg p-2 flex justify-between">
                    <span className="text-sm text-slate-400">{category}</span>
                    <span className="text-sm font-medium text-white">{hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Tasks */}
          {assignedTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Active Tasks ({assignedTasks.length})</h4>
              <div className="space-y-2">
                {assignedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.subTeam}</p>
                  </div>
                ))}
                {assignedTasks.length > 3 && (
                  <p className="text-xs text-slate-500">+{assignedTasks.length - 3} more tasks</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Notes</h4>
              <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">{member.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}