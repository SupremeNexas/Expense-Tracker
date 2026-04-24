const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  limit_amount: { type: Number, required: true },
  total_due: { type: Number, default: 0 },
  minimum_due: { type: Number, default: 0 },
  due_date: { type: Date, required: true },
  billing_cycle_start: { type: Number },
  billing_cycle_end: { type: Number }
});

module.exports = mongoose.model('CreditCard', creditCardSchema);
