const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  due_date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
});

module.exports = mongoose.model('Bill', billSchema);
