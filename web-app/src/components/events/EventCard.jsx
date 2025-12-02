import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isPast, isWithinInterval } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import DivisionBadge from "../shared/DivisionBadge";

export default function EventCard({ event, attendanceCount, onClick }) {
  const startDate = new Date(event.dateTimeStart);
  const endDate = new Date(event.dateTimeEnd);
  const now = new Date();
  
  const isHappening = isWithinInterval(now, { start: startDate, end: endDate });
  const isPastEvent = isPast(endDate);
  const isTodayEvent = isToday(startDate);
  const isTomorrowEvent = isTomorrow(startDate);

  const getDateLabel = () => {
    if (isHappening) return "Happening Now";
    if (isTodayEvent) return "Today";
    if (isTomorrowEvent) return "Tomorrow";
    return format(startDate, "MMM d, yyyy");
  };

  const eventTypeColors = {
    "General Meeting": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Shop Session": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Testing": "bg-green-500/20 text-green-400 border-green-500/30",
    "Outreach": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Competition Prep": "bg-red-500/20 text-red-400 border-red-500/30",
    "Training": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Other": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <Card
      className={`bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer overflow-hidden ${
        isHappening ? 'ring-2 ring-green-500/50' : ''
      } ${isPastEvent ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isHappening && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
              <h3 className="font-semibold text-white truncate">{event.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <DivisionBadge division={event.division} size="sm" />
              <Badge variant="outline" className={`${eventTypeColors[event.eventType] || eventTypeColors.Other} text-xs`}>
                {event.eventType}
              </Badge>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-sm font-medium ${isHappening ? 'text-green-400' : isTodayEvent ? 'text-cyan-400' : 'text-slate-300'}`}>
              {getDateLabel()}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {attendanceCount !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>{attendanceCount} attending</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-slate-500 mt-3 line-clamp-2">{event.description}</p>
        )}
      </div>
    </Card>
  );
}