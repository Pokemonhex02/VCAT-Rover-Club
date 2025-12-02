import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ChevronDown, ChevronUp, User } from "lucide-react";
import debounce from "lodash/debounce";

const SUB_TEAMS = [
  "Chassis & Frame",
  "Suspension & Wheels",
  "Drivetrain & Power",
  "Controls & Electronics",
  "Software & Autonomy",
  "Safety & Testing",
  "Business & Outreach",
];

const PHASES = ["Concept", "Design", "Fabrication", "Integration", "Testing", "Documentation"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export default function TaskAISuggestions({ 
  title, 
  description, 
  division,
  members,
  tasks,
  onApplySuggestion 
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lastInput, setLastInput] = useState("");

  const fetchSuggestions = useCallback(
    debounce(async (inputTitle, inputDescription, inputDivision) => {
      if (!inputTitle || inputTitle.length < 5) {
        setSuggestions(null);
        return;
      }

      const inputKey = `${inputTitle}|${inputDescription}|${inputDivision}`;
      if (inputKey === lastInput) return;
      
      setIsLoading(true);
      setLastInput(inputKey);

      // Build context about members
      const memberContext = members.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        division: m.division,
        skills: m.skills || [],
        subTeams: m.subTeams || [],
        roles: m.roles || [],
      }));

      // Get recent completed tasks for context
      const completedTasks = tasks
        .filter(t => t.status === "Done")
        .slice(0, 20)
        .map(t => ({
          title: t.title,
          subTeam: t.subTeam,
          phase: t.phase,
          assigneeIds: t.assigneeIds,
        }));

      const prompt = `You are an AI assistant for a NASA rover team task management system. Analyze the following task and provide suggestions.

TASK DETAILS:
Title: ${inputTitle}
Description: ${inputDescription || "No description provided"}
Division: ${inputDivision} (HP = Human-Powered rover, RC = Remote-Controlled rover, Both = applies to both)

AVAILABLE SUB-TEAMS: ${SUB_TEAMS.join(", ")}
AVAILABLE PHASES: ${PHASES.join(", ")}
AVAILABLE PRIORITIES: ${PRIORITIES.join(", ")}

TEAM MEMBERS (for assignee suggestions):
${JSON.stringify(memberContext, null, 2)}

RECENTLY COMPLETED TASKS (for context):
${JSON.stringify(completedTasks, null, 2)}

Based on the task title and description, suggest:
1. The most appropriate sub-team for this task
2. The appropriate phase (where in the project lifecycle this task fits)
3. Priority level based on the nature and urgency implied
4. Up to 3 recommended assignees based on their skills, sub-teams, and past task experience

Provide a brief reasoning for each suggestion.`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              subTeam: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  reason: { type: "string" }
                }
              },
              phase: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  reason: { type: "string" }
                }
              },
              priority: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  reason: { type: "string" }
                }
              },
              assignees: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    memberId: { type: "string" },
                    memberName: { type: "string" },
                    reason: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        setSuggestions(result);
      } catch (err) {
        console.error("AI suggestion error:", err);
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
    }, 1000),
    [members, tasks, lastInput]
  );

  useEffect(() => {
    fetchSuggestions(title, description, division);
  }, [title, description, division, fetchSuggestions]);

  if (!title || title.length < 5) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">AI Suggestions</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && suggestions && (
        <div className="mt-3 space-y-3">
          {/* Sub-Team Suggestion */}
          {suggestions.subTeam?.value && SUB_TEAMS.includes(suggestions.subTeam.value) && (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-400">Sub-Team</p>
                <p className="text-sm text-white">{suggestions.subTeam.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{suggestions.subTeam.reason}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-7 px-2"
                onClick={() => onApplySuggestion("subTeam", suggestions.subTeam.value)}
              >
                Apply
              </Button>
            </div>
          )}

          {/* Phase Suggestion */}
          {suggestions.phase?.value && PHASES.includes(suggestions.phase.value) && (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-400">Phase</p>
                <p className="text-sm text-white">{suggestions.phase.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{suggestions.phase.reason}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-7 px-2"
                onClick={() => onApplySuggestion("phase", suggestions.phase.value)}
              >
                Apply
              </Button>
            </div>
          )}

          {/* Priority Suggestion */}
          {suggestions.priority?.value && PRIORITIES.includes(suggestions.priority.value) && (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-400">Priority</p>
                <p className="text-sm text-white">{suggestions.priority.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{suggestions.priority.reason}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-7 px-2"
                onClick={() => onApplySuggestion("priority", suggestions.priority.value)}
              >
                Apply
              </Button>
            </div>
          )}

          {/* Assignee Suggestions */}
          {suggestions.assignees?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Suggested Assignees</p>
              <div className="space-y-2">
                {suggestions.assignees.slice(0, 3).map((assignee, idx) => {
                  const member = members.find(m => m.id === assignee.memberId);
                  if (!member) return null;
                  return (
                    <div key={idx} className="flex items-start justify-between gap-2 bg-slate-800/50 rounded p-2">
                      <div className="flex items-center gap-2 flex-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-white">{assignee.memberName}</p>
                          <p className="text-xs text-slate-500">{assignee.reason}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 h-7 px-2"
                        onClick={() => onApplySuggestion("assignee", assignee.memberId)}
                      >
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Apply All Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20 mt-2"
            onClick={() => {
              if (suggestions.subTeam?.value && SUB_TEAMS.includes(suggestions.subTeam.value)) {
                onApplySuggestion("subTeam", suggestions.subTeam.value);
              }
              if (suggestions.phase?.value && PHASES.includes(suggestions.phase.value)) {
                onApplySuggestion("phase", suggestions.phase.value);
              }
              if (suggestions.priority?.value && PRIORITIES.includes(suggestions.priority.value)) {
                onApplySuggestion("priority", suggestions.priority.value);
              }
              suggestions.assignees?.slice(0, 3).forEach(a => {
                if (members.find(m => m.id === a.memberId)) {
                  onApplySuggestion("assignee", a.memberId);
                }
              });
            }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Apply All Suggestions
          </Button>
        </div>
      )}

      {expanded && isLoading && !suggestions && (
        <div className="mt-3 flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="ml-2 text-sm text-slate-400">Analyzing task...</span>
        </div>
      )}
    </div>
  );
}