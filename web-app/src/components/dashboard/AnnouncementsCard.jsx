import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Pin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function AnnouncementsCard({ announcements, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            <Megaphone className="w-5 h-5 text-purple-400" />
            Latest Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 bg-slate-800" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          <Megaphone className="w-5 h-5 text-purple-400" />
          Latest Announcements
        </CardTitle>
        <Link to={createPageUrl("Announcements")} className="text-sm text-cyan-400 hover:text-cyan-300">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements?.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No announcements</p>
        ) : (
          announcements?.slice(0, 3).map((announcement) => (
            <div
              key={announcement.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                announcement.important
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {announcement.important && (
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                )}
                {announcement.pinned && !announcement.important && (
                  <Pin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white">{announcement.title}</h4>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{announcement.message}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {format(new Date(announcement.created_date), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}