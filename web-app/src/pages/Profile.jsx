import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Plus, Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import PageHeader from "../components/shared/PageHeader";

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

const SKILLS = [
  "SolidWorks",
  "Fusion 360",
  "Welding",
  "CNC",
  "3D Printing",
  "Arduino",
  "ROS2",
  "CFD",
  "Python",
  "C++",
  "JavaScript",
  "CAD",
  "Circuit Design",
  "Machining",
  "Composites",
  "Project Management",
];

const TRAININGS = [
  "Machine Shop Safety",
  "Welding Intro",
  "Electronics Lab Safety",
  "SolidWorks Basics",
  "ROS2 Basics",
  "3D Printer Training",
  "CNC Operation",
  "Composites Safety",
];

export default function Profile() {
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: memberProfile, isLoading } = useQuery({
    queryKey: ['memberProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const members = await base44.entities.Member.filter({ email: user.email });
      return members[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    major: "",
    graduationYear: new Date().getFullYear() + 2,
    division: "None",
    subTeams: [],
    roles: [],
    skills: [],
    trainingsCompleted: [],
    notes: "",
    emailNotifications: true,
  });

  useEffect(() => {
    if (memberProfile) {
      setFormData({
        firstName: memberProfile.firstName || "",
        lastName: memberProfile.lastName || "",
        email: memberProfile.email || user?.email || "",
        phone: memberProfile.phone || "",
        major: memberProfile.major || "",
        graduationYear: memberProfile.graduationYear || new Date().getFullYear() + 2,
        division: memberProfile.division || "None",
        subTeams: memberProfile.subTeams || [],
        roles: memberProfile.roles || [],
        skills: memberProfile.skills || [],
        trainingsCompleted: memberProfile.trainingsCompleted || [],
        notes: memberProfile.notes || "",
        emailNotifications: memberProfile.emailNotifications !== false,
      });
    } else if (user) {
      const nameParts = user.full_name?.split(' ') || [];
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(' ') || "",
        email: user.email || "",
      }));
    }
  }, [memberProfile, user]);

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      if (memberProfile) {
        return base44.entities.Member.update(memberProfile.id, { ...data, profileComplete: true });
      } else {
        return base44.entities.Member.create({
          ...data,
          email: user.email,
          profileComplete: true,
          isApproved: false,
          status: "Prospective",
          joinedDate: new Date().toISOString().split('T')[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const addCustomSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill],
      }));
      setNewSkill("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Manage your club membership information"
      />

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-300">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-400 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Phone (Optional)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Major / Program</Label>
                <Input
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="e.g., Mechanical Engineering"
                />
              </div>
              <div>
                <Label className="text-slate-300">Graduation Year</Label>
                <Input
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-slate-300">Division</Label>
              <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="None" className="text-white hover:bg-slate-700">None (Not yet assigned)</SelectItem>
                  <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP (Human-Powered)</SelectItem>
                  <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC (Remote-Controlled)</SelectItem>
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
                      formData.subTeams.includes(team)
                        ? "bg-cyan-500/30 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                    onClick={() => toggleArrayItem("subTeams", team)}
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
                      formData.roles.includes(role)
                        ? "bg-orange-500/30 text-orange-300 border-orange-500/50"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                    onClick={() => toggleArrayItem("roles", role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    formData.skills.includes(skill)
                      ? "bg-green-500/30 text-green-300 border-green-500/50"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  onClick={() => toggleArrayItem("skills", skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add custom skill..."
                className="bg-slate-800 border-slate-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
              />
              <Button type="button" onClick={addCustomSkill} variant="outline" className="border-slate-700 text-slate-300">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.skills.filter(s => !SKILLS.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                <span className="text-xs text-slate-400 w-full mb-1">Custom Skills:</span>
                {formData.skills.filter(s => !SKILLS.includes(s)).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="bg-green-500/30 text-green-300 border-green-500/50 cursor-pointer"
                    onClick={() => toggleArrayItem("skills", skill)}
                  >
                    {skill}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Training & Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-3">Select trainings you have completed:</p>
            <div className="flex flex-wrap gap-2">
              {TRAININGS.map((training) => (
                <Badge
                  key={training}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    formData.trainingsCompleted.includes(training)
                      ? "bg-purple-500/30 text-purple-300 border-purple-500/50"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  onClick={() => toggleArrayItem("trainingsCompleted", training)}
                >
                  {training}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.emailNotifications ? (
                  <Bell className="w-5 h-5 text-cyan-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-400">Receive emails about events, tasks, and announcements</p>
                </div>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(v) => setFormData({ ...formData, emailNotifications: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information about yourself..."
              className="bg-slate-800 border-slate-700 text-white h-24"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90 px-8"
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}