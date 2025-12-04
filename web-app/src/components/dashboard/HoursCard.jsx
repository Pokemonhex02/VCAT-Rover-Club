import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HoursCard({ weekHours, semesterHours, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-green-400" />
            My Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 bg-slate-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 text-green-400" />
          My Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">This Week</p>
            <p className="text-3xl font-bold text-white">{weekHours.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-1">hours logged</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">This Semester</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">{semesterHours.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-1">hours logged</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}