import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Users,
  UserCheck,
  UserX,
  Download,
  Search,
  Loader2,
  Shield,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import DivisionBadge from "../components/shared/DivisionBadge";
import StatusBadge from "../components/shared/StatusBadge";

const SUB_TEAMS = [
  "Chassis & Frame",
  "Suspension & Wheels",
  "Drivetrain & Power",
  "Controls & Electronics",
  "Software & Autonomy",
  "Safety & Testing",
  "Business & Outreach",
];

const ROLES = [
  "Team Member",
  "Lead",
  "Co-Lead",
  "Project Manager",
  "Treasurer",
  "Secretary",
  "Safety Officer",
  "Mentor",
];

export default function Admin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const { data: members = [], isLoading } = useQuery({
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

  const updateMember = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Member.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setEditingMember(null);
    },
  });

  const deleteMember = useMutation({
    mutationFn: (id) => base44.entities.Member.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setDeletingMember(null);
    },
  });

  const pendingApprovals = members.filter(m => !m.isApproved && m.status === "Prospective");
  const approvedMembers = members.filter(m => m.isApproved || m.status === "Active" || m.status === "Alumni");

  const filteredMembers = approvedMembers.filter(m =>
    !search ||
    m.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    m.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = (member) => {
    updateMember.mutate({
      id: member.id,
      data: { isApproved: true, status: "Active" },
    });
  };

  const handleReject = (member) => {
    deleteMember.mutate(member.id);
  };

  const exportMembers = () => {
    const headers = ["Name", "Email", "Phone", "Major", "Grad Year", "Status", "Division", "Sub-Teams", "Roles", "Admin", "Joined"];
    const rows = members.map(m => [
      `${m.firstName} ${m.lastName}`,
      m.email,
      m.phone || "",
      m.major || "",
      m.graduationYear || "",
      m.status,
      m.division,
      (m.subTeams || []).join("; "),
      (m.roles || []).join("; "),
      m.isAdmin ? "Yes" : "No",
      m.joinedDate || "",
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportAttendance = () => {
    const headers = ["Date", "Member", "Event", "Status", "Hours", "Notes"];
    const rows = attendanceRecords.map(r => [
      format(new Date(r.created_date), "yyyy-MM-dd"),
      r.memberName,
      r.eventTitle,
      r.status,
      r.hours,
      r.notes || "",
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportHours = () => {
    const headers = ["Date", "Member", "Category", "Division", "Hours", "Task", "Notes"];
    const rows = timeLogs.map(l => [
      l.date,
      l.memberName,
      l.category,
      l.division,
      l.hours,
      l.taskTitle || "",
      l.notes || "",
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hours_${format(new Date(), "yyyy-MM-dd")}.csv`;
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
        title="Admin Panel"
        description="Manage members, approvals, and exports"
      />

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="approvals" className="data-[state=active]:bg-slate-700">
            <UserCheck className="w-4 h-4 mr-2" />
            Approvals
            {pendingApprovals.length > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white">{pendingApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-slate-700">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="exports" className="data-[state=active]:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Exports
          </TabsTrigger>
        </TabsList>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div>
                        <h4 className="font-medium text-white">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="text-sm text-slate-400">{member.email}</p>
                        <div className="flex gap-2 mt-2">
                          {member.division && <DivisionBadge division={member.division} size="sm" />}
                          {member.major && (
                            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                              {member.major}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReject(member)}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          disabled={deleteMember.isPending}
                        >
                          <UserX className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          onClick={() => handleApprove(member)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={updateMember.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">All Members ({filteredMembers.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white pl-10"
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Division</TableHead>
                    <TableHead className="text-slate-400">Roles</TableHead>
                    <TableHead className="text-slate-400">Admin</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="border-slate-800">
                      <TableCell className="text-white font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell className="text-slate-300">{member.email}</TableCell>
                      <TableCell><StatusBadge status={member.status} type="member" /></TableCell>
                      <TableCell><DivisionBadge division={member.division} size="sm" /></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-32">
                          {member.roles?.slice(0, 2).map((role) => (
                            <Badge key={role} variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                              {role}
                            </Badge>
                          ))}
                          {member.roles?.length > 2 && (
                            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                              +{member.roles.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.isAdmin ? (
                          <Shield className="w-4 h-4 text-orange-400" />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMember(member)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingMember(member)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                  <h3 className="font-semibold text-white mb-2">Member List</h3>
                  <p className="text-sm text-slate-400 mb-4">Export all member information</p>
                  <Button onClick={exportMembers} className="w-full bg-slate-800 hover:bg-slate-700">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="font-semibold text-white mb-2">Attendance Records</h3>
                  <p className="text-sm text-slate-400 mb-4">Export all attendance data</p>
                  <Button onClick={exportAttendance} className="w-full bg-slate-800 hover:bg-slate-700">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                  <h3 className="font-semibold text-white mb-2">Hours Logs</h3>
                  <p className="text-sm text-slate-400 mb-4">Export all time tracking data</p>
                  <Button onClick={exportHours} className="w-full bg-slate-800 hover:bg-slate-700">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Member Modal */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Edit Member: {editingMember.firstName} {editingMember.lastName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select
                  value={editingMember.status}
                  onValueChange={(v) => setEditingMember({ ...editingMember, status: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Active" className="text-green-400 hover:bg-slate-700">Active</SelectItem>
                    <SelectItem value="Alumni" className="text-purple-400 hover:bg-slate-700">Alumni</SelectItem>
                    <SelectItem value="Prospective" className="text-yellow-400 hover:bg-slate-700">Prospective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Division</Label>
                <Select
                  value={editingMember.division}
                  onValueChange={(v) => setEditingMember({ ...editingMember, division: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="None" className="text-white hover:bg-slate-700">None</SelectItem>
                    <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP</SelectItem>
                    <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC</SelectItem>
                    <SelectItem value="Both" className="text-purple-400 hover:bg-slate-700">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Sub-Teams</Label>
                <div className="flex flex-wrap gap-2">
                  {SUB_TEAMS.map((team) => (
                    <Badge
                      key={team}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        editingMember.subTeams?.includes(team)
                          ? "bg-cyan-500/30 text-cyan-300 border-cyan-500/50"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                      onClick={() => {
                        const subTeams = editingMember.subTeams || [];
                        setEditingMember({
                          ...editingMember,
                          subTeams: subTeams.includes(team)
                            ? subTeams.filter((t) => t !== team)
                            : [...subTeams, team],
                        });
                      }}
                    >
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        editingMember.roles?.includes(role)
                          ? "bg-orange-500/30 text-orange-300 border-orange-500/50"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                      onClick={() => {
                        const roles = editingMember.roles || [];
                        setEditingMember({
                          ...editingMember,
                          roles: roles.includes(role)
                            ? roles.filter((r) => r !== role)
                            : [...roles, role],
                        });
                      }}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="isAdmin"
                  checked={editingMember.isAdmin || false}
                  onCheckedChange={(v) => setEditingMember({ ...editingMember, isAdmin: v })}
                />
                <Label htmlFor="isAdmin" className="text-slate-300 cursor-pointer flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  Administrator Access
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateMember.mutate({ id: editingMember.id, data: editingMember })}
                  disabled={updateMember.isPending}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
                >
                  {updateMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove {deletingMember?.firstName} {deletingMember?.lastName} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMember.mutate(deletingMember.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}