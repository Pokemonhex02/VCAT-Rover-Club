import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { startOfWeek, startOfMonth, isAfter, isBefore, isWithinInterval } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import UpcomingEventsCard from "../components/dashboard/UpcomingEventsCard";
import MyTasksCard from "../components/dashboard/MyTasksCard";
import HoursCard from "../components/dashboard/HoursCard";
import AnnouncementsCard from "../components/dashboard/AnnouncementsCard";
import MilestonesCard from "../components/dashboard/MilestonesCard";
import QuickActions from "../components/dashboard/QuickActions";
import LogHoursModal from "../components/modals/LogHoursModal";
import CheckInModal from "../components/modals/CheckInModal";

export default function Dashboard() {
  const [logHoursOpen, setLogHoursOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: memberProfile, isLoading: memberLoading } = useQuery({
    queryKey: ['memberProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const members = await base44.entities.Member.filter({ email: user.email });
      return members[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('dateTimeStart', 50),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: timeLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['myTimeLogs', memberProfile?.id],
    queryFn: () => base44.entities.TimeLog.filter({ memberId: memberProfile.id }),
    enabled: !!memberProfile?.id,
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 10),
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list('dueDate', 50),
  });

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => isAfter(new Date(e.dateTimeStart), now))
      .slice(0, 3);
  }, [events]);

  const currentEvent = useMemo(() => {
    const now = new Date();
    return events.find((e) =>
      isWithinInterval(now, {
        start: new Date(e.dateTimeStart),
        end: new Date(e.dateTimeEnd),
      })
    );
  }, [events]);

  const myTasks = useMemo(() => {
    if (!memberProfile?.id) return [];
    return tasks
      .filter((t) => t.assigneeIds?.includes(memberProfile.id) && t.status !== "Done")
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
  }, [tasks, memberProfile]);

  const { weekHours, semesterHours } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const semesterStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 8, 1));

    let weekTotal = 0;
    let semesterTotal = 0;

    timeLogs.forEach((log) => {
      const logDate = new Date(log.date);
      if (isAfter(logDate, weekStart)) {
        weekTotal += log.hours || 0;
      }
      if (isAfter(logDate, semesterStart)) {
        semesterTotal += log.hours || 0;
      }
    });

    return { weekHours: weekTotal, semesterHours: semesterTotal };
  }, [timeLogs]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${memberProfile?.firstName || user?.full_name?.split(' ')[0] || 'Member'}!`}
        description="Here's what's happening with the rover team"
      />

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions
          currentEvent={currentEvent}
          onLogHours={() => setLogHoursOpen(true)}
          onCheckIn={() => setCheckInOpen(true)}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEventsCard events={upcomingEvents} isLoading={eventsLoading} />
        <MyTasksCard tasks={myTasks} isLoading={tasksLoading} />
        <MilestonesCard milestones={milestones} isLoading={milestonesLoading} />
        <HoursCard weekHours={weekHours} semesterHours={semesterHours} isLoading={logsLoading} />
        <AnnouncementsCard announcements={announcements} isLoading={announcementsLoading} />
      </div>

      {/* Modals */}
      {memberProfile && (
        <>
          <LogHoursModal
            open={logHoursOpen}
            onClose={() => setLogHoursOpen(false)}
            member={memberProfile}
            tasks={myTasks}
          />
          <CheckInModal
            open={checkInOpen}
            onClose={() => setCheckInOpen(false)}
            event={currentEvent}
            member={memberProfile}
          />
        </>
      )}
    </div>
  );
}