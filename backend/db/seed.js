const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');
const Bill = require('../models/Bill');
const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const User = require('../models/User');

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#10B981', icon: 'utensils' },
  { name: 'Transportation', color: '#6366F1', icon: 'car' },
  { name: 'Shopping', color: '#EC4899', icon: 'shopping-bag' },
  { name: 'Entertainment', color: '#F59E0B', icon: 'film' },
  { name: 'Bills & Utilities', color: '#3B82F6', icon: 'zap' },
  { name: 'Health', color: '#EF4444', icon: 'heart' },
  { name: 'Education', color: '#8B5CF6', icon: 'book-open' },
  { name: 'Other', color: '#6B7280', icon: 'more-horizontal' },
];

async function seedCategoriesForUser(userId) {
  try {
    const categories = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      user: userId
    }));
    await Category.insertMany(categories);
    console.log(`✅ Seeded default categories for user ${userId}`);
  } catch (err) {
    console.error('Error seeding categories:', err);
  }
}

async function seedSampleDataForUser(userId) {
  try {
    const categories = await Category.find({ user: userId });
    const catMap = {};
    for (const c of categories) {
      catMap[c.name] = c._id;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // --- Sample Expenses (Rupee values) ---
    const sampleExpenses = [];
    const expenseTemplates = [
      { title: 'Grocery at Reliance', catName: 'Food & Dining', amountRange: [1500, 4500] },
      { title: 'Dinner at Taj', catName: 'Food & Dining', amountRange: [2000, 8000] },
      { title: 'Swiggy Order', catName: 'Food & Dining', amountRange: [300, 1200] },
      { title: 'Uber XL', catName: 'Transportation', amountRange: [250, 950] },
      { title: 'Petrol Refill', catName: 'Transportation', amountRange: [2000, 4500] },
      { title: 'Auto Rickshaw', catName: 'Transportation', amountRange: [50, 200] },
      { title: 'Amazon Sale', catName: 'Shopping', amountRange: [1200, 15000] },
      { title: 'Zara Clothing', catName: 'Shopping', amountRange: [3000, 12000] },
      { title: 'PVR Movies', catName: 'Entertainment', amountRange: [800, 2500] },
      { title: 'IPL Tickets', catName: 'Entertainment', amountRange: [2500, 15000] },
      { title: 'BSES Electricity', catName: 'Bills & Utilities', amountRange: [1200, 5000] },
      { title: 'Airtel Broadband', catName: 'Bills & Utilities', amountRange: [800, 1500] },
      { title: 'Apollo Pharmacy', catName: 'Health', amountRange: [200, 1500] },
      { title: 'Health Checkup', catName: 'Health', amountRange: [1500, 5000] },
      { title: 'Skillshare Course', catName: 'Education', amountRange: [500, 2500] },
    ];

    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    for (let i = 5; i >= 0; i--) {
      const expMonth = (month - i + 12) % 12;
      const expYear = year - (month - i < 0 ? 1 : 0);
      const daysInMonth = new Date(expYear, expMonth + 1, 0).getDate();
      
      const numExpenses = Math.floor(rand() * 5) + 8;
      for (let j = 0; j < numExpenses; j++) {
        const template = expenseTemplates[Math.floor(rand() * expenseTemplates.length)];
        const amount = Math.round((template.amountRange[0] + rand() * (template.amountRange[1] - template.amountRange[0])) / 10) * 10;
        const day = Math.min(Math.floor(rand() * daysInMonth) + 1, daysInMonth);
        
        sampleExpenses.push({
          user: userId,
          title: template.title,
          amount,
          category: catMap[template.catName] || catMap['Other'],
          date: new Date(expYear, expMonth, day),
          payment_method: ['UPI', 'Credit Card', 'Cash'][Math.floor(rand() * 3)],
          tags: [],
          notes: ''
        });
      }
    }

    await Expense.insertMany(sampleExpenses);
    console.log(`📊 Seeded ${sampleExpenses.length} sample expenses for user ${userId}`);

    // --- Sample Budgets (INR) ---
    const budgetItems = [
      { catName: 'Food & Dining', amount: 35000 },
      { catName: 'Transportation', amount: 15000 },
      { catName: 'Shopping', amount: 20000 },
      { catName: 'Entertainment', amount: 10000 },
      { catName: 'Bills & Utilities', amount: 12000 },
      { catName: 'Health', amount: 8000 },
    ];

    const budgets = budgetItems
      .filter(b => catMap[b.catName])
      .map(b => ({
        user: userId,
        category: catMap[b.catName],
        amount: b.amount,
        period: 'monthly',
        month: month + 1,
        year: year
      }));

    await Budget.insertMany(budgets);
    console.log(`💰 Seeded budgets for user ${userId}`);

    // --- Sample Subscriptions ---
    const sampleSubs = [
      { name: 'Netflix Premium', cost: 649, billing_cycle: 'monthly', daysOffset: 12 },
      { name: 'Spotify Duo', cost: 149, billing_cycle: 'monthly', daysOffset: 5 },
      { name: 'Amazon Prime', cost: 1499, billing_cycle: 'yearly', daysOffset: 25 },
      { name: 'Hotstar Super', cost: 899, billing_cycle: 'yearly', daysOffset: 10 },
      { name: 'YouTube Premium', cost: 129, billing_cycle: 'monthly', daysOffset: 20 },
    ];

    const subs = sampleSubs.map(sub => {
      const renewalDate = new Date(now);
      renewalDate.setDate(renewalDate.getDate() + sub.daysOffset);
      return {
        user: userId,
        name: sub.name,
        cost: sub.cost,
        billing_cycle: sub.billing_cycle,
        renewal_date: renewalDate,
        payment_source: 'ICICI Credit Card',
        is_active: true
      };
    });

    await Subscription.insertMany(subs);
    console.log(`🔄 Seeded ${sampleSubs.length} sample subscriptions for user ${userId}`);

    // --- Sample Recurring Bills ---
    const sampleBills = [
      { name: 'Apartment Rent', amount: 45000, daysOffset: 2 },
      { name: 'Maid/Salary', amount: 12000, daysOffset: 5 },
      { name: 'Gym Membership', amount: 3500, daysOffset: 15 },
    ];

    const bills = sampleBills.map(b => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + b.daysOffset);
      return {
        user: userId,
        name: b.name,
        amount: b.amount,
        due_date: dueDate,
        status: 'pending'
      };
    });

    await Bill.insertMany(bills);
    console.log(`📅 Seeded sample bills for user ${userId}`);

    // --- Sample Groups ---
    const dummyUser = await User.findOne({ email: 'rahul.test@example.com' }) || 
                      await User.create({ name: 'Rahul Sharma', email: 'rahul.test@example.com', password_hash: 'dummyhash123' });
    
    const group = await Group.create({
      name: 'Goa Trip 🏖️',
      members: [userId, dummyUser._id],
      created_by: userId
    });

    await GroupExpense.create({
      group: group._id,
      title: 'Flight Tickets',
      amount: 15000,
      paid_by: userId,
      date: new Date(),
      splits: [
        { user: userId, amount_owed: 7500 },
        { user: dummyUser._id, amount_owed: 7500 }
      ]
    });

    await GroupExpense.create({
      group: group._id,
      title: 'Dinner at Thalassa',
      amount: 4000,
      paid_by: dummyUser._id,
      date: new Date(),
      splits: [
        { user: userId, amount_owed: 2000 },
        { user: dummyUser._id, amount_owed: 2000 }
      ]
    });

    console.log(`👥 Seeded sample group for user ${userId}`);

  } catch (err) {
    console.error('Error seeding sample data:', err);
  }
}

module.exports = { seedCategoriesForUser, seedSampleDataForUser };
