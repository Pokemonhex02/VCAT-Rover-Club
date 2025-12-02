import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import DivisionBadge from "../shared/DivisionBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function UpcomingEventsCard({ events, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 bg-slate-800" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events?.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No upcoming events</p>
        ) : (
          events?.slice(0, 3).map((event) => (
            <Link
              key={event.id}
              to={createPageUrl("Events")}
              className="block p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all duration-200 border border-slate-700/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{event.title}</h4>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(event.dateTimeStart), "MMM d, h:mm a")}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                <DivisionBadge division={event.division} size="sm" />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}