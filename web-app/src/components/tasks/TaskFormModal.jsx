import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { sendTaskAssignmentNotification } from "../utils/sendNotifications";
import TaskAISuggestions from "./TaskAISuggestions";

const SUB_TEAMS = [
  "Chassis & Frame",
  "Suspension & Wheels",
  "Drivetrain & Power",
  "Controls & Electronics",
  "Software & Autonomy",
  "Safety & Testing",
  "Business & Outreach",
];

const PHASES = ["Concept", "Design", "Fabrication", "Integration", "Testing", "Documentation"];
const STATUSES = ["Backlog", "In Progress", "Blocked", "Done"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export default function TaskFormModal({ open, onClose, task, division }) {
  const queryClient = useQueryClient();
  const isEditing = !!task;

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.filter({ isApproved: true }),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const handleApplySuggestion = (field, value) => {
    if (field === "assignee") {
      if (!formData.assigneeIds.includes(value)) {
        setFormData(prev => ({
          ...prev,
          assigneeIds: [...prev.assigneeIds, value]
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    division: division || "Both",
    subTeam: "",
    phase: "Concept",
    status: "Backlog",
    priority: "Medium",
    assigneeIds: [],
    dueDate: "",
    estimatedHours: "",
    links: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        division: task.division || division || "Both",
        subTeam: task.subTeam || "",
        phase: task.phase || "Concept",
        status: task.status || "Backlog",
        priority: task.priority || "Medium",
        assigneeIds: task.assigneeIds || [],
        dueDate: task.dueDate || "",
        estimatedHours: task.estimatedHours || "",
        links: task.links || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        division: division || "Both",
        subTeam: "",
        phase: "Concept",
        status: "Backlog",
        priority: "Medium",
        assigneeIds: [],
        dueDate: "",
        estimatedHours: "",
        links: "",
      });
    }
  }, [task, open, division]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const assigneeNames = members
        .filter(m => data.assigneeIds.includes(m.id))
        .map(m => `${m.firstName} ${m.lastName}`);

      const payload = {
        ...data,
        assigneeNames,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      };

      if (isEditing) {
        return base44.entities.Task.update(task.id, payload);
      }
      return base44.entities.Task.create(payload);
    },
    onSuccess: async (result, data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Send notifications to newly assigned members
      if (!isEditing) {
        // New task - notify all assignees
        const assignees = members.filter(m => data.assigneeIds.includes(m.id));
        for (const assignee of assignees) {
          try {
            await sendTaskAssignmentNotification(data, assignee);
          } catch (err) {
            console.error('Failed to send task notification:', err);
          }
        }
      } else {
        // Editing - notify only newly added assignees
        const previousAssignees = task.assigneeIds || [];
        const newAssignees = data.assigneeIds.filter(id => !previousAssignees.includes(id));
        const membersToNotify = members.filter(m => newAssignees.includes(m.id));
        for (const assignee of membersToNotify) {
          try {
            await sendTaskAssignmentNotification(data, assignee);
          } catch (err) {
            console.error('Failed to send task notification:', err);
          }
        }
      }
      
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const toggleAssignee = (memberId) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(memberId)
        ? prev.assigneeIds.filter(id => id !== memberId)
        : [...prev.assigneeIds, memberId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const relevantMembers = members.filter(m => 
    m.division === formData.division || m.division === "Both" || formData.division === "Both"
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Task" : "Create Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="e.g., Design suspension system"
              required
            />
          </div>

          <div>
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1 h-20"
              placeholder="Task details..."
            />
          </div>

          {/* AI Suggestions - only show when creating new task */}
          {!isEditing && (
            <TaskAISuggestions
              title={formData.title}
              description={formData.description}
              division={formData.division}
              members={relevantMembers}
              tasks={allTasks}
              onApplySuggestion={handleApplySuggestion}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Sub-Team</Label>
              <Select value={formData.subTeam} onValueChange={(v) => setFormData({ ...formData, subTeam: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {SUB_TEAMS.map((team) => (
                    <SelectItem key={team} value={team} className="text-white hover:bg-slate-700">
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Phase</Label>
              <Select value={formData.phase} onValueChange={(v) => setFormData({ ...formData, phase: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PHASES.map((phase) => (
                    <SelectItem key={phase} value={phase} className="text-white hover:bg-slate-700">
                      {phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="text-white hover:bg-slate-700">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority} className="text-white hover:bg-slate-700">
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Estimated Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Links (URLs)</Label>
            <Input
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Assignees</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-800/50 rounded-lg border border-slate-700">
              {relevantMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    formData.assigneeIds.includes(member.id)
                      ? "bg-cyan-500/30 text-cyan-300 border-cyan-500/50"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  onClick={() => toggleAssignee(member.id)}
                >
                  {member.firstName} {member.lastName}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="mr-auto"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}