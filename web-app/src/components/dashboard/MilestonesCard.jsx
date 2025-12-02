import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import DivisionBadge from "../shared/DivisionBadge";

export default function MilestonesCard({ milestones, isLoading }) {
  const statusColors = {
    Upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "In Progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Done: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            <Flag className="w-5 h-5 text-purple-400" />
            Next Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 bg-slate-800" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filter upcoming milestones
  const upcomingMilestones = milestones
    ?.filter(m => m.status !== "Done")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          <Flag className="w-5 h-5 text-purple-400" />
          Next Milestones
        </CardTitle>
        <Link to={createPageUrl("HERCTimeline")} className="text-sm text-cyan-400 hover:text-cyan-300">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {!upcomingMilestones || upcomingMilestones.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No upcoming milestones</p>
        ) : (
          upcomingMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-white text-sm">{milestone.title}</h4>
                <Badge variant="outline" className={`${statusColors[milestone.status]} text-xs flex-shrink-0`}>
                  {milestone.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <DivisionBadge division={milestone.division} size="sm" />
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(milestone.dueDate), "MMM d")}
                </span>
                {milestone.link && (
                  <a href={milestone.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}