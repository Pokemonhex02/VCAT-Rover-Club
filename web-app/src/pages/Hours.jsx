import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Download, Plus, Loader2, Calendar, BarChart3 } from "lucide-react";
import { format, startOfWeek, startOfMonth, isAfter } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import LogHoursModal from "../components/modals/LogHoursModal";
import DivisionBadge from "../components/shared/DivisionBadge";
import EmptyState from "../components/shared/EmptyState";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const CATEGORIES = ["All", "Design", "Fabrication", "Testing", "Documentation", "Outreach", "Admin", "Meeting"];
const COLORS = ['#f97316', '#22d3ee', '#a855f7', '#22c55e', '#eab308', '#ec4899', '#6366f1'];

export default function Hours() {
  const [showLogHours, setShowLogHours] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [memberFilter, setMemberFilter] = useState("All");

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

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('lastName', 500),
  });

  const { data: allTimeLogs = [], isLoading } = useQuery({
    queryKey: ['allTimeLogs'],
    queryFn: () => base44.entities.TimeLog.list('-date', 2000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const myTasks = useMemo(() => {
    if (!memberProfile?.id) return [];
    return tasks.filter(t => t.assigneeIds?.includes(memberProfile.id));
  }, [tasks, memberProfile]);

  const filteredLogs = useMemo(() => {
    let logs = isAdmin ? allTimeLogs : allTimeLogs.filter(l => l.memberId === memberProfile?.id);
    
    return logs.filter(log => {
      const logDate = new Date(log.date);
      
      if (dateFrom && logDate < new Date(dateFrom)) return false;
      if (dateTo && logDate > new Date(dateTo)) return false;
      if (categoryFilter !== "All" && log.category !== categoryFilter) return false;
      if (divisionFilter !== "All" && log.division !== divisionFilter) return false;
      if (memberFilter !== "All" && log.memberId !== memberFilter) return false;
      
      return true;
    });
  }, [allTimeLogs, dateFrom, dateTo, categoryFilter, divisionFilter, memberFilter, isAdmin, memberProfile]);

  const stats = useMemo(() => {
    const byCategory = {};
    const byMember = {};
    let total = 0;

    filteredLogs.forEach(log => {
      total += log.hours || 0;
      byCategory[log.category] = (byCategory[log.category] || 0) + (log.hours || 0);
      byMember[log.memberName] = (byMember[log.memberName] || 0) + (log.hours || 0);
    });

    return {
      total,
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) })),
      byMember: Object.entries(byMember)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name: name.split(' ')[0], value: parseFloat(value.toFixed(1)) })),
    };
  }, [filteredLogs]);

  // Division breakdown stats
  const divisionStats = useMemo(() => {
    const byDivision = { HP: 0, RC: 0, Both: 0 };
    const byCategoryPerDivision = { HP: {}, RC: {}, Both: {} };

    filteredLogs.forEach(log => {
      const div = log.division || 'Both';
      byDivision[div] = (byDivision[div] || 0) + (log.hours || 0);
      byCategoryPerDivision[div][log.category] = (byCategoryPerDivision[div][log.category] || 0) + (log.hours || 0);
    });

    const divisionTotals = [
      { name: 'HP Rover', hours: parseFloat(byDivision.HP.toFixed(1)), fill: '#f97316' },
      { name: 'RC Rover', hours: parseFloat(byDivision.RC.toFixed(1)), fill: '#22d3ee' },
      { name: 'Joint/Both', hours: parseFloat(byDivision.Both.toFixed(1)), fill: '#a855f7' },
    ];

    const categories = ['Design', 'Fabrication', 'Testing', 'Documentation', 'Outreach', 'Admin', 'Meeting'];
    const stackedData = categories.map(cat => ({
      category: cat,
      HP: parseFloat((byCategoryPerDivision.HP[cat] || 0).toFixed(1)),
      RC: parseFloat((byCategoryPerDivision.RC[cat] || 0).toFixed(1)),
      Both: parseFloat((byCategoryPerDivision.Both[cat] || 0).toFixed(1)),
    }));

    return { divisionTotals, stackedData };
  }, [filteredLogs]);

  const exportDivisionSummary = () => {
    const headers = ["Division", "Total Hours"];
    const rows = divisionStats.divisionTotals.map(d => [d.name, d.hours]);
    rows.push([]);
    rows.push(["Category", "HP", "RC", "Both"]);
    divisionStats.stackedData.forEach(d => {
      rows.push([d.category, d.HP, d.RC, d.Both]);
    });
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `division_summary_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportToCSV = () => {
    const headers = ["Date", "Member", "Category", "Division", "Hours", "Task", "Notes"];
    const rows = filteredLogs.map(l => [
      l.date,
      l.memberName,
      l.category,
      l.division,
      l.hours,
      l.taskTitle || "",
      l.notes || "",
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hours_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

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
        title="Hours & Reports"
        description={isAdmin ? "View and manage all member hours" : "Track your logged hours"}
        actions={
          <div className="flex gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            )}
            <Button
              onClick={() => setShowLogHours(true)}
              className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" /> Log Hours
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Hours</p>
                <p className="text-2xl font-bold text-white">{stats.total.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Entries</p>
                <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg per Entry</p>
                <p className="text-2xl font-bold text-white">
                  {filteredLogs.length > 0 ? (stats.total / filteredLogs.length).toFixed(1) : 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800 mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Division</label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="All" className="text-white hover:bg-slate-700">All</SelectItem>
                  <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP</SelectItem>
                  <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC</SelectItem>
                  <SelectItem value="Both" className="text-purple-400 hover:bg-slate-700">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Member</label>
                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                    <SelectItem value="All" className="text-white hover:bg-slate-700">All Members</SelectItem>
                    {members.filter(m => m.isApproved).map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-white hover:bg-slate-700">
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="table" className="data-[state=active]:bg-slate-700">Table</TabsTrigger>
          <TabsTrigger value="charts" className="data-[state=active]:bg-slate-700">Charts</TabsTrigger>
          {isAdmin && <TabsTrigger value="division" className="data-[state=active]:bg-slate-700">Division Overview</TabsTrigger>}
        </TabsList>

        <TabsContent value="table">
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No hours logged"
              description="Log your first hours to start tracking"
              actionLabel="Log Hours"
              onAction={() => setShowLogHours(true)}
            />
          ) : (
            <Card className="bg-slate-900/50 border-slate-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Date</TableHead>
                      {isAdmin && <TableHead className="text-slate-400">Member</TableHead>}
                      <TableHead className="text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-400">Division</TableHead>
                      <TableHead className="text-slate-400">Hours</TableHead>
                      <TableHead className="text-slate-400">Task</TableHead>
                      <TableHead className="text-slate-400">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 100).map((log) => (
                      <TableRow key={log.id} className="border-slate-800">
                        <TableCell className="text-white">{format(new Date(log.date), "MMM d, yyyy")}</TableCell>
                        {isAdmin && <TableCell className="text-white">{log.memberName}</TableCell>}
                        <TableCell className="text-slate-300">{log.category}</TableCell>
                        <TableCell><DivisionBadge division={log.division} size="sm" /></TableCell>
                        <TableCell className="text-cyan-400 font-medium">{log.hours}h</TableCell>
                        <TableCell className="text-slate-400 max-w-32 truncate">{log.taskTitle || "—"}</TableCell>
                        <TableCell className="text-slate-500 max-w-48 truncate">{log.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Hours by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byCategory.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.byCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}h`}
                        >
                          {stats.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          labelStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Member Bar Chart */}
            {isAdmin && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Top Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.byMember.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.byMember} layout="vertical">
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis dataKey="name" type="category" stroke="#64748b" width={60} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="value" fill="url(#gradient)" radius={[0, 4, 4, 0]} />
                          <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">No data available</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="division">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={exportDivisionSummary} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Download className="w-4 h-4 mr-2" /> Export Summary
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Division Totals Bar Chart */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Hours by Division</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={divisionStats.divisionTotals}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                            {divisionStats.divisionTotals.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown Stacked Bar */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Category Breakdown by Division</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={divisionStats.stackedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="category" stroke="#64748b" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Legend />
                          <Bar dataKey="HP" stackId="a" fill="#f97316" name="HP Rover" />
                          <Bar dataKey="RC" stackId="a" fill="#22d3ee" name="RC Rover" />
                          <Bar dataKey="Both" stackId="a" fill="#a855f7" name="Joint" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Table */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Division Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                      <p className="text-2xl font-bold text-orange-400">{divisionStats.divisionTotals[0]?.hours || 0}h</p>
                      <p className="text-sm text-slate-400">HP Rover</p>
                    </div>
                    <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                      <p className="text-2xl font-bold text-cyan-400">{divisionStats.divisionTotals[1]?.hours || 0}h</p>
                      <p className="text-sm text-slate-400">RC Rover</p>
                    </div>
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                      <p className="text-2xl font-bold text-purple-400">{divisionStats.divisionTotals[2]?.hours || 0}h</p>
                      <p className="text-sm text-slate-400">Joint/Both</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Log Hours Modal */}
      {memberProfile && (
        <LogHoursModal
          open={showLogHours}
          onClose={() => setShowLogHours(false)}
          member={memberProfile}
          tasks={myTasks}
        />
      )}
    </div>
  );
}