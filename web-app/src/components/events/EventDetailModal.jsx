import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInHours, isWithinInterval } from "date-fns";
import { Calendar, Clock, MapPin, Users, Edit, Download, Loader2, CheckCircle } from "lucide-react";
import DivisionBadge from "../shared/DivisionBadge";
import StatusBadge from "../shared/StatusBadge";

export default function EventDetailModal({ open, onClose, event, isAdmin, onEdit, currentMember }) {
  const queryClient = useQueryClient();

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['eventAttendance', event?.id],
    queryFn: () => base44.entities.AttendanceRecord.filter({ eventId: event.id }),
    enabled: !!event?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('lastName', 500),
    enabled: isAdmin,
  });

  const updateAttendance = useMutation({
    mutationFn: async ({ recordId, status }) => {
      return base44.entities.AttendanceRecord.update(recordId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventAttendance'] });
    },
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      const eventDuration = Math.max(0.5, differenceInHours(new Date(event.dateTimeEnd), new Date(event.dateTimeStart)));
      return base44.entities.AttendanceRecord.create({
        memberId: currentMember.id,
        memberName: `${currentMember.firstName} ${currentMember.lastName}`,
        eventId: event.id,
        eventTitle: event.title,
        status: "Present",
        hours: eventDuration,
        notes: "Self check-in",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
    },
  });

  if (!event) return null;

  const startDate = new Date(event.dateTimeStart);
  const endDate = new Date(event.dateTimeEnd);
  const now = new Date();
  const isHappening = isWithinInterval(now, { start: startDate, end: endDate });
  const hasCheckedIn = attendanceRecords.some(r => r.memberId === currentMember?.id);

  const exportToCSV = () => {
    const headers = ["Name", "Status", "Hours", "Notes"];
    const rows = attendanceRecords.map(r => [
      r.memberName,
      r.status,
      r.hours,
      r.notes || "",
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}_attendance.csv`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {isHappening && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <DivisionBadge division={event.division} />
                <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                  {event.eventType}
                </Badge>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(event)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Event Details */}
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(startDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-slate-400">{event.description}</p>
          )}

          {/* Check-in Button */}
          {isHappening && currentMember && !hasCheckedIn && (
            <Button
              onClick={() => checkIn.mutate()}
              disabled={checkIn.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
            >
              {checkIn.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Check In Now
            </Button>
          )}

          {hasCheckedIn && (
            <div className="bg-green-500/20 text-green-400 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              You've checked in for this event
            </div>
          )}

          {/* Attendance Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Attendance ({attendanceRecords.length})
              </h3>
              {isAdmin && attendanceRecords.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              )}
            </div>

            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : attendanceRecords.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No attendance records yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{record.memberName}</p>
                      <p className="text-sm text-slate-400">{record.hours}h logged</p>
                    </div>
                    {isAdmin ? (
                      <Select
                        value={record.status}
                        onValueChange={(v) => updateAttendance.mutate({ recordId: record.id, status: v })}
                      >
                        <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="Present" className="text-green-400 hover:bg-slate-700">Present</SelectItem>
                          <SelectItem value="Late" className="text-yellow-400 hover:bg-slate-700">Late</SelectItem>
                          <SelectItem value="Excused" className="text-blue-400 hover:bg-slate-700">Excused</SelectItem>
                          <SelectItem value="Absent" className="text-red-400 hover:bg-slate-700">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge status={record.status} type="attendance" />
                    )}
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