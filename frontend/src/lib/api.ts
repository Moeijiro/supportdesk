export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export const DEMO_GUILD = "support-demo-999";
export const DEMO_GUILD_NAME = "Acme Cloud";

export interface Ticket {
  id: number;
  ticket_number: number;
  guild_id: string;
  customer_id: string;
  customer_name: string;
  category: string;
  subject: string;
  status: "Open" | "Waiting for Staff" | "Waiting for Customer" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Normal" | "High" | "Urgent";
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  rating: number | null;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  author_id: string;
  author_name: string;
  is_staff: boolean;
  content: string;
  timestamp: string;
}

export interface InternalNote {
  id: number;
  ticket_id: number;
  staff_id: string;
  staff_name: string;
  note_text: string;
  created_at: string;
}

export interface TicketDetail extends Ticket {
  description: string;
  rating_comment: string | null;
  messages: TicketMessage[];
  notes: InternalNote[];
  has_transcript: boolean;
}

export interface OverviewStats {
  open_tickets_count: number;
  unassigned_count: number;
  waiting_for_staff_count: number;
  resolved_today_count: number;
  average_first_response_minutes: number;
  average_resolution_hours: number;
  total_tickets_recorded: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    });
  } catch {
    throw new ApiError("Can't reach the SupportDesk API. Is the backend running on port 8000?", 0);
  }
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status}).`;
    try {
      const data = await res.json();
      const detail = data?.detail;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail) && detail[0]?.msg) message = String(detail[0].msg);
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export type TicketFilters = { status?: string; category?: string; priority?: string; search?: string };
export type NewTicket = { customer_id: string; customer_name: string; category: string; subject: string; description: string; priority: Ticket["priority"] };

export function transcriptUrl(ticketId: number, format: "html" | "text" = "html", guildId = DEMO_GUILD): string {
  return `${API_URL}/tickets/${guildId}/${ticketId}/transcript?format=${format}`;
}

export const api = {
  getTickets(filters: TicketFilters = {}, guildId = DEMO_GUILD) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value && value !== "All") query.set(key, value);
    return request<Ticket[]>(`/tickets/${guildId}?${query}`);
  },
  getTicketDetail(ticketId: number, guildId = DEMO_GUILD) {
    return request<TicketDetail>(`/tickets/${guildId}/${ticketId}`);
  },
  createTicket(data: NewTicket, guildId = DEMO_GUILD) {
    return request<Ticket>(`/tickets/${guildId}`, post(data));
  },
  claimTicket(ticketId: number, agentName: string, guildId = DEMO_GUILD) {
    return request<Ticket>(`/tickets/${guildId}/${ticketId}/claim`, post({ agent_id: "agent_1", agent_name: agentName }));
  },
  updateStatus(ticketId: number, status: Ticket["status"], guildId = DEMO_GUILD) {
    return request<Ticket>(`/tickets/${guildId}/${ticketId}/status`, post({ status }));
  },
  updatePriority(ticketId: number, priority: Ticket["priority"], guildId = DEMO_GUILD) {
    return request<Ticket>(`/tickets/${guildId}/${ticketId}/priority`, post({ priority }));
  },
  addMessage(ticketId: number, content: string, author: { id: string; name: string; staff: boolean }, guildId = DEMO_GUILD) {
    return request<TicketMessage>(`/tickets/${guildId}/${ticketId}/messages`, post({ author_id: author.id, author_name: author.name, is_staff: author.staff, content }));
  },
  addNote(ticketId: number, noteText: string, guildId = DEMO_GUILD) {
    return request<InternalNote>(`/tickets/${guildId}/${ticketId}/notes`, post({ staff_id: "agent_1", staff_name: "Alex Morgan", note_text: noteText }));
  },
  getOverview(guildId = DEMO_GUILD) {
    return request<OverviewStats>(`/analytics/${guildId}/overview`);
  },
  getCategories(guildId = DEMO_GUILD) {
    return request<CategoryBreakdown[]>(`/analytics/${guildId}/categories`);
  },
  seedDemo() {
    return request<{ message: string; created: boolean }>(`/demo/seed`, { method: "POST" });
  },
};
