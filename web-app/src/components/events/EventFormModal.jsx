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
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { sendEventNotification } from "../utils/sendNotifications";

const EVENT_TYPES = ["General Meeting", "Shop Session", "Testing", "Outreach", "Competition Prep", "Training", "Other"];
const LOCATIONS = ["UAS Room", "Hangar", "Shop", "Classroom", "Virtual", "Other"];

export default function EventFormModal({ open, onClose, event }) {
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('lastName', 500),
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dateTimeStart: "",
    dateTimeEnd: "",
    location: "",
    division: "Joint",
    eventType: "General Meeting",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        dateTimeStart: event.dateTimeStart?.slice(0, 16) || "",
        dateTimeEnd: event.dateTimeEnd?.slice(0, 16) || "",
        location: event.location || "",
        division: event.division || "Joint",
        eventType: event.eventType || "General Meeting",
      });
    } else {
      const now = new Date();
      const start = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      setFormData({
        title: "",
        description: "",
        dateTimeStart: start.toISOString().slice(0, 16),
        dateTimeEnd: end.toISOString().slice(0, 16),
        location: "",
        division: "Joint",
        eventType: "General Meeting",
      });
    }
  }, [event, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return base44.entities.Event.update(event.id, data);
      }
      return base44.entities.Event.create(data);
    },
    onSuccess: async (result, data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Send email notifications
      try {
        await sendEventNotification(data, members, isEditing);
      } catch (err) {
        console.error('Failed to send notifications:', err);
      }
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Event.delete(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="e.g., Weekly Team Meeting"
              required
            />
          </div>

          <div>
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1 h-20"
              placeholder="Optional event details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Start</Label>
              <Input
                type="datetime-local"
                value={formData.dateTimeStart}
                onChange={(e) => setFormData({ ...formData, dateTimeStart: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">End</Label>
              <Input
                type="datetime-local"
                value={formData.dateTimeEnd}
                onChange={(e) => setFormData({ ...formData, dateTimeEnd: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
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
                  <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP Rover</SelectItem>
                  <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC Rover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Location</Label>
            <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc} className="text-white hover:bg-slate-700">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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