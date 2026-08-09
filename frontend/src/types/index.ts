export interface User {
  id: string;
  name: string;
  email: string;
  baseCurrency: string;
  createdAt: string;
  isPremium?: boolean;
  settings?: UserSettings;
}

export interface UserSettings {
  theme: string;
  currency: string;
  language: string;
  emailNotifications: boolean;
  budgetAlerts: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD' | 'UPI' | 'OTHER';
  balance: number;
  color: string;
  createdAt?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit_amount: number;
  total_due: number;
  minimum_due: number;
  due_date: string;
  billing_cycle_start?: number;
  billing_cycle_end?: number;
  usage_percentage?: number;
  risk_level?: 'Low' | 'Medium' | 'High';
  days_until_due?: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category_id: string;
  categoryId?: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  date: string;
  payment_method?: string;
  tags?: string[];
  notes?: string;
  location?: string;
  attachment_url?: string;
  receipt_url?: string;
  is_recurring?: boolean;
}

export interface Budget {
  id: string;
  category_id: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  amount: number;
  period: 'monthly' | 'weekly';
  month: number;
  year: number;
  spent: number;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  contributions?: GoalContribution[];
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  renewal_date: string;
  is_active: boolean;
  payment_source?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  category: string;
  status?: 'pending' | 'paid' | 'overdue';
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface GroupExpenseSplit {
  user_id: string;
  amount_owed: number;
}

export interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paid_by: string;
  paid_by_name: string;
  splits: GroupExpenseSplit[];
}

export interface GroupSettlement {
  id: string;
  amount: number;
  date: string;
  paid_by: string;
  paid_by_name: string;
  paid_to: string;
  paid_to_name: string;
}

export interface GroupDetails {
  group: { id: string; name: string; created_by: string; created_at: string };
  members: GroupMember[];
  expenses: GroupExpense[];
  settlements: GroupSettlement[];
  balances: { [userId: string]: { [userId: string]: number } };
}
