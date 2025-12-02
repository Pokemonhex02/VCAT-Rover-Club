import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Loader2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import MemberCard from "../components/members/MemberCard";
import MemberDetailModal from "../components/members/MemberDetailModal";
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

export default function Members() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subTeamFilter, setSubTeamFilter] = useState("All Sub-Teams");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('lastName', 500),
  });

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (!member.isApproved && member.status !== 'Active') return false;
      
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        member.firstName?.toLowerCase().includes(searchLower) ||
        member.lastName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.skills?.some(s => s.toLowerCase().includes(searchLower));

      const matchesDivision = divisionFilter === "All" || 
        member.division === divisionFilter ||
        (divisionFilter !== "None" && member.division === "Both");

      const matchesStatus = statusFilter === "All" || member.status === statusFilter;

      const matchesSubTeam = subTeamFilter === "All Sub-Teams" ||
        member.subTeams?.includes(subTeamFilter);

      return matchesSearch && matchesDivision && matchesStatus && matchesSubTeam;
    });
  }, [members, search, divisionFilter, statusFilter, subTeamFilter]);

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
        title="Members Directory"
        description={`${filteredMembers.length} members`}
      />

      {/* Filters */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white pl-10"
            />
          </div>

          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="All" className="text-white hover:bg-slate-700">All Divisions</SelectItem>
              <SelectItem value="HP" className="text-orange-400 hover:bg-slate-700">HP Rover</SelectItem>
              <SelectItem value="RC" className="text-cyan-400 hover:bg-slate-700">RC Rover</SelectItem>
              <SelectItem value="Both" className="text-purple-400 hover:bg-slate-700">Both</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="All" className="text-white hover:bg-slate-700">All Status</SelectItem>
              <SelectItem value="Active" className="text-green-400 hover:bg-slate-700">Active</SelectItem>
              <SelectItem value="Alumni" className="text-purple-400 hover:bg-slate-700">Alumni</SelectItem>
              <SelectItem value="Prospective" className="text-yellow-400 hover:bg-slate-700">Prospective</SelectItem>
            </SelectContent>
          </Select>

          <Select value={subTeamFilter} onValueChange={setSubTeamFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Sub-Team" />
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
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try adjusting your filters or search terms"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={() => setSelectedMember(member)}
            />
          ))}
        </div>
      )}

      {/* Member Detail Modal */}
      <MemberDetailModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </div>
  );
}