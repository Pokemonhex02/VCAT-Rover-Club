import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export async function sendEventNotification(event, members, isUpdate = false) {
  // Filter members who have email notifications enabled and match the division
  const eligibleMembers = members.filter(m => {
    if (m.emailNotifications === false) return false;
    if (!m.isApproved && m.status !== 'Active') return false;
    if (event.division === 'Joint') return true;
    return m.division === event.division || m.division === 'Both';
  });

  const subject = isUpdate 
    ? `Event Updated: ${event.title}`
    : `New Event: ${event.title}`;

  const body = `
${isUpdate ? 'An event has been updated:' : 'A new event has been scheduled:'}

📅 ${event.title}
🕐 ${format(new Date(event.dateTimeStart), "EEEE, MMMM d, yyyy 'at' h:mm a")} - ${format(new Date(event.dateTimeEnd), "h:mm a")}
📍 ${event.location || 'TBD'}
🎯 Division: ${event.division}
📋 Type: ${event.eventType}

${event.description ? `Details: ${event.description}` : ''}

Log in to VCAT Rover Member Hub to view details and check in.
  `.trim();

  // Send emails to eligible members
  for (const member of eligibleMembers) {
    try {
      await base44.integrations.Core.SendEmail({
        to: member.email,
        subject,
        body,
        from_name: "VCAT Rover Team",
      });
    } catch (err) {
      console.error(`Failed to send email to ${member.email}:`, err);
    }
  }
}

export async function sendTaskAssignmentNotification(task, assignee) {
  if (assignee.emailNotifications === false) return;

  const subject = `New Task Assigned: ${task.title}`;

  const body = `
You have been assigned a new task:

📋 ${task.title}
🎯 Division: ${task.division}
📂 Sub-Team: ${task.subTeam || 'Not specified'}
⚡ Priority: ${task.priority}
${task.dueDate ? `📅 Due: ${format(new Date(task.dueDate), "MMMM d, yyyy")}` : ''}

${task.description ? `Details: ${task.description}` : ''}

Log in to VCAT Rover Member Hub to view the full task details.
  `.trim();

  try {
    await base44.integrations.Core.SendEmail({
      to: assignee.email,
      subject,
      body,
      from_name: "VCAT Rover Team",
    });
  } catch (err) {
    console.error(`Failed to send task notification to ${assignee.email}:`, err);
  }
}