const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

export const api = {
  async getTickets(
    guildId: string = "support-demo-999",
    params?: { status?: string; category?: string; priority?: string; search?: string }
  ): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.category) query.set("category", params.category);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.search) query.set("search", params.search);

    const res = await fetch(`${API_URL}/tickets/${guildId}?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to load tickets.");
    return res.json();
  },

  async getTicketDetail(guildId: string = "support-demo-999", ticketId: number): Promise<TicketDetail> {
    const res = await fetch(`${API_URL}/tickets/${guildId}/${ticketId}`);
    if (!res.ok) throw new Error("Failed to load ticket details.");
    return res.json();
  },

  async createTicket(guildId: string = "support-demo-999", data: any): Promise<Ticket> {
    const res = await fetch(`${API_URL}/tickets/${guildId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create ticket.");
    return res.json();
  },

  async claimTicket(guildId: string = "support-demo-999", ticketId: number, agentName: string): Promise<Ticket> {
    const res = await fetch(`${API_URL}/tickets/${guildId}/${ticketId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: "agent_curr", agent_name: agentName }),
    });
    if (!res.ok) throw new Error("Failed to claim ticket.");
    return res.json();
  },

  async updateStatus(guildId: string = "support-demo-999", ticketId: number, status: string): Promise<Ticket> {
    const res = await fetch(`${API_URL}/tickets/${guildId}/${ticketId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status.");
    return res.json();
  },

  async updatePriority(guildId: string = "support-demo-999", ticketId: number, priority: string): Promise<Ticket> {
    const res = await fetch(`${API_URL}/tickets/${guildId}/${ticketId}/priority`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    if (!res.ok) throw new Error("Failed to update priority.");
    return res.json();
  },

  async addMessage(guildId: string = "support-demo-999", ticketId: number, content: string, isStaff: boolean): Promise<TicketMessage> {
    const res = await fetch(`${API_URL}/tickets/${guildId}/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_id: isStaff ? "staff_curr" : "cust_curr",
        author_name: isStaff ? "Staff Support" : "Customer",
        is_staff: isStaff,
        content,
      }),
    });
    if (!res.ok) throw new Error("Failed to send message.");
    return res.json();
  },

  async addNote(guildId: string = "support-demo-999", ticketId: number, noteText: string): Promise<InternalNote> {
    const res = await fetch(`${API_URL}/tickets/${guildId}/${ticketId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: "staff_curr",
        staff_name: "Staff Support",
        note_text: noteText,
      }),
    });
    if (!res.ok) throw new Error("Failed to add private note.");
    return res.json();
  },

  async getOverview(guildId: string = "support-demo-999"): Promise<OverviewStats> {
    const res = await fetch(`${API_URL}/analytics/${guildId}/overview`);
    if (!res.ok) throw new Error("Failed to load overview.");
    return res.json();
  },

  async getCategories(guildId: string = "support-demo-999"): Promise<CategoryBreakdown[]> {
    const res = await fetch(`${API_URL}/analytics/${guildId}/categories`);
    if (!res.ok) throw new Error("Failed to load categories.");
    return res.json();
  },

  async seedDemo(): Promise<void> {
    const res = await fetch(`${API_URL}/demo/seed`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed demo support data.");
  },
};
