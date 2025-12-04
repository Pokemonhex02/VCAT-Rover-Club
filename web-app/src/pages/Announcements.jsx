import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Megaphone, Plus, Pin, AlertCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

export default function Announcements() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    pinned: false,
    important: false,
    visibility: "Members Only",
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

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 100),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        authorName: `${memberProfile?.firstName || ''} ${memberProfile?.lastName || ''}`.trim() || user?.full_name,
      };
      if (editingAnnouncement) {
        return base44.entities.Announcement.update(editingAnnouncement.id, payload);
      }
      return base44.entities.Announcement.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowForm(false);
      setEditingAnnouncement(null);
      setFormData({
        title: "",
        message: "",
        pinned: false,
        important: false,
        visibility: "Members Only",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      pinned: announcement.pinned || false,
      important: announcement.important || false,
      visibility: announcement.visibility || "Members Only",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Sort announcements: pinned first, then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

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
        title="Announcements"
        description="Stay updated with the latest team news"
        actions={
          isAdmin && (
            <Button
              onClick={() => { setEditingAnnouncement(null); setFormData({ title: "", message: "", pinned: false, important: false, visibility: "Members Only" }); setShowForm(true); }}
              className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" /> New Announcement
            </Button>
          )
        }
      />

      {sortedAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description={isAdmin ? "Create your first announcement" : "Announcements will appear here"}
          actionLabel={isAdmin ? "New Announcement" : undefined}
          onAction={isAdmin ? () => setShowForm(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {sortedAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`border transition-all ${
                announcement.important
                  ? "bg-orange-500/10 border-orange-500/30"
                  : announcement.pinned
                  ? "bg-cyan-500/10 border-cyan-500/30"
                  : "bg-slate-900/50 border-slate-800"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.important && (
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                      )}
                      {announcement.pinned && !announcement.important && (
                        <Pin className="w-4 h-4 text-cyan-400" />
                      )}
                      <h3 className="font-semibold text-lg text-white">{announcement.title}</h3>
                    </div>
                    
                    <p className="text-slate-300 whitespace-pre-wrap mb-4">{announcement.message}</p>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>By {announcement.authorName}</span>
                      <span>•</span>
                      <span>{format(new Date(announcement.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
                      <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                        {announcement.visibility}
                      </Badge>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingAnnouncement(null); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Announcement title"
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1 h-32"
                placeholder="Write your announcement..."
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Visibility</Label>
              <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Everyone" className="text-white hover:bg-slate-700">Everyone</SelectItem>
                  <SelectItem value="Members Only" className="text-white hover:bg-slate-700">Members Only</SelectItem>
                  <SelectItem value="Admins Only" className="text-white hover:bg-slate-700">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="pinned"
                  checked={formData.pinned}
                  onCheckedChange={(v) => setFormData({ ...formData, pinned: v })}
                />
                <Label htmlFor="pinned" className="text-slate-300 cursor-pointer">Pin to top</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="important"
                  checked={formData.important}
                  onCheckedChange={(v) => setFormData({ ...formData, important: v })}
                />
                <Label htmlFor="important" className="text-slate-300 cursor-pointer">Mark as important</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setEditingAnnouncement(null); }}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAnnouncement ? "Save" : "Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}