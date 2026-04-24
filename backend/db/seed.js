const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');

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

/**
 * Seed sample expenses, budgets, and subscriptions so analytics shows charts on first login.
 */
async function seedSampleDataForUser(userId) {
  try {
    // Get the categories we just created
    const categories = await Category.find({ user: userId });
    const catMap = {};
    for (const c of categories) {
      catMap[c.name] = c._id;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // --- Sample Expenses across 6 months ---
    const sampleExpenses = [];
    const expenseTemplates = [
      { title: 'Grocery Run', catName: 'Food & Dining', amountRange: [25, 85] },
      { title: 'Restaurant Dinner', catName: 'Food & Dining', amountRange: [30, 120] },
      { title: 'Coffee Shop', catName: 'Food & Dining', amountRange: [4, 12] },
      { title: 'Uber Ride', catName: 'Transportation', amountRange: [8, 35] },
      { title: 'Gas Fuel', catName: 'Transportation', amountRange: [30, 65] },
      { title: 'Metro Pass', catName: 'Transportation', amountRange: [20, 50] },
      { title: 'Amazon Order', catName: 'Shopping', amountRange: [15, 200] },
      { title: 'Clothing Purchase', catName: 'Shopping', amountRange: [40, 150] },
      { title: 'Movie Tickets', catName: 'Entertainment', amountRange: [12, 30] },
      { title: 'Concert Tickets', catName: 'Entertainment', amountRange: [40, 120] },
      { title: 'Electricity Bill', catName: 'Bills & Utilities', amountRange: [60, 150] },
      { title: 'Internet Bill', catName: 'Bills & Utilities', amountRange: [40, 80] },
      { title: 'Gym Membership', catName: 'Health', amountRange: [30, 60] },
      { title: 'Doctor Visit', catName: 'Health', amountRange: [50, 200] },
      { title: 'Online Course', catName: 'Education', amountRange: [10, 50] },
      { title: 'Miscellaneous', catName: 'Other', amountRange: [5, 40] },
    ];

    // Simple seeded random number generator for consistency
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    for (let i = 5; i >= 0; i--) {
      const expMonth = (month - i + 12) % 12;
      const expYear = year - (month - i < 0 ? 1 : 0);
      const daysInMonth = new Date(expYear, expMonth + 1, 0).getDate();
      
      // Pick 6-10 expenses per month
      const numExpenses = Math.floor(rand() * 5) + 6;
      for (let j = 0; j < numExpenses; j++) {
        const template = expenseTemplates[Math.floor(rand() * expenseTemplates.length)];
        const amount = Math.round((template.amountRange[0] + rand() * (template.amountRange[1] - template.amountRange[0])) * 100) / 100;
        const day = Math.min(Math.floor(rand() * daysInMonth) + 1, daysInMonth);
        
        sampleExpenses.push({
          user: userId,
          title: template.title,
          amount,
          category: catMap[template.catName] || catMap['Other'],
          date: new Date(expYear, expMonth, day),
          payment_method: ['Card', 'Cash', 'UPI/Wallet'][Math.floor(rand() * 3)],
          tags: [],
          notes: ''
        });
      }
    }

    await Expense.insertMany(sampleExpenses);
    console.log(`📊 Seeded ${sampleExpenses.length} sample expenses for user ${userId}`);

    // --- Sample Budgets for current month ---
    const budgetItems = [
      { catName: 'Food & Dining', amount: 500 },
      { catName: 'Transportation', amount: 200 },
      { catName: 'Shopping', amount: 300 },
      { catName: 'Entertainment', amount: 150 },
      { catName: 'Bills & Utilities', amount: 250 },
      { catName: 'Health', amount: 200 },
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
      { name: 'Netflix', cost: 15.99, billing_cycle: 'monthly', daysOffset: 12 },
      { name: 'Spotify Premium', cost: 9.99, billing_cycle: 'monthly', daysOffset: 5 },
      { name: 'Amazon Prime', cost: 139, billing_cycle: 'yearly', daysOffset: 45 },
      { name: 'iCloud Storage', cost: 2.99, billing_cycle: 'monthly', daysOffset: 20 },
      { name: 'GitHub Copilot', cost: 10, billing_cycle: 'monthly', daysOffset: 8 },
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
        payment_source: 'Primary Card',
        is_active: true
      };
    });

    await Subscription.insertMany(subs);
    console.log(`🔄 Seeded ${sampleSubs.length} sample subscriptions for user ${userId}`);
  } catch (err) {
    console.error('Error seeding sample data:', err);
  }
}

module.exports = { seedCategoriesForUser, seedSampleDataForUser };
