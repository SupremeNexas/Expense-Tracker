const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  cost: { type: Number, required: true },
  billing_cycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  renewal_date: { type: Date, required: true },
  payment_source: { type: String },
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
