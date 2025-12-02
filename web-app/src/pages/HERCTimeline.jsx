import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, ExternalLink, Edit, Trash2, Loader2, Flag } from "lucide-react";
import { format, isPast, isToday, isFuture } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import DivisionBadge from "../components/shared/DivisionBadge";
import EmptyState from "../components/shared/EmptyState";

export default function HERCTimeline() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    division: "Joint",
    dueDate: "",
    status: "Upcoming",
    link: "",
  });

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

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list('dueDate', 100),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingMilestone) {
        return base44.entities.Milestone.update(editingMilestone.id, data);
      }
      return base44.entities.Milestone.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setShowForm(false);
      setEditingMilestone(null);
      setFormData({ title: "", description: "", division: "Joint", dueDate: "", status: "Upcoming", link: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Milestone.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestones'] }),
  });

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title || "",
      description: milestone.description || "",
      division: milestone.division || "Joint",
      dueDate: milestone.dueDate || "",
      status: milestone.status || "Upcoming",
      link: milestone.link || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const statusColors = {
    Upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "In Progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Done: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const getTimelineColor = (status) => {
    if (status === "Done") return "bg-green-500";
    if (status === "In Progress") return "bg-yellow-500";
    return "bg-blue-500";
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
        title="HERC Timeline"
        description="NASA Human Exploration Rover Challenge milestones"
        actions={
          isAdmin && (
            <Button
              onClick={() => { setEditingMilestone(null); setFormData({ title: "", description: "", division: "Joint", dueDate: "", status: "Upcoming", link: "" }); setShowForm(true); }}
              className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Milestone
            </Button>
          )
        }
      />

      {milestones.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No milestones yet"
          description={isAdmin ? "Add your first HERC milestone" : "Milestones will appear here"}
          actionLabel={isAdmin ? "Add Milestone" : undefined}
          onAction={isAdmin ? () => setShowForm(true) : undefined}
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-slate-700" />

          <div className="space-y-6">
            {milestones.map((milestone, index) => {
              const dueDate = new Date(milestone.dueDate);
              const isOverdue = isPast(dueDate) && milestone.status !== "Done";
              
              return (
                <div key={milestone.id} className="relative pl-12 md:pl-20">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 md:left-6 w-4 h-4 rounded-full ${getTimelineColor(milestone.status)} border-4 border-slate-950`} />
                  
                  <Card className={`bg-slate-900/50 border-slate-800 ${isOverdue ? 'border-red-500/50' : ''}`}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-lg text-white">{milestone.title}</h3>
                            <DivisionBadge division={milestone.division} size="sm" />
                            <Badge variant="outline" className={statusColors[milestone.status]}>
                              {milestone.status}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          {milestone.description && (
                            <p className="text-slate-400 mb-3">{milestone.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(dueDate, "MMMM d, yyyy")}
                            </span>
                            {milestone.link && (
                              <a
                                href={milestone.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Link
                              </a>
                            )}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(milestone)}
                              className="text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(milestone.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingMilestone(null); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingMilestone ? "Edit Milestone" : "Add Milestone"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="e.g., Design Review Submission"
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1 h-20"
                placeholder="Details about this milestone..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Division</Label>
                <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Joint" className="text-white hover:bg-slate-700">Joint</SelectItem>
                    <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP</SelectItem>
                    <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Upcoming" className="text-blue-400 hover:bg-slate-700">Upcoming</SelectItem>
                    <SelectItem value="In Progress" className="text-yellow-400 hover:bg-slate-700">In Progress</SelectItem>
                    <SelectItem value="Done" className="text-green-400 hover:bg-slate-700">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Link (Optional)</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setEditingMilestone(null); }}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingMilestone ? "Save" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}