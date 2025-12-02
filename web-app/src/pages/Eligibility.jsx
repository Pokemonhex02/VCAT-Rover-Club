import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Search, Loader2, CheckCircle, AlertTriangle, XCircle, Plane, Settings } from "lucide-react";
import { format, startOfMonth, isAfter } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import DivisionBadge from "../components/shared/DivisionBadge";

export default function Eligibility() {
  const [search, setSearch] = useState("");
  const [minHours, setMinHours] = useState(20);
  const [minMeetings, setMinMeetings] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: memberProfile } = useQuery({
    queryKey: ['memberProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const members = await base44.entities.Member.filter({ email: user.email });
      return members[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('lastName', 500),
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['allTimeLogs'],
    queryFn: () => base44.entities.TimeLog.list('-date', 5000),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['allAttendance'],
    queryFn: () => base44.entities.AttendanceRecord.list('-created_date', 5000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  // Calculate semester start
  const now = new Date();
  const semesterStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 8, 1));

  const eligibilityData = useMemo(() => {
    const activeMembers = members.filter(m => m.status === "Active" && m.isApproved);
    
    return activeMembers.map(member => {
      // Calculate hours this semester
      const memberHours = timeLogs
        .filter(l => l.memberId === member.id && isAfter(new Date(l.date), semesterStart))
        .reduce((sum, l) => sum + (l.hours || 0), 0);

      // Count meetings attended
      const memberMeetings = attendanceRecords
        .filter(r => r.memberId === member.id && (r.status === "Present" || r.status === "Late"))
        .length;

      // Check for completed tasks
      const completedTasks = tasks.filter(t => 
        t.status === "Done" && t.assigneeIds?.includes(member.id)
      ).length;

      const requirements = [];
      if (memberHours < minHours) requirements.push(`Needs ${(minHours - memberHours).toFixed(1)} more hours`);
      if (memberMeetings < minMeetings) requirements.push(`Needs ${minMeetings - memberMeetings} more meetings`);
      if (completedTasks < 1) requirements.push("No completed tasks");

      let status;
      if (requirements.length === 0) {
        status = "Eligible";
      } else if (requirements.length <= 1) {
        status = "At Risk";
      } else {
        status = "Not Eligible";
      }

      return {
        ...member,
        memberHours,
        memberMeetings,
        completedTasks,
        requirements,
        eligibilityStatus: status,
      };
    });
  }, [members, timeLogs, attendanceRecords, tasks, minHours, minMeetings, semesterStart]);

  const filteredData = useMemo(() => {
    if (!search) return eligibilityData;
    return eligibilityData.filter(m =>
      m.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      m.lastName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [eligibilityData, search]);

  const stats = useMemo(() => ({
    eligible: filteredData.filter(m => m.eligibilityStatus === "Eligible").length,
    atRisk: filteredData.filter(m => m.eligibilityStatus === "At Risk").length,
    notEligible: filteredData.filter(m => m.eligibilityStatus === "Not Eligible").length,
  }), [filteredData]);

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Division", "Status", "Hours", "Meetings", "Completed Tasks", "Missing Requirements"];
    const rows = filteredData.map(m => [
      `${m.firstName} ${m.lastName}`,
      m.email,
      m.division,
      m.eligibilityStatus,
      m.memberHours.toFixed(1),
      m.memberMeetings,
      m.completedTasks,
      m.requirements.join("; "),
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eligibility_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const statusConfig = {
    Eligible: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
    "At Risk": { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
    "Not Eligible": { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Admin access required</p>
      </div>
    );
  }

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          title="Travel Eligibility"
          description="Member readiness for NASA HERC competition travel"
          actions={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Settings className="w-4 h-4 mr-2" /> Thresholds
              </Button>
              <Button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          }
        />

        {/* Settings Panel */}
        {showSettings && (
          <Card className="bg-slate-900/50 border-slate-800 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <div>
                  <Label className="text-slate-300">Minimum Hours</Label>
                  <Input
                    type="number"
                    value={minHours}
                    onChange={(e) => setMinHours(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Minimum Meetings</Label>
                  <Input
                    type="number"
                    value={minMeetings}
                    onChange={(e) => setMinMeetings(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-400">Eligible</p>
                <p className="text-2xl font-bold text-white">{stats.eligible}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-yellow-400">At Risk</p>
                <p className="text-2xl font-bold text-white">{stats.atRisk}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-red-400">Not Eligible</p>
                <p className="text-2xl font-bold text-white">{stats.notEligible}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-xs mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white pl-10"
          />
        </div>

        {/* Eligibility Table */}
        <Card className="bg-slate-900/50 border-slate-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Member</TableHead>
                  <TableHead className="text-slate-400">Division</TableHead>
                  <TableHead className="text-slate-400 text-center">Hours</TableHead>
                  <TableHead className="text-slate-400 text-center">Meetings</TableHead>
                  <TableHead className="text-slate-400 text-center">Tasks Done</TableHead>
                  <TableHead className="text-slate-400 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((member) => {
                  const StatusIcon = statusConfig[member.eligibilityStatus].icon;
                  return (
                    <TableRow key={member.id} className="border-slate-800">
                      <TableCell className="text-white font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell><DivisionBadge division={member.division} size="sm" /></TableCell>
                      <TableCell className={`text-center ${member.memberHours >= minHours ? 'text-green-400' : 'text-red-400'}`}>
                        {member.memberHours.toFixed(1)}
                      </TableCell>
                      <TableCell className={`text-center ${member.memberMeetings >= minMeetings ? 'text-green-400' : 'text-red-400'}`}>
                        {member.memberMeetings}
                      </TableCell>
                      <TableCell className={`text-center ${member.completedTasks >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                        {member.completedTasks}
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className={`${statusConfig[member.eligibilityStatus].color} cursor-help`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {member.eligibilityStatus}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                            {member.requirements.length === 0 ? (
                              <p>All requirements met!</p>
                            ) : (
                              <ul className="list-disc list-inside text-sm">
                                {member.requirements.map((req, i) => (
                                  <li key={i}>{req}</li>
                                ))}
                              </ul>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}