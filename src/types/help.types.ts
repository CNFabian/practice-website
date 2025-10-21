export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  view_count: number;
}

export interface FAQCategory {
  id: string;
  name: string;
  description?: string;
}

// Support ticket types
export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  category: string;
  admin_response?: string;
  responded_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SupportTicketRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

// Help resources types
export interface HelpResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'guide' | 'video' | 'article' | 'tutorial';
  category: string;
  order_index: number;
}

export interface QuickHelpTopic {
  id: string;
  title: string;
  solution: string;
  category: string;
  popular: boolean;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  business_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  timezone: string;
  emergency_contact?: string;
}

export interface SystemStatus {
  overall_status: 'operational' | 'degraded' | 'maintenance' | 'outage';
  services: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    description?: string;
  }[];
  incidents: {
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    created_at: string;
    updated_at: string;
  }[];
  maintenance: {
    id: string;
    title: string;
    description: string;
    scheduled_start: string;
    scheduled_end: string;
    status: 'scheduled' | 'in_progress' | 'completed';
  }[];
}

export interface FeedbackForm {
  fields: {
    name: string;
    type: 'text' | 'email' | 'textarea' | 'select' | 'rating';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select fields
    validation?: {
      min_length?: number;
      max_length?: number;
      pattern?: string;
    };
  }[];
  categories: string[];
}

// API response wrappers
export interface HelpAPIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Query parameter types
export interface FAQQueryParams {
  category?: string;
  search?: string;
  limit?: number;
}

export interface TicketQueryParams {
  status_filter?: string;
  limit?: number;
  offset?: number;
}

// Help section configuration
export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'faq' | 'contact' | 'resources' | 'status';
}

// Frontend UI state types
export interface HelpPageState {
  activeTab: 'faq' | 'contact' | 'resources' | 'status';
  selectedCategory: string | null;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
}