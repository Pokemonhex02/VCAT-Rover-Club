import React from "react";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const COLUMNS = [
  { id: "Backlog", label: "Backlog", color: "border-slate-500" },
  { id: "In Progress", label: "In Progress", color: "border-blue-500" },
  { id: "Blocked", label: "Blocked", color: "border-red-500" },
  { id: "Done", label: "Done", color: "border-green-500" },
];

export default function KanbanBoard({ tasks, onTaskClick, onAddTask, isAdmin }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      return base44.entities.Task.update(taskId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateStatus.mutate({ taskId, newStatus });
    }
  };

  const getColumnTasks = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((column) => {
        const columnTasks = getColumnTasks(column.id);
        
        return (
          <div
            key={column.id}
            className="bg-slate-900/50 rounded-xl border border-slate-800 min-h-96"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={`p-4 border-b border-slate-800 border-l-4 ${column.color} rounded-tl-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{column.label}</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                {isAdmin && column.id === "Backlog" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddTask}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 h-7 w-7 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={isAdmin}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={isAdmin ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <TaskCard task={task} onClick={() => onTaskClick(task)} />
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}