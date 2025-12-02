import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Calendar } from "lucide-react";
import { format } from "date-fns";
import DivisionBadge from "../shared/DivisionBadge";
import PriorityBadge from "../shared/PriorityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function MyTasksCard({ tasks, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            <ClipboardList className="w-5 h-5 text-orange-400" />
            My Tasks
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

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          <ClipboardList className="w-5 h-5 text-orange-400" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks?.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No tasks assigned</p>
        ) : (
          tasks?.slice(0, 4).map((task) => (
            <Link
              key={task.id}
              to={createPageUrl(task.division === "RC" ? "TasksRC" : "TasksHP")}
              className="block p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all duration-200 border border-slate-700/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <DivisionBadge division={task.division} size="sm" />
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}