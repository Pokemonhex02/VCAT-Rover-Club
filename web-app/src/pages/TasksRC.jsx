import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Zap, Loader2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import KanbanBoard from "../components/tasks/KanbanBoard";
import TaskFormModal from "../components/tasks/TaskFormModal";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import EmptyState from "../components/shared/EmptyState";

const SUB_TEAMS = [
  "All Sub-Teams",
  "Chassis & Frame",
  "Suspension & Wheels",
  "Drivetrain & Power",
  "Controls & Electronics",
  "Software & Autonomy",
  "Safety & Testing",
  "Business & Outreach",
];

export default function TasksRC() {
  const [search, setSearch] = useState("");
  const [subTeamFilter, setSubTeamFilter] = useState("All Sub-Teams");
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.division !== "RC" && task.division !== "Both") return false;
      
      const matchesSearch = !search || 
        task.title?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesSubTeam = subTeamFilter === "All Sub-Teams" || task.subTeam === subTeamFilter;
      
      return matchesSearch && matchesSubTeam;
    });
  }, [tasks, search, subTeamFilter]);

  const handleEditTask = (task) => {
    setSelectedTask(null);
    setEditingTask(task);
    setShowForm(true);
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
        title={
          <span className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            RC Rover Tasks
          </span>
        }
        description="Remote-Controlled Rover project board"
        actions={
          isAdmin && (
            <Button
              onClick={() => { setEditingTask(null); setShowForm(true); }}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white pl-10"
          />
        </div>
        <Select value={subTeamFilter} onValueChange={setSubTeamFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-full sm:w-48">
            <SelectValue />
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

      {/* Kanban Board */}
      {filteredTasks.length === 0 && search === "" && subTeamFilter === "All Sub-Teams" ? (
        <EmptyState
          icon={Zap}
          title="No RC Rover tasks yet"
          description={isAdmin ? "Create a task to get your team started" : "Tasks will appear here once created"}
          actionLabel={isAdmin ? "Add Task" : undefined}
          onAction={isAdmin ? () => setShowForm(true) : undefined}
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          onAddTask={() => { setEditingTask(null); setShowForm(true); }}
          isAdmin={isAdmin}
        />
      )}

      {/* Modals */}
      <TaskFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        task={editingTask}
        division="RC"
      />

      <TaskDetailModal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        isAdmin={isAdmin}
        onEdit={handleEditTask}
      />
    </div>
  );
}