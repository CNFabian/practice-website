import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import {
  getFAQs,
  getFAQ,
  getFAQCategories,
  getUserTickets,
  getTicket,
  getHelpResources,
  getQuickHelp,
  getContactInfo,
  getSystemStatus,
  getFeedbackForm,
} from '../services/helpAPI';

interface FAQsParams {
  category?: string;
  search?: string;
  limit?: number;
}

interface UserTicketsParams {
  status_filter?: string;
  limit?: number;
  offset?: number;
}

export const useFAQs = (params?: FAQsParams) => {
  return useQuery({
    queryKey: queryKeys.help.faqs(params),
    queryFn: () => getFAQs(params),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useFAQ = (faqId: string) => {
  return useQuery({
    queryKey: queryKeys.help.faq(faqId),
    queryFn: () => getFAQ(faqId),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    enabled: !!faqId,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useFAQCategories = () => {
  return useQuery({
    queryKey: queryKeys.help.categories(),
    queryFn: getFAQCategories,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useUserTickets = (params?: UserTicketsParams) => {
  return useQuery({
    queryKey: queryKeys.help.tickets(params),
    queryFn: () => getUserTickets(params),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: queryKeys.help.ticket(ticketId),
    queryFn: () => getTicket(ticketId),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    enabled: !!ticketId,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useHelpResources = () => {
  return useQuery({
    queryKey: queryKeys.help.resources(),
    queryFn: getHelpResources,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useQuickHelp = () => {
  return useQuery({
    queryKey: queryKeys.help.quickHelp(),
    queryFn: getQuickHelp,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useContactInfo = () => {
  return useQuery({
    queryKey: queryKeys.help.contactInfo(),
    queryFn: getContactInfo,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useSystemStatus = () => {
  return useQuery({
    queryKey: queryKeys.help.systemStatus(),
    queryFn: getSystemStatus,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useFeedbackForm = () => {
  return useQuery({
    queryKey: queryKeys.help.feedbackForm(),
    queryFn: getFeedbackForm,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};
