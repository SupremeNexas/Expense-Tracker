require('dotenv').config({ path: '../.env' }); // Wait, from backend/db/, the path is ../.env relative to the script file, but dotenv uses CWD if not absolute.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { seedCategoriesForUser, seedSampleDataForUser } = require('./seed');
const User = require('../models/User');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');
const Bill = require('../models/Bill');
const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const GroupSettlement = require('../models/GroupSettlement');

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Clean up existing data to avoid duplicates
    await Category.deleteMany({});
    await Expense.deleteMany({});
    await Budget.deleteMany({});
    await Subscription.deleteMany({});
    await Bill.deleteMany({});
    await Group.deleteMany({});
    await GroupExpense.deleteMany({});
    await GroupSettlement.deleteMany({});

    console.log('Cleared existing data.');

    const users = await User.find({});
    for (const user of users) {
      console.log(`Seeding data for user ${user.email}...`);
      await seedCategoriesForUser(user._id);
      await seedSampleDataForUser(user._id);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

runSeed();
