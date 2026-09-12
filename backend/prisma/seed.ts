import { prisma } from '../src/db/prisma';
import * as bcrypt from 'bcryptjs';

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
  return email.toLowerCase() === DEMO_ACCOUNT_EMAIL;
}

export async function seedSampleDataForUser(
  userId: string,
  email: string,
  options: { force?: boolean } = {}
) {
  const isDemo = await isDemoUser(userId, email);
  if (!isDemo) {
    // For non-demo users, just clear any existing data without seeding
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.goal.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.bill.deleteMany({ where: { userId } });
    await prisma.creditCard.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    console.log(`🔧 Cleared existing data for non-demo user ${userId} (${email})`);
    return;
  }

  // Check idempotency: If demo user already has transactions and cards, preserve unless force: true
  const existingTxCount = await prisma.transaction.count({ where: { userId } });
  const existingCardsCount = await prisma.creditCard.count({ where: { userId } });

  if (!options.force && existingTxCount > 0 && existingCardsCount > 0) {
    console.log(`ℹ️ Demo user ${userId} already contains ${existingTxCount} transactions and ${existingCardsCount} credit cards. Preserving existing demo data.`);
    return;
  }

  // Clear existing data for clean re-seeding
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.bill.deleteMany({ where: { userId } });
  await prisma.creditCard.deleteMany({ where: { userId } });
  await prisma.wallet.deleteMany({ where: { userId } });

  const workspaceId = await getOrCreatePersonalWorkspace(userId);

  // Fetch the user to get base currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true }
  });
  const baseCurrency = user?.baseCurrency || 'INR';

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

  // 1. Create Wallets
  const hdfcWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'HDFC Bank Account' : 'Main Checking Account',
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

  const iciciBankWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'ICICI Savings Account' : 'Secondary Savings Account',
      type: 'BANK',
      balance: scale(85200.00),
      color: '#10B981',
      currency: baseCurrency,
    }
  });

  const iciciCardWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'ICICI Amazon Pay Card' : 'Amazon Rewards Visa',
      type: 'CREDIT_CARD',
      balance: scale(-12500.00),
      color: '#EC4899',
      currency: baseCurrency,
    }
  });

  const hdfcCardWallet = await prisma.wallet.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'HDFC Regalia Credit Card' : 'Regalia Premium Card',
      type: 'CREDIT_CARD',
      balance: scale(-28400.00),
      color: '#8B5CF6',
      currency: baseCurrency,
    }
  });

  console.log(`✅ Seeded wallets for user ${userId}`);

  // 2. Create Actual Prisma CreditCard Records
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const nextMonthLate = new Date(now.getFullYear(), now.getMonth() + 1, 22);

  const iciciCreditCard = await prisma.creditCard.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'ICICI Amazon Pay Card' : 'Amazon Rewards Visa',
      limitAmount: scale(200000.00),
      totalDue: scale(12500.00),
      minimumDue: scale(1250.00),
      dueDate: nextMonth,
      billingCycleStart: 1,
      billingCycleEnd: 30,
    }
  });

  const hdfcCreditCard = await prisma.creditCard.create({
    data: {
      userId,
      workspaceId,
      name: isINR ? 'HDFC Regalia Credit Card' : 'Regalia Premium Card',
      limitAmount: scale(500000.00),
      totalDue: scale(28400.00),
      minimumDue: scale(2840.00),
      dueDate: nextMonthLate,
      billingCycleStart: 5,
      billingCycleEnd: 4,
    }
  });

  console.log(`✅ Seeded ${[iciciCreditCard, hdfcCreditCard].length} CreditCard DB records for user ${userId}`);

  // Fetch categories
  const categories = await prisma.category.findMany({ where: { userId, workspaceId } });
  const catMap = new Map(categories.map(c => [c.name, c.id]));

  const year = now.getFullYear();
  const month = now.getMonth();

  // 3. Transactions / Expenses / Incomes
  // Income 1 - Monthly Salary
  for (let i = 2; i >= 0; i--) {
    const m = (month - i + 12) % 12;
    const y = year - (month - i < 0 ? 1 : 0);
    await prisma.transaction.create({
      data: {
        userId,
        workspaceId,
        title: 'Monthly Salary Credit',
        amount: scale(125000.00),
        type: 'INCOME',
        categoryId: catMap.get('Salary') || categories[0].id,
        walletId: hdfcWallet.id,
        date: new Date(y, m, 1),
        paymentMethod: isINR ? 'Bank Transfer' : 'Direct Deposit',
        notes: 'Tech Corp Monthly Salary Deposit',
      }
    });
  }

  // Income 2 & 3 - Freelance & Dividends
  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Freelance UI/UX Consulting',
      amount: scale(35000.00),
      type: 'INCOME',
      categoryId: catMap.get('Freelance') || categories[0].id,
      walletId: iciciBankWallet.id,
      date: new Date(year, month, 10),
      paymentMethod: isINR ? 'UPI' : 'Wire Transfer',
      notes: 'Fintech App UI Design project payout',
    }
  });

  await prisma.transaction.create({
    data: {
      userId,
      workspaceId,
      title: 'Mutual Fund Dividend Payout',
      amount: scale(4500.00),
      type: 'INCOME',
      categoryId: catMap.get('Investment') || categories[0].id,
      walletId: hdfcWallet.id,
      date: new Date(year, month, 15),
      paymentMethod: isINR ? 'UPI' : 'ACH Transfer',
      notes: 'Quarterly dividend yield',
    }
  });

  // Expense Templates
  const templates = [
    { title: isINR ? 'Reliance Fresh Groceries' : 'Whole Foods Groceries', catName: 'Food', min: scale(1200), max: scale(4500), wallet: hdfcWallet.id, pm: isINR ? 'UPI' : 'Debit Card' },
    { title: isINR ? 'Zomato Food Delivery' : 'DoorDash Food Delivery', catName: 'Food', min: scale(350), max: scale(1400), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: isINR ? 'Swiggy Gourmet Dinner' : 'UberEats Special', catName: 'Food', min: scale(800), max: scale(2200), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: 'Dinner at Olive Bistro', catName: 'Food', min: scale(2500), max: scale(6500), wallet: hdfcCardWallet.id, pm: 'Credit Card' },
    { title: 'Uber Premier Office Ride', catName: 'Travel', min: scale(350), max: scale(850), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: isINR ? 'Indigo Flight Booking' : 'Delta Airlines Flight', catName: 'Travel', min: scale(5800), max: scale(12000), wallet: hdfcCardWallet.id, pm: 'Credit Card' },
    { title: isINR ? 'Metro Smartcard Auto-Recharge' : 'Subway Transit Pass', catName: 'Travel', min: scale(500), max: scale(1000), wallet: hdfcWallet.id, pm: isINR ? 'UPI' : 'Debit Card' },
    { title: isINR ? 'HP Petrol Pump Refill' : 'Chevron Gas Station', catName: 'Fuel', min: scale(2500), max: scale(4500), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: isINR ? 'Shell V-Power Premium Fuel' : 'Shell Premium Gas', catName: 'Fuel', min: scale(3000), max: scale(5000), wallet: hdfcCardWallet.id, pm: 'Credit Card' },
    { title: 'Zara Flagship Store Shopping', catName: 'Shopping', min: scale(4500), max: scale(12500), wallet: hdfcCardWallet.id, pm: 'Credit Card' },
    { title: isINR ? 'Amazon Great Indian Sale' : 'Amazon Prime Day Shopping', catName: 'Shopping', min: scale(2500), max: scale(18000), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: 'Apple Store Accessories', catName: 'Shopping', min: scale(2900), max: scale(9900), wallet: hdfcCardWallet.id, pm: 'Credit Card' },
    { title: 'Tata Power Electricity Bill', catName: 'Bills', min: scale(3200), max: scale(4800), wallet: hdfcWallet.id, pm: 'Bank Transfer' },
    { title: 'Airtel Fiber Broadband Bill', catName: 'Bills', min: scale(1199), max: scale(1499), wallet: hdfcWallet.id, pm: isINR ? 'UPI' : 'Bank Transfer' },
    { title: 'Cult.fit Gym & Wellness', catName: 'Entertainment', min: scale(1800), max: scale(3500), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: 'Netflix Premium 4K Plan', catName: 'Entertainment', min: scale(649), max: scale(649), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: 'Spotify Premium Duo Plan', catName: 'Entertainment', min: scale(149), max: scale(149), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: 'ChatGPT Plus Subscription', catName: 'Education', min: scale(1999), max: scale(1999), wallet: iciciCardWallet.id, pm: 'Credit Card' },
    { title: isINR ? 'Apollo Pharmacy Medicines' : 'CVS Pharmacy Medicines', catName: 'Health', min: scale(450), max: scale(2200), wallet: cashWallet.id, pm: 'Cash' },
    { title: 'Udemy AI & Python Masterclass', catName: 'Education', min: scale(699), max: scale(1499), wallet: hdfcWallet.id, pm: isINR ? 'UPI' : 'Debit Card' },
  ];

  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280.0;
  };

  const expenseData = [];
  for (let i = 2; i >= 0; i--) {
    const curMonth = (month - i + 12) % 12;
    const curYear = year - (month - i < 0 ? 1 : 0);
    const numDays = new Date(curYear, curMonth + 1, 0).getDate();
    const count = 16 + Math.floor(rand() * 8);

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
        tags: ['demo-spends', template.catName.toLowerCase()],
        notes: 'Verified expense record',
      });
    }
  }

  await prisma.transaction.createMany({ data: expenseData });
  console.log(`✅ Seeded ${expenseData.length} expense transactions for user ${userId}`);

  // 4. Budgets
  const budgetList = [
    { cat: 'Food', amount: scale(25000.00) },
    { cat: 'Shopping', amount: scale(15000.00) },
    { cat: 'Travel', amount: scale(10000.00) },
    { cat: 'Bills', amount: scale(12000.00) },
    { cat: 'Entertainment', amount: scale(6000.00) },
  ];

  for (const b of budgetList) {
    const catId = catMap.get(b.cat);
    if (catId) {
      await prisma.budget.create({
        data: {
          userId,
          workspaceId,
          categoryId: catId,
          amount: b.amount,
          period: 'MONTHLY',
          startDate: new Date(year, month, 1),
          endDate: new Date(year, month + 1, 0),
        }
      });
    }
  }
  console.log(`✅ Seeded budgets for user ${userId}`);

  // 5. Goals
  await prisma.goal.create({
    data: {
      userId,
      workspaceId,
      name: 'Emergency Fund',
      targetAmount: scale(300000.00),
      currentAmount: scale(180000.00),
      targetDate: new Date(year + 1, 5, 30),
      contributions: {
        create: [
          { amount: scale(100000.00), notes: 'Initial lump sum deposit' },
          { amount: scale(40000.00), notes: 'June monthly contribution' },
          { amount: scale(40000.00), notes: 'July monthly contribution' }
        ]
      }
    }
  });

  await prisma.goal.create({
    data: {
      userId,
      workspaceId,
      name: 'MacBook Pro 16" M4',
      targetAmount: scale(249000.00),
      currentAmount: scale(120000.00),
      targetDate: new Date(year + 1, 0, 1),
      contributions: {
        create: [
          { amount: scale(70000.00), notes: 'Initial tech savings' },
          { amount: scale(50000.00), notes: 'Mid-year bonus contribution' }
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

  await prisma.goal.create({
    data: {
      userId,
      workspaceId,
      name: 'Investment Corpus',
      targetAmount: scale(500000.00),
      currentAmount: scale(250000.00),
      targetDate: new Date(year + 2, 11, 31),
      contributions: {
        create: [
          { amount: scale(150000.00), notes: 'SIP & Mutual fund holdings' },
          { amount: scale(100000.00), notes: 'Equity allocation' }
        ]
      }
    }
  });

  console.log(`✅ Seeded savings goals for user ${userId}`);

  // 6. Subscriptions
  const subscriptionList = [
    { name: 'Netflix Premium 4K', amount: scale(649.00), cycle: 'MONTHLY', days: 12, wallet: iciciCardWallet.id },
    { name: 'Spotify Premium Duo', amount: scale(149.00), cycle: 'MONTHLY', days: 5, wallet: iciciCardWallet.id },
    { name: isINR ? 'Amazon Prime India' : 'Amazon Prime Membership', amount: scale(1499.00), cycle: 'YEARLY', days: 180, wallet: hdfcCardWallet.id },
    { name: 'ChatGPT Plus AI Assistant', amount: scale(1999.00), cycle: 'MONTHLY', days: 18, wallet: iciciCardWallet.id },
    { name: 'YouTube Premium Family', amount: scale(189.00), cycle: 'MONTHLY', days: 22, wallet: hdfcCardWallet.id }
  ];

  for (const s of subscriptionList) {
    const nextDate = new Date(now.getTime() + s.days * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
      data: {
        userId,
        workspaceId,
        name: s.name,
        amount: s.amount,
        billingCycle: s.cycle,
        nextBillingDate: nextDate,
        walletId: s.wallet,
        isActive: true,
      }
    });
  }

  // 7. Bills
  const billsList = [
    { name: 'Tata Power Electricity Bill', amount: scale(3450.00), days: 5, isPaid: false, category: 'Utilities' },
    { name: 'Airtel Fiber Broadband Bill', amount: scale(1199.00), days: 10, isPaid: false, category: 'Utilities' },
    { name: 'ICICI Credit Card Statement', amount: scale(12500.00), days: 15, isPaid: false, category: 'Credit Card' },
    { name: 'Jio Postpaid Mobile Bill', amount: scale(799.00), days: -5, isPaid: true, category: 'Utilities' }
  ];

  for (const b of billsList) {
    const dueDate = new Date(now.getTime() + b.days * 24 * 60 * 60 * 1000);
    await prisma.bill.create({
      data: {
        userId,
        workspaceId,
        name: b.name,
        amount: b.amount,
        dueDate,
        isPaid: b.isPaid,
        category: b.category,
      }
    });
  }

  console.log(`✅ Seeded subscriptions and bills for user ${userId}`);

  // 8. Friends & Groups Demo Data
  try {
    // Create demo friend accounts if missing
    let friend1 = await prisma.user.findUnique({ where: { email: 'rohan@example.com' } });
    if (!friend1) {
      const passHash = await bcrypt.hash('password123', 10);
      friend1 = await prisma.user.create({
        data: {
          name: 'Rohan Sharma',
          displayName: 'Rohan',
          email: 'rohan@example.com',
          passwordHash: passHash,
          baseCurrency: 'INR',
          isVerified: true,
          onboardingComplete: true,
        }
      });
    }

    let friend2 = await prisma.user.findUnique({ where: { email: 'priya@example.com' } });
    if (!friend2) {
      const passHash = await bcrypt.hash('password123', 10);
      friend2 = await prisma.user.create({
        data: {
          name: 'Priya Patel',
          displayName: 'Priya',
          email: 'priya@example.com',
          passwordHash: passHash,
          baseCurrency: 'INR',
          isVerified: true,
          onboardingComplete: true,
        }
      });
    }

    // Connect friendships
    await prisma.friend.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: friend1.id } },
      update: { status: 'ACCEPTED', acknowledged: true, netBalance: scale(2400.00) },
      create: { fromUserId: userId, toUserId: friend1.id, status: 'ACCEPTED', acknowledged: true, netBalance: scale(2400.00) }
    });

    await prisma.friend.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: friend2.id } },
      update: { status: 'ACCEPTED', acknowledged: true, netBalance: scale(-850.00) },
      create: { fromUserId: userId, toUserId: friend2.id, status: 'ACCEPTED', acknowledged: true, netBalance: scale(-850.00) }
    });

    // Create Group expense record
    const existingGroup = await prisma.group.findFirst({ where: { createdBy: userId, name: 'Weekend Trip to Lonavala' } });
    if (!existingGroup) {
      const group = await prisma.group.create({
        data: {
          name: 'Weekend Trip to Lonavala',
          createdBy: userId,
          members: {
            connect: [{ id: userId }, { id: friend1.id }, { id: friend2.id }]
          }
        }
      });

      await prisma.groupExpense.create({
        data: {
          groupId: group.id,
          title: 'Villa Stay Booking',
          amount: scale(12000.00),
          date: new Date(year, month, 5),
          paidById: userId,
          splits: {
            create: [
              { userId: userId, amountOwed: scale(4000.00) },
              { userId: friend1.id, amountOwed: scale(4000.00) },
              { userId: friend2.id, amountOwed: scale(4000.00) }
            ]
          }
        }
      });

      await prisma.groupExpense.create({
        data: {
          groupId: group.id,
          title: 'Dinner & Refreshments',
          amount: scale(4500.00),
          date: new Date(year, month, 6),
          paidById: friend1.id,
          splits: {
            create: [
              { userId: userId, amountOwed: scale(1500.00) },
              { userId: friend1.id, amountOwed: scale(1500.00) },
              { userId: friend2.id, amountOwed: scale(1500.00) }
            ]
          }
        }
      });
    }

    console.log(`✅ Seeded friends & group records for user ${userId}`);
  } catch (err) {
    console.warn('⚠️ Friend/Group demo seeding skipped or non-fatal error:', err);
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  const email = DEMO_ACCOUNT_EMAIL;
  const name = 'Alex Mercer';
  const passwordHash = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        displayName: 'Alex',
        email,
        passwordHash,
        baseCurrency: 'INR',
        country: 'India',
        timezone: 'Asia/Kolkata',
        monthlyIncome: '125000',
        preferredGoal: 'Build savings and invest consistently',
        shortTermGoal: 'Emergency fund',
        longTermGoal: 'Build a strong investment portfolio',
        onboardingComplete: true,
        plan: 'PRO',
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
    console.log(`✅ Created demo user ${email}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        displayName: 'Alex',
        passwordHash,
        baseCurrency: 'INR',
        country: 'India',
        timezone: 'Asia/Kolkata',
        monthlyIncome: '125000',
        preferredGoal: 'Build savings and invest consistently',
        shortTermGoal: 'Emergency fund',
        longTermGoal: 'Build a strong investment portfolio',
        onboardingComplete: true,
        plan: 'PRO',
        isVerified: true,
      }
    });
    console.log(`✅ Updated existing demo user ${email} profile & PRO plan status`);
  }

  await seedCategoriesForUser(user.id);
  await seedSampleDataForUser(user.id, user.email, { force: true });

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
