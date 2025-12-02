import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, List, Plus, Loader2 } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import EventCard from "../components/events/EventCard";
import EventFormModal from "../components/events/EventFormModal";
import EventDetailModal from "../components/events/EventDetailModal";
import EmptyState from "../components/shared/EmptyState";

export default function Events() {
  const [view, setView] = useState("list");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('dateTimeStart', 200),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['allAttendance'],
    queryFn: () => base44.entities.AttendanceRecord.list('-created_date', 1000),
  });

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (divisionFilter === "All") return true;
      return event.division === divisionFilter || event.division === "Joint";
    });
  }, [events, divisionFilter]);

  const getAttendanceCount = (eventId) => {
    return attendanceRecords.filter(r => r.eventId === eventId && r.status !== "Absent").length;
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(null);
    setEditingEvent(event);
    setShowForm(true);
  };

  // Calendar view helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    return filteredEvents.filter(event => isSameDay(new Date(event.dateTimeStart), day));
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
        title="Events & Meetings"
        description="View upcoming events and check your attendance"
        actions={
          isAdmin && (
            <Button
              onClick={() => { setEditingEvent(null); setShowForm(true); }}
              className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          )
        }
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="list" className="data-[state=active]:bg-slate-700">
              <List className="w-4 h-4 mr-2" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-slate-700">
              <Calendar className="w-4 h-4 mr-2" /> Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={divisionFilter} onValueChange={setDivisionFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="All" className="text-white hover:bg-slate-700">All Divisions</SelectItem>
            <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP Rover</SelectItem>
            <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC Rover</SelectItem>
            <SelectItem value="Joint" className="text-purple-400 hover:bg-slate-700">Joint</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List View */}
      {view === "list" && (
        filteredEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events scheduled"
            description={isAdmin ? "Create a new event to get started" : "Check back later for upcoming events"}
            actionLabel={isAdmin ? "Add Event" : undefined}
            onAction={isAdmin ? () => setShowForm(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                attendanceCount={getAttendanceCount(event.id)}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              ← Previous
            </Button>
            <h2 className="text-lg font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button
              variant="ghost"
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Next →
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-400 border-b border-slate-800">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-2 border-b border-r border-slate-800 ${
                    !isCurrentMonth ? 'bg-slate-900/30' : ''
                  }`}
                >
                  <div className={`text-sm mb-1 ${
                    isCurrentDay 
                      ? 'w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center' 
                      : isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${
                          event.division === 'HP' 
                            ? 'bg-orange-500/20 text-orange-300' 
                            : event.division === 'RC' 
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <EventFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null); }}
        event={editingEvent}
      />

      <EventDetailModal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        isAdmin={isAdmin}
        onEdit={handleEditEvent}
        currentMember={memberProfile}
      />
    </div>
  );
}