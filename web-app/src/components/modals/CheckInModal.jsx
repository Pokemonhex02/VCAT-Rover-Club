import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, MapPin, Clock } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import DivisionBadge from "../shared/DivisionBadge";

export default function CheckInModal({ open, onClose, event, member }) {
  const queryClient = useQueryClient();

  const eventDuration = event
    ? Math.max(0.5, differenceInHours(new Date(event.dateTimeEnd), new Date(event.dateTimeStart)))
    : 1;

  const checkIn = useMutation({
    mutationFn: async () => {
      return base44.entities.AttendanceRecord.create({
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        eventId: event.id,
        eventTitle: event.title,
        status: "Present",
        hours: eventDuration,
        notes: "Self check-in",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
      onClose();
    },
  });

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Check In
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Confirm your attendance for this event
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-white">{event.title}</h3>
            <DivisionBadge division={event.division} size="sm" />
          </div>
          
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {format(new Date(event.dateTimeStart), "MMM d, h:mm a")} - {format(new Date(event.dateTimeEnd), "h:mm a")}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-300">
              This will log <span className="font-semibold text-white">{eventDuration} hours</span> for this event.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
          >
            {checkIn.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Check In"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}