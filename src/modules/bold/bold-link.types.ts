export interface BoldCreateLinkRequest {
  total_amount: number;
  currency?: string;
  description: string;
  reference: string;
  callback_url?: string;
  image_url?: string;
  payment_methods?: string[];
}

export interface BoldCreateLinkResponse {
  payment_link: string;
  url: string;
}

export interface BoldLinkStatusResponse {
  status: string;
  is_sandbox?: boolean;
  id: string;
  transaction_id?: string | null;
  total?: number;
  reference?: string;
  payment_method?: string | null;
}

export interface BoldWebhookNotification {
  id: string;
  type: string;
  subject: string;
  data: {
    payment_id: string;
    metadata?: { reference?: string };
  };
}
