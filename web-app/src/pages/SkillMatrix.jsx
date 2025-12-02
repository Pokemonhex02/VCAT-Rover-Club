import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/shared/PageHeader";

const TRAINING_ITEMS = [
  "Machine Shop Safety",
  "Welding Intro",
  "Electronics Lab Safety",
  "SolidWorks Basics",
  "ROS2 Basics",
  "3D Printer Training",
  "CNC Operation",
  "Composites Safety",
];

export default function SkillMatrix() {
  const [search, setSearch] = useState("");

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

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('lastName', 500),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (!m.isApproved && m.status !== 'Active') return false;
      if (!search) return true;
      return (
        m.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        m.lastName?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [members, search]);

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Division", ...TRAINING_ITEMS];
    const rows = filteredMembers.map(m => [
      `${m.firstName} ${m.lastName}`,
      m.email,
      m.division,
      ...TRAINING_ITEMS.map(t => (m.trainingsCompleted || []).includes(t) ? "Yes" : "No"),
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skill_matrix_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Summary stats
  const trainingStats = useMemo(() => {
    return TRAINING_ITEMS.map(training => ({
      name: training,
      count: filteredMembers.filter(m => (m.trainingsCompleted || []).includes(training)).length,
    }));
  }, [filteredMembers]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Admin access required</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Skill Matrix"
        description="Training and certification status for all members"
        actions={
          <Button
            onClick={exportToCSV}
            className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {trainingStats.slice(0, 4).map((stat) => (
          <Card key={stat.name} className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-400 truncate">{stat.name}</p>
              <p className="text-2xl font-bold text-white">{stat.count}<span className="text-sm text-slate-500">/{filteredMembers.length}</span></p>
            </CardContent>
          </Card>
        ))}
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

      {/* Matrix Table */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400 sticky left-0 bg-slate-900 z-10">Member</TableHead>
                <TableHead className="text-slate-400">Division</TableHead>
                {TRAINING_ITEMS.map((training) => (
                  <TableHead key={training} className="text-slate-400 text-center min-w-24">
                    <span className="text-xs">{training}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id} className="border-slate-800">
                  <TableCell className="text-white font-medium sticky left-0 bg-slate-900 z-10">
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell className="text-slate-300">{member.division}</TableCell>
                  {TRAINING_ITEMS.map((training) => {
                    const hasTraining = (member.trainingsCompleted || []).includes(training);
                    return (
                      <TableCell key={training} className="text-center">
                        {hasTraining ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}