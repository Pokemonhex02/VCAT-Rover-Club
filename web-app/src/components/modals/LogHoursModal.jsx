import React, { useState } from "react";
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
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["Design", "Fabrication", "Testing", "Documentation", "Outreach", "Admin", "Meeting"];
const DIVISIONS = ["HP", "RC", "Both"];

export default function LogHoursModal({ open, onClose, member, tasks = [] }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: "",
    category: "Design",
    division: member?.division || "Both",
    taskId: "",
    notes: "",
  });

  const createLog = useMutation({
    mutationFn: async (data) => {
      const selectedTask = tasks.find(t => t.id === data.taskId);
      return base44.entities.TimeLog.create({
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        taskId: data.taskId || null,
        taskTitle: selectedTask?.title || null,
        division: data.division,
        date: data.date,
        hours: parseFloat(data.hours),
        category: data.category,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['myTimeLogs'] });
      onClose();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        hours: "",
        category: "Design",
        division: member?.division || "Both",
        taskId: "",
        notes: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createLog.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Log Hours</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Hours</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                placeholder="e.g., 2.5"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
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
              <Label className="text-slate-300">Division</Label>
              <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {DIVISIONS.map((div) => (
                    <SelectItem key={div} value={div} className="text-white hover:bg-slate-700">
                      {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tasks.length > 0 && (
            <div>
              <Label className="text-slate-300">Related Task (Optional)</Label>
              <Select value={formData.taskId} onValueChange={(v) => setFormData({ ...formData, taskId: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={null} className="text-white hover:bg-slate-700">None</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id} className="text-white hover:bg-slate-700">
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              placeholder="What did you work on?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1 h-20"
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              disabled={createLog.isPending}
              className="flex-1 bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
            >
              {createLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Hours"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}