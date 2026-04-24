const mongoose = require('mongoose');

const groupExpenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splits: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount_owed: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('GroupExpense', groupExpenseSchema);
