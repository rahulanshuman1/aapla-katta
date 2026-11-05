const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  { key: { type: String, unique: true, default: 'main' }, data: { type: mongoose.Schema.Types.Mixed, default: {} } },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('Settings', settingsSchema);
