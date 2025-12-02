import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Clock,
  Megaphone,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Rocket,
  Zap,
  Flag,
  Grid3X3,
  Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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

  const isAdmin = memberProfile?.isAdmin || user?.role === 'admin';

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Members", icon: Users, page: "Members" },
    { name: "Events", icon: Calendar, page: "Events" },
    { name: "HERC Timeline", icon: Flag, page: "HERCTimeline" },
    { name: "Tasks – HP", icon: Rocket, page: "TasksHP", accent: "text-orange-400" },
    { name: "Tasks – RC", icon: Zap, page: "TasksRC", accent: "text-cyan-400" },
    { name: "Hours", icon: Clock, page: "Hours" },
    { name: "Announcements", icon: Megaphone, page: "Announcements" },
  ];

  if (isAdmin) {
    navItems.push({ name: "Skill Matrix", icon: Grid3X3, page: "SkillMatrix" });
    navItems.push({ name: "Eligibility", icon: Plane, page: "Eligibility" });
    navItems.push({ name: "Admin", icon: Settings, page: "Admin" });
  }

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = () => {
    if (memberProfile) {
      return `${memberProfile.firstName?.[0] || ''}${memberProfile.lastName?.[0] || ''}`.toUpperCase();
    }
    return user?.full_name?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        :root {
          --hp-color: #f97316;
          --rc-color: #22d3ee;
          --hp-bg: rgba(249, 115, 22, 0.1);
          --rc-bg: rgba(34, 211, 238, 0.1);
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">VCAT Rover</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={memberProfile?.avatarUrl} />
                  <AvatarFallback className="bg-slate-700 text-white text-sm">{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))} className="text-white hover:bg-slate-800">
                <User className="w-4 h-4 mr-2" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-slate-800">
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-slate-900/95 backdrop-blur-lg border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">VCAT Rover</h1>
                <p className="text-xs text-slate-400">Member Hub</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-orange-500/20 to-cyan-500/20 text-white border border-slate-700' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${item.accent || ''}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={memberProfile?.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-cyan-500 text-white">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium truncate">{memberProfile ? `${memberProfile.firstName} ${memberProfile.lastName}` : user?.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{memberProfile?.division || 'Member'}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
                <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))} className="text-white hover:bg-slate-800">
                  <User className="w-4 h-4 mr-2" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-slate-800">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}