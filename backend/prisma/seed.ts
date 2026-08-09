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
  { name: 'Salary', color: '#17C964', icon: 'dollar-sign', type: 'INCOME' },
  { name: 'Investment', color: '#10B981', icon: 'trending-up', type: 'INCOME' },
  { name: 'Gift', color: '#EC4899', icon: 'gift', type: 'INCOME' },
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

export async function seedSampleDataForUser(userId: string) {
  // Clear existing transactions/budgets/goals first to prevent duplicate seeding issues
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.bill.deleteMany({ where: { userId } });
  await prisma.wallet.deleteMany({ where: { userId } });

  const workspaceId = await getOrCreatePersonalWorkspace(userId);

  // 1. Create default wallets
  const mainWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: 'HDFC Bank Account',
      type: 'BANK',
      balance: 145000.50,
      color: '#3B82F6',
    }
  });

  const cashWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: 'Cash Wallet',
      type: 'CASH',
      balance: 4500.00,
      color: '#6B7280',
    }
  });

  const creditCard = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: 'ICICI Amazon Pay Card',
      type: 'CREDIT_CARD',
      balance: -12500.00, // debt
      color: '#EC4899',
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
      amount: 125000.00,
      type: 'INCOME',
      categoryId: catMap.get('Salary') || categories[0].id,
      walletId: mainWallet.id,
      date: new Date(year, month - 1, 1),
      paymentMethod: 'Bank Transfer',
      notes: 'Direct deposit',
    }
  });

  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Monthly Salary Credit',
      amount: 125000.00,
      type: 'INCOME',
      categoryId: catMap.get('Salary') || categories[0].id,
      walletId: mainWallet.id,
      date: new Date(year, month, 1),
      paymentMethod: 'Bank Transfer',
      notes: 'Direct deposit',
    }
  });

  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Dividend Payout',
      amount: 4500.00,
      type: 'INCOME',
      categoryId: catMap.get('Investment') || categories[0].id,
      walletId: mainWallet.id,
      date: new Date(year, month, 15),
      paymentMethod: 'UPI',
      notes: 'Mutual fund returns',
    }
  });

  // Create Expenses
  const templates = [
    { title: 'Reliance Fresh Groceries', catName: 'Food', min: 1200, max: 4000, wallet: mainWallet.id, pm: 'UPI' },
    { title: 'Zomato Food Delivery', catName: 'Food', min: 300, max: 1200, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Dinner at Olive Bistro', catName: 'Food', min: 2000, max: 6000, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Uber Ride Office', catName: 'Travel', min: 300, max: 800, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Auto Fare Local', catName: 'Travel', min: 50, max: 200, wallet: cashWallet.id, pm: 'Cash' },
    { title: 'HP Petrol Pump Refill', catName: 'Fuel', min: 2000, max: 4500, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Zara Store Shopping', catName: 'Shopping', min: 3000, max: 9000, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Amazon Shopping Sale', catName: 'Shopping', min: 1000, max: 15000, wallet: mainWallet.id, pm: 'UPI' },
    { title: 'Electricity Bill', catName: 'Bills', min: 2500, max: 5000, wallet: mainWallet.id, pm: 'Bank Transfer' },
    { title: 'Broadband Wifi Bill', catName: 'Bills', min: 999, max: 1200, wallet: mainWallet.id, pm: 'UPI' },
    { title: 'Gym Membership', catName: 'Entertainment', min: 1500, max: 3000, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Netflix Premium Subscription', catName: 'Entertainment', min: 649, max: 649, wallet: creditCard.id, pm: 'Credit Card' },
    { title: 'Apollo Pharmacy Medicines', catName: 'Health', min: 200, max: 1500, wallet: cashWallet.id, pm: 'Cash' },
    { title: 'Udemy Online Course', catName: 'Education', min: 499, max: 1200, wallet: mainWallet.id, pm: 'UPI' },
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
      amount: 25000.00,
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
      amount: 15000.00,
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
      amount: 8000.00,
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
      targetAmount: 249000.00,
      currentAmount: 85000.00,
      targetDate: new Date(year + 1, 0, 1),
      contributions: {
        create: [
          { amount: 50000.00, notes: 'Initial savings' },
          { amount: 35000.00, notes: 'June bonus contribution' },
        ]
      }
    }
  });

  await prisma.goal.create({
    data: {
      userId,
      workspaceId,
      name: 'Goa Vacation Fund',
      targetAmount: 60000.00,
      currentAmount: 45000.00,
      targetDate: new Date(year, month + 3, 1),
      contributions: {
        create: [
          { amount: 20000.00, notes: 'Trip savings starts' },
          { amount: 25000.00, notes: 'July contribution' }
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
      amount: 149.00,
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
      name: 'Amazon Prime India',
      amount: 1499.00,
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
      amount: 28000.00,
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
      amount: 1199.00,
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
  await seedSampleDataForUser(user.id);

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
