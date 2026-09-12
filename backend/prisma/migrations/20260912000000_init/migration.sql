-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "google_id" TEXT,
    "avatar" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "last_login" TIMESTAMP(3),
    "display_name" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "monthly_income" TEXT,
    "preferred_goal" TEXT,
    "short_term_goal" TEXT,
    "long_term_goal" TEXT,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "budget_alerts" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "limit_amount" DECIMAL(12,2) NOT NULL,
    "total_due" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "minimum_due" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "due_date" TIMESTAMP(3) NOT NULL,
    "billing_cycle_start" INTEGER,
    "billing_cycle_end" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "category_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "to_wallet_id" TEXT,
    "payment_method" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "receipt_url" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "attachment_url" TEXT,
    "last_editor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "category_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "current_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "target_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_contributions" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "category_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "next_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "next_billing_date" TIMESTAMP(3) NOT NULL,
    "category_id" TEXT,
    "wallet_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "image_url" TEXT NOT NULL,
    "merchant" TEXT,
    "amount" DECIMAL(12,2),
    "tax" DECIMAL(12,2),
    "date" TIMESTAMP(3),
    "category" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_expenses" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "paid_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_expense_splits" (
    "id" TEXT NOT NULL,
    "group_expense_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_owed" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_settlements" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "paid_by_id" TEXT NOT NULL,
    "paid_to_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "previous_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "net_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_settlements" (
    "id" TEXT NOT NULL,
    "friendship_id" TEXT NOT NULL,
    "paid_by_id" TEXT NOT NULL,
    "paid_to_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_balances" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_id_key" ON "settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "wallets_workspace_id_idx" ON "wallets"("workspace_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_date_idx" ON "transactions"("workspace_id", "date");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_category_id_idx" ON "transactions"("workspace_id", "category_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_wallet_id_idx" ON "transactions"("workspace_id", "wallet_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_to_wallet_id_idx" ON "transactions"("workspace_id", "to_wallet_id");

-- CreateIndex
CREATE INDEX "budgets_workspace_id_category_id_idx" ON "budgets"("workspace_id", "category_id");

-- CreateIndex
CREATE INDEX "budgets_workspace_id_start_date_end_date_idx" ON "budgets"("workspace_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "goals_workspace_id_idx" ON "goals"("workspace_id");

-- CreateIndex
CREATE INDEX "subscriptions_workspace_id_idx" ON "subscriptions"("workspace_id");

-- CreateIndex
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");

-- CreateIndex
CREATE INDEX "receipts_user_id_idx" ON "receipts"("user_id");

-- CreateIndex
CREATE INDEX "bills_workspace_id_idx" ON "bills"("workspace_id");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_created_at_idx" ON "audit_logs"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "friends_from_user_id_idx" ON "friends"("from_user_id");

-- CreateIndex
CREATE INDEX "friends_to_user_id_idx" ON "friends"("to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "friends_from_user_id_to_user_id_key" ON "friends"("from_user_id", "to_user_id");

-- CreateIndex
CREATE INDEX "friend_settlements_friendship_id_idx" ON "friend_settlements"("friendship_id");

-- CreateIndex
CREATE INDEX "friend_balances_from_user_id_idx" ON "friend_balances"("from_user_id");

-- CreateIndex
CREATE INDEX "friend_balances_to_user_id_idx" ON "friend_balances"("to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "friend_balances_from_user_id_to_user_id_key" ON "friend_balances"("from_user_id", "to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupMembers_AB_unique" ON "_GroupMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupMembers_B_index" ON "_GroupMembers"("B");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_wallet_id_fkey" FOREIGN KEY ("to_wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_expenses" ADD CONSTRAINT "group_expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_expenses" ADD CONSTRAINT "group_expenses_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_expense_splits" ADD CONSTRAINT "group_expense_splits_group_expense_id_fkey" FOREIGN KEY ("group_expense_id") REFERENCES "group_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_expense_splits" ADD CONSTRAINT "group_expense_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_settlements" ADD CONSTRAINT "group_settlements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_settlements" ADD CONSTRAINT "group_settlements_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_settlements" ADD CONSTRAINT "group_settlements_paid_to_id_fkey" FOREIGN KEY ("paid_to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_settlements" ADD CONSTRAINT "friend_settlements_friendship_id_fkey" FOREIGN KEY ("friendship_id") REFERENCES "friends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_settlements" ADD CONSTRAINT "friend_settlements_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_settlements" ADD CONSTRAINT "friend_settlements_paid_to_id_fkey" FOREIGN KEY ("paid_to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_balances" ADD CONSTRAINT "friend_balances_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_balances" ADD CONSTRAINT "friend_balances_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMembers" ADD CONSTRAINT "_GroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMembers" ADD CONSTRAINT "_GroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
