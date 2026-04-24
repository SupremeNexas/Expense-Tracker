const mongoose = require('mongoose');

const groupSettlementSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paid_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true }
});

module.exports = mongoose.model('GroupSettlement', groupSettlementSchema);
