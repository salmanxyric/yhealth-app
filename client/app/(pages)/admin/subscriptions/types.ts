export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  plan_name?: string;
  plan_slug?: string;
  plan_amount_cents?: number;
  plan_currency?: string;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  invoice_url?: string | null;
}
