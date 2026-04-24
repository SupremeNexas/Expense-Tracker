const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  target_amount: { type: Number, required: true },
  current_amount: { type: Number, default: 0 },
  deadline: { type: Date },
  color: { type: String },
  icon: { type: String }
});

module.exports = mongoose.model('Goal', goalSchema);
