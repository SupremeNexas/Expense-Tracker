import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#10B981', icon: 'utensils', type: 'EXPENSE' },
  { name: 'Travel', color: '#3B82F6', icon: 'plane', type: 'EXPENSE' },
  { name: 'Fuel', color: '#F59E0B', icon: 'fuel', type: 'EXPENSE' },
  { name: 'Shopping', color: '#EC4899', icon: 'shopping-bag', type: 'EXPENSE' },
  { name: 'Bills', color: '#EF4444', icon: 'zap', type: 'EXPENSE' },
  { name: 'Health', color: '#EF4444', icon: 'heart', type: 'EXPENSE' },
  { name: 'Education', color: '#8B5CF6', icon: 'book-open', type: 'EXPENSE' },
  { name: 'Entertainment', color: '#F59E0B', icon: 'film', type: 'EXPENSE' },
  { name: 'Salary', color: '#10B981', icon: 'briefcase', type: 'INCOME' },
  { name: 'Freelance', color: '#3B82F6', icon: 'laptop', type: 'INCOME' },
  { name: 'Bonus', color: '#8B5CF6', icon: 'award', type: 'INCOME' },
  { name: 'Interest', color: '#F59E0B', icon: 'percent', type: 'INCOME' },
  { name: 'Refunds', color: '#06B6D4', icon: 'rotate-ccw', type: 'INCOME' },
  { name: 'Investment', color: '#10B981', icon: 'trending-up', type: 'INCOME' },
  { name: 'Gift', color: '#EC4899', icon: 'gift', type: 'INCOME' },
  { name: 'Other Income', color: '#6B7280', icon: 'dollar-sign', type: 'INCOME' },
  { name: 'Other', color: '#6B7280', icon: 'more-horizontal', type: 'EXPENSE' },
];

async function getOrCreatePersonalWorkspace(userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspace: { type: 'PERSONAL' }
    }
  });

  if (member) {
    return member.workspaceId;
  }

  const ws = await prisma.workspace.create({
    data: {
      name: 'Personal Workspace',
      type: 'PERSONAL',
      members: {
        create: {
          userId,
          role: 'OWNER'
        }
      }
    }
  });

  return ws.id;
}

export async function seedCategoriesForUser(userId: string) {
  const workspaceId = await getOrCreatePersonalWorkspace(userId);
  const existingCount = await prisma.category.count({ where: { userId, workspaceId } });
  if (existingCount > 0) return;

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map(cat => ({
      userId,
      workspaceId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type,
    })),
  });
  console.log(`✅ Default categories seeded for user ${userId}`);
}

const DEMO_ACCOUNT_EMAIL = 'demo@example.com';

export async function isDemoUser(userId: string, email: string) {
  return email === DEMO_ACCOUNT_EMAIL;
}

export async function seedSampleDataForUser(userId: string, email: string) {
  // Only seed demo data for the demo account; real users get clean state
  const isDemo = await isDemoUser(userId, email);
  if (!isDemo) {
    // For non-demo users, just clear any existing data without seeding
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.goal.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.bill.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    console.log(`🔧 Cleared existing data for non-demo user ${userId} (${email})`);
    return;
  }

  // Original demo data seeding logic for demo account
  // Clear existing transactions/budgets/goals first to prevent duplicate seeding issues
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.bill.deleteMany({ where: { userId } });
  await prisma.wallet.deleteMany({ where: { userId } });

  const workspaceId = await getOrCreatePersonalWorkspace(userId);

  // Fetch the user to get their base currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true }
  });
  const baseCurrency = user?.baseCurrency || 'USD';

  // Helper to scale amounts based on baseCurrency relative to INR (since raw seed values are in INR scale)
  const scale = (amountInINR: number): number => {
    const rates: Record<string, number> = {
      USD: 1.0,
      INR: 83.5,
      EUR: 0.92,
      GBP: 0.78,
      JPY: 155.2,
      CAD: 1.36,
      AUD: 1.51,
      SGD: 1.35
    };
    const inrRate = rates.INR;
    const targetRate = rates[baseCurrency.toUpperCase()] || rates.USD;
    const value = amountInINR * (targetRate / inrRate);
    return Math.round(value * 100) / 100;
  };

  const isINR = baseCurrency === 'INR';
  const bankName = isINR ? 'HDFC Bank Account' : 'Checking Account';
  const cardName = isINR ? 'ICICI Amazon Pay Card' : 'Amazon Rewards Visa';

  // 1. Create default wallets
  const mainWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: bankName,
      type: 'BANK',
      balance: scale(145000.50),
      color: '#3B82F6',
      currency: baseCurrency,
    }
  });

  const cashWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: 'Cash Wallet',
      type: 'CASH',
      balance: scale(4500.00),
      color: '#6B7280',
      currency: baseCurrency,
    }
  });

  const creditCard = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: cardName,
      type: 'CREDIT_CARD',
      balance: scale(-12500.00), // debt
      color: '#EC4899',
      currency: baseCurrency,
    }
  });

  console.log(`✅ Seeded wallets for user ${userId}`);

  // Fetch created categories
  const categories = await prisma.category.findMany({ where: { userId, workspaceId } });
  const catMap = new Map(categories.map(c => [c.name, c.id]));

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Create Incomes
  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Monthly Salary Credit',
      amount: scale(125000.00),
      type: 'INCOME',
      categoryId: catMap.get('Salary') || categories[0].id,
      walletId: mainWallet.id,
      date: new Date(year, month - 1, 1),
      paymentMethod: isINR ? 'Bank Transfer' : 'Direct Deposit',
      notes: 'Direct deposit',
    }
  });

  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Monthly Salary Credit',
      amount: scale(125000.00),
      type: 'INCOME',
      categoryId: catMap.get('Salary') || categories[0].id,
      walletId: mainWallet.id,
      date: new Date(year, month, 1),
      paymentMethod: isINR ? 'Bank Transfer' : 'Direct Deposit',
      notes: 'Direct deposit',
    }
  });

  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Dividend Payout',
      amount: scale(4500.00),
      type: 'INCOME',
      categoryId: catMap.get('Investment') || categories[0].id,
      walletId: mainWallet.id,
      date: new Date(year, month, 15),
      paymentMethod: isINR ? 'UPI' : 'ACH Transfer',
      notes: 'Mutual fund returns',
    }
  });

  // Create Expenses
  const templates = [
    { title: isINR ? 'Reliance Fresh Groceries' : 'Whole Foods Groceries', catName: 'Food', min: scale(1200), max: scale(4000), wallet: mainWallet.id, pm: isINR ? 'UPI' : 'Debit Card' },
    { title: isINR ? 'Zomato Food Delivery' : 'DoorDash Food Delivery', catName: 'Food', min: scale(300), max: scale(1200), wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Dinner at Olive Bistro', catName: 'Food', min: scale(2000), max: scale(6000), wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Uber Ride Office', catName: 'Travel', min: scale(300), max: scale(800), wallet: creditCard.id, pm: 'Credit Card' },
    { title: isINR ? 'Auto Fare Local' : 'Local Cab / Taxi', catName: 'Travel', min: scale(50), max: scale(200), wallet: cashWallet.id, pm: 'Cash' },
    { title: isINR ? 'HP Petrol Pump Refill' : 'Chevron Gas Station', catName: 'Fuel', min: scale(2000), max: scale(4500), wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Zara Store Shopping', catName: 'Shopping', min: scale(3000), max: scale(9000), wallet: creditCard.id, pm: 'Credit Card' },
    { title: isINR ? 'Amazon Shopping Sale' : 'Amazon Shopping Sale', catName: 'Shopping', min: scale(1000), max: scale(15000), wallet: mainWallet.id, pm: isINR ? 'UPI' : 'Debit Card' },
    { title: 'Electricity Bill', catName: 'Bills', min: scale(2500), max: scale(5000), wallet: mainWallet.id, pm: 'Bank Transfer' },
    { title: 'Broadband Wifi Bill', catName: 'Bills', min: scale(999), max: scale(1200), wallet: mainWallet.id, pm: isINR ? 'UPI' : 'Bank Transfer' },
    { title: 'Gym Membership', catName: 'Entertainment', min: scale(1500), max: scale(3000), wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Netflix Premium Subscription', catName: 'Entertainment', min: scale(649), max: scale(649), wallet: creditCard.id, pm: 'Credit Card' },
    { title: isINR ? 'Apollo Pharmacy Medicines' : 'CVS Pharmacy Medicines', catName: 'Health', min: scale(200), max: scale(1500), wallet: cashWallet.id, pm: 'Cash' },
    { title: 'Udemy Online Course', catName: 'Education', min: scale(499), max: scale(1200), wallet: mainWallet.id, pm: isINR ? 'UPI' : 'Debit Card' },
  ];

  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280.0;
  };

  // Generate expenses for last 2 months
  const expenseData = [];
  for (let i = 2; i >= 0; i--) {
    const curMonth = (month - i + 12) % 12;
    const curYear = year - (month - i < 0 ? 1 : 0);
    const numDays = new Date(curYear, curMonth + 1, 0).getDate();
    const count = 12 + Math.floor(rand() * 8);

    for (let j = 0; j < count; j++) {
      const template = templates[Math.floor(rand() * templates.length)];
      const categoryId = catMap.get(template.catName) || categories[0].id;
      const amount = Math.round(template.min + rand() * (template.max - template.min));
      const day = Math.min(Math.floor(rand() * numDays) + 1, numDays);

      expenseData.push({
        userId,
        workspaceId,
        title: template.title,
        amount,
        type: 'EXPENSE',
        categoryId,
        walletId: template.wallet,
        date: new Date(curYear, curMonth, day),
        paymentMethod: template.pm,
        tags: ['monthly-spends', template.catName.toLowerCase()],
        notes: 'Generated test expense',
      });
    }
  }

  await prisma.transaction.createMany({ data: expenseData });
  console.log(`✅ Seeded ${expenseData.length} expenses for user ${userId}`);

  // 2. Budgets
  await prisma.budget.create({
    data: {
      userId,
      workspaceId,
      categoryId: catMap.get('Food')!,
      amount: scale(25000.00),
      period: 'MONTHLY',
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0),
    }
  });

  await prisma.budget.create({
    data: {
      userId,
      workspaceId,
      categoryId: catMap.get('Shopping')!,
      amount: scale(15000.00),
      period: 'MONTHLY',
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0),
    }
  });

  await prisma.budget.create({
    data: {
      userId,
      workspaceId,
      categoryId: catMap.get('Travel')!,
      amount: scale(8000.00),
      period: 'MONTHLY',
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0),
    }
  });

  console.log(`✅ Seeded budgets for user ${userId}`);

  // 3. Savings Goals
  await prisma.goal.create({
    data: {
      userId,
      workspaceId,
      name: 'MacBook Pro 16" M4',
      targetAmount: scale(249000.00),
      currentAmount: scale(85000.00),
      targetDate: new Date(year + 1, 0, 1),
      contributions: {
        create: [
          { amount: scale(50000.00), notes: 'Initial savings' },
          { amount: scale(35000.00), notes: 'June bonus contribution' },
        ]
      }
    }
  });

  await prisma.goal.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'Goa Vacation Fund' : 'Hawaii Vacation Fund',
      targetAmount: scale(60000.00),
      currentAmount: scale(45000.00),
      targetDate: new Date(year, month + 3, 1),
      contributions: {
        create: [
          { amount: scale(20000.00), notes: 'Trip savings starts' },
          { amount: scale(25000.00), notes: 'July contribution' }
        ]
      }
    }
  });

  console.log(`✅ Seeded savings goals for user ${userId}`);

  // 4. Subscriptions
  await prisma.subscription.create({
    data: {
      userId,
      workspaceId,
      name: 'Spotify Premium Duo',
      amount: scale(149.00),
      billingCycle: 'MONTHLY',
      nextBillingDate: new Date(year, month, 28),
      walletId: creditCard.id,
      isActive: true,
    }
  });

  await prisma.subscription.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'Amazon Prime India' : 'Amazon Prime Membership',
      amount: scale(1499.00),
      billingCycle: 'YEARLY',
      nextBillingDate: new Date(year + 1, month, 10),
      walletId: creditCard.id,
      isActive: true,
    }
  });

  // 5. Bills
  await prisma.bill.create({
    data: {
      userId,
      workspaceId,
      name: 'House Rent Payment',
      amount: scale(28000.00),
      dueDate: new Date(year, month, 7),
      isPaid: false,
      category: 'Rent',
    }
  });

  await prisma.bill.create({
    data: {
      userId,
      workspaceId,
      name: 'Internet & Broadband Charge',
      amount: scale(1199.00),
      dueDate: new Date(year, month, 12),
      isPaid: false,
      category: 'Utilities',
    }
  });

  console.log(`✅ Seeded subscriptions and bills for user ${userId}`);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create global test user
  const email = 'demo@example.com';
  const name = 'Alex Mercer';
  const passwordHash = await bcrypt.hash('password123', 10);

  // Upsert user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        baseCurrency: 'INR',
        isVerified: true,
        settings: {
          create: {
            theme: 'light',
            currency: 'INR',
            language: 'en',
          }
        }
      }
    });
    console.log(`✅ Created test user ${email}`);
  }

  // Seed user items
  await seedCategoriesForUser(user.id);
  await seedSampleDataForUser(user.id, user.email);

  console.log('✅ Seeding complete.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Error seeding DB:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
