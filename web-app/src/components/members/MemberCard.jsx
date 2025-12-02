import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DivisionBadge from "../shared/DivisionBadge";
import StatusBadge from "../shared/StatusBadge";
import { Mail, Phone, GraduationCap } from "lucide-react";

export default function MemberCard({ member, onClick }) {
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Card
      className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 flex-shrink-0">
            <AvatarImage src={member.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-cyan-500 text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white truncate">
                  {member.firstName} {member.lastName}
                </h3>
                {member.major && (
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                    <GraduationCap className="w-3 h-3" />
                    {member.major} '{member.graduationYear?.toString().slice(-2)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <DivisionBadge division={member.division} size="sm" />
                <StatusBadge status={member.status} type="member" />
              </div>
            </div>

            {member.roles?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {member.roles.slice(0, 2).map((role) => (
                  <Badge
                    key={role}
                    variant="outline"
                    className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs"
                  >
                    {role}
                  </Badge>
                ))}
                {member.roles.length > 2 && (
                  <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                    +{member.roles.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {member.subTeams?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {member.subTeams.slice(0, 2).map((team) => (
                  <Badge
                    key={team}
                    variant="outline"
                    className="bg-slate-800 text-slate-300 border-slate-700 text-xs"
                  >
                    {team}
                  </Badge>
                ))}
                {member.subTeams.length > 2 && (
                  <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                    +{member.subTeams.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}